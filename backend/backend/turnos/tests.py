"""
Tests para la app 'turnos'.
Cubre: disponibilidad de slots y creación de turnos por ciudadanos.

Ejecutar con:
    python manage.py test turnos
"""

import json
from datetime import date, timedelta
from django.test import TestCase, Client
from django.urls import reverse
from .models import Turno


def proximo_dia_habil():
    """Devuelve el próximo día hábil (lunes a viernes, no feriado)."""
    FERIADOS = [
        "01-01","03-03","03-04","04-02","05-01","05-25",
        "06-20","07-09","08-17","10-12","11-20","12-08","12-25"
    ]
    d = date.today() + timedelta(days=1)
    while True:
        if d.weekday() < 5 and f"{d.month:02d}-{d.day:02d}" not in FERIADOS:
            return d
        d += timedelta(days=1)


def proximo_fin_de_semana():
    """Devuelve el próximo sábado."""
    d = date.today() + timedelta(days=1)
    while d.weekday() != 5:
        d += timedelta(days=1)
    return d


class DisponibilidadTests(TestCase):
    """Pruebas del endpoint público GET /api/turnos/disponibilidad/."""

    def setUp(self):
        self.client = Client()
        self.url = reverse('api_disponibilidad')
        self.fecha_habil = proximo_dia_habil().isoformat()
        self.fecha_fin_semana = proximo_fin_de_semana().isoformat()

    def test_error_si_falta_parametro_fecha(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_error_si_formato_de_fecha_invalido(self):
        response = self.client.get(self.url, {'fecha': '30-06-2026'})
        self.assertEqual(response.status_code, 400)

    def test_fin_de_semana_no_es_habil(self):
        response = self.client.get(self.url, {'fecha': self.fecha_fin_semana})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['habil'])
        self.assertEqual(data['slots'], [])

    def test_fecha_pasada_no_es_habil(self):
        ayer = (date.today() - timedelta(days=1)).isoformat()
        response = self.client.get(self.url, {'fecha': ayer})
        data = response.json()
        self.assertFalse(data['habil'])

    def test_dia_habil_retorna_slots(self):
        response = self.client.get(self.url, {'fecha': self.fecha_habil})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['habil'])
        self.assertIsInstance(data['slots'], list)
        self.assertGreater(len(data['slots']), 0)

    def test_slots_tienen_campos_esperados(self):
        response = self.client.get(self.url, {'fecha': self.fecha_habil})
        data = response.json()
        slot = data['slots'][0]
        self.assertIn('hora', slot)
        self.assertIn('libres', slot)
        self.assertIn('lleno', slot)

    def test_slot_ocupado_aparece_como_lleno(self):
        """Después de crear un turno, el slot debe aparecer como lleno."""
        fecha = proximo_dia_habil()
        Turno.objects.create(
            tramite='dni_nuevo',
            nombre='Juan Pérez',
            dni='12345678',
            email='juan@test.com',
            telefono='3814000000',
            direccion='Av. Belgrano 100',
            fecha=fecha,
            hora='08:00',
            estado='pendiente',
        )
        response = self.client.get(self.url, {'fecha': fecha.isoformat()})
        data = response.json()
        slot_08 = next((s for s in data['slots'] if s['hora'] == '08:00'), None)
        self.assertIsNotNone(slot_08)
        self.assertTrue(slot_08['lleno'])


class CrearTurnoTests(TestCase):
    """Pruebas del endpoint público POST /api/turnos/crear/."""

    def setUp(self):
        self.client = Client()
        self.url = reverse('api_crear_turno')
        self.fecha_habil = proximo_dia_habil().isoformat()
        self.datos_validos = {
            'tramite':   'dni_nuevo',
            'nombre':    'María González',
            'dni':       '30123456',
            'email':     'maria@test.com',
            'telefono':  '3814111111',
            'direccion': 'Av. Libertad 200',
            'fecha':     self.fecha_habil,
            'hora':      '09:00',
        }

    def _post(self, data):
        return self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json',
        )

    def test_crea_turno_con_datos_validos(self):
        response = self._post(self.datos_validos)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('ok'))
        self.assertIn('numero_turno', data)

    def test_turno_queda_guardado_en_base_de_datos(self):
        self._post(self.datos_validos)
        self.assertEqual(Turno.objects.filter(email='maria@test.com').count(), 1)

    def test_error_si_faltan_campos(self):
        datos_incompletos = {'nombre': 'Solo Nombre', 'email': 'x@x.com'}
        response = self._post(datos_incompletos)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_error_si_fecha_no_es_habil(self):
        datos = {**self.datos_validos, 'fecha': proximo_fin_de_semana().isoformat()}
        response = self._post(datos)
        self.assertEqual(response.status_code, 400)

    def test_error_si_hora_invalida(self):
        """Hora fuera del rango 08:00-12:00 debe ser rechazada."""
        datos = {**self.datos_validos, 'hora': '13:00'}
        response = self._post(datos)
        self.assertEqual(response.status_code, 400)

    def test_error_si_slot_ya_ocupado(self):
        """No se pueden crear dos turnos en el mismo slot."""
        self._post(self.datos_validos)
        datos2 = {**self.datos_validos, 'email': 'otro@test.com', 'dni': '99999999'}
        response = self._post(datos2)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_turno_tiene_estado_pendiente_por_defecto(self):
        self._post(self.datos_validos)
        turno = Turno.objects.get(email='maria@test.com')
        self.assertEqual(turno.estado, 'pendiente')

    def test_endpoint_es_publico_no_requiere_login(self):
        """Cualquier ciudadano puede crear un turno sin autenticarse."""
        response = self._post(self.datos_validos)
        self.assertNotEqual(response.status_code, 302)
        self.assertEqual(response.status_code, 200)
