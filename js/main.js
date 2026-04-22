/**
 * main.js — Registro Civil (interfaz pública)
 * Carga noticias desde localStorage y gestiona el modal.
 */

/* ── Datos por defecto si localStorage está vacío ── */
const NOTICIAS_DEFAULT = [
  {
    id: 1,
    titulo: 'Nuevas medidas para el registro de nacimientos en hospitales públicos',
    fecha: '2026-04-10',
    tag: 'Institucional',
    icono: 'bi-newspaper',
    cuerpo: 'A partir del 15 de abril, todos los hospitales públicos de la provincia contarán con un delegado del Registro Civil para la inscripción inmediata de nacimientos. Las familias no deberán trasladarse a las oficinas centrales; el trámite se realizará directamente en la maternidad.'
  },
  {
    id: 2,
    titulo: 'El Registro Civil amplía su horario durante el mes de mayo',
    fecha: '2026-04-05',
    tag: 'Trámites',
    icono: 'bi-megaphone-fill',
    cuerpo: 'Durante todo el mes de mayo, las sedes del Registro Civil atenderán de 8:00 a 15:00 hs. de lunes a viernes, con el objetivo de reducir la demanda acumulada de trámites. Se recomienda igualmente solicitar turno previo a través del sitio web oficial.'
  },
  {
    id: 3,
    titulo: 'Sistema de actas digitales: avance en la modernización del Registro',
    fecha: '2026-04-01',
    tag: 'Digitalización',
    icono: 'bi-file-earmark-text-fill',
    cuerpo: 'La provincia avanza en la digitalización de todas sus actas de estado civil. Este sistema permitirá solicitar copias de partidas en formato digital con firma electrónica, sin necesidad de concurrir personalmente a las oficinas. Disponible en el segundo semestre de 2026.'
  }
];

/* ── Helpers ── */
function formatFecha(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

/* ── Cargar noticias ── */
function cargarNoticias() {
  let noticias;
  try {
    const stored = localStorage.getItem('rc_noticias');
    noticias = stored ? JSON.parse(stored) : NOTICIAS_DEFAULT;
  } catch (e) {
    noticias = NOTICIAS_DEFAULT;
  }

  // Mostrar solo las 3 más recientes
  const visibles = noticias.slice(0, 3);

  const iconos = ['bi-newspaper', 'bi-megaphone-fill', 'bi-file-earmark-text-fill'];
  const grid = document.getElementById('noticias-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (visibles.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="bi bi-inbox fs-1 d-block mb-2"></i>Sin noticias disponibles.</div>';
    return;
  }

  visibles.forEach((n, idx) => {
    const icono = n.icono || iconos[idx % iconos.length];
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 d-flex fade-in';
    col.style.animationDelay = `${idx * 0.08}s`;

    col.innerHTML = `
      <div class="news-card w-100">
        <div class="news-thumb-placeholder">
          <i class="bi ${icono}"></i>
        </div>
        <div class="news-body">
          <span class="news-tag">${n.tag || 'Noticia'}</span>
          <div class="news-title">${n.titulo}</div>
          <div class="news-date"><i class="bi bi-calendar3"></i> ${formatFecha(n.fecha)}</div>
          <button class="btn-rc btn-ver-noticia"
            data-titulo="${n.titulo}"
            data-fecha="${formatFecha(n.fecha)}"
            data-cuerpo="${n.cuerpo}">
            Ver noticia
          </button>
        </div>
      </div>`;
    grid.appendChild(col);
  });

  // Delegar eventos de click sobre los botones dinámicos
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-ver-noticia');
    if (!btn) return;
    document.getElementById('modalNoticiaTitulo').textContent = btn.dataset.titulo;
    document.getElementById('modalNoticiaFecha').innerHTML   = `<i class="bi bi-calendar3"></i> ${btn.dataset.fecha}`;
    document.getElementById('modalNoticiaCuerpo').textContent = btn.dataset.cuerpo;
    new bootstrap.Modal(document.getElementById('modalNoticia')).show();
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', cargarNoticias);
