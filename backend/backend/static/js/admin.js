/**
 * admin.js — Panel Administrativo | Registro Civil Santiago del Estero
 * Maneja: autenticación, turnos, usuarios, noticias — todo en localStorage.
 */

'use strict';

/* ════════════════════════════════════════════════
  1. CONFIGURACIÓN Y CONSTANTES
   ════════════════════════════════════════════════ */

// Credenciales obfuscadas (base64). No exposición directa en código.
const _CV = [
  atob('cmVnaXN0cm9DaXZpbEBnbWFpbC5jb20='), // registroCivil@gmail.com
  atob('MTQyMg==')                            // 1422
];

const STORAGE_KEYS = {
  SESSION:  'rc_session',
  TURNOS:   'rc_turnos',
  USUARIOS: 'rc_usuarios',
  NOTICIAS: 'rc_noticias'
};

/* ════════════════════════════════════════════════
   2. DATOS INICIALES (seed)
   ════════════════════════════════════════════════ */

const SEED_TURNOS = [
  { id:1, numero:'T-001', fecha:'2026-04-17', hora:'09:00', nombre:'María García',    dni:'32456789', tramite:'Nacimiento',    estado:'Pendiente'  },
  { id:2, numero:'T-002', fecha:'2026-04-17', hora:'09:30', nombre:'Carlos López',    dni:'28901234', tramite:'Matrimonio',    estado:'Asistió'    },
  { id:3, numero:'T-003', fecha:'2026-04-17', hora:'10:00', nombre:'Ana Rodríguez',   dni:'35678901', tramite:'Identificación',estado:'Pendiente'  },
  { id:4, numero:'T-004', fecha:'2026-04-18', hora:'09:00', nombre:'Pedro Martínez',  dni:'30123456', tramite:'Defunción',     estado:'No asistió' },
  { id:5, numero:'T-005', fecha:'2026-04-18', hora:'09:30', nombre:'Laura Fernández', dni:'33567890', tramite:'Nacimiento',    estado:'Cancelado'  },
  { id:6, numero:'T-006', fecha:'2026-04-19', hora:'10:30', nombre:'Jorge Sánchez',   dni:'27890123', tramite:'Matrimonio',    estado:'Pendiente'  },
  { id:7, numero:'T-007', fecha:'2026-04-19', hora:'11:00', nombre:'Sofía Herrera',   dni:'38901234', tramite:'Identificación',estado:'Asistió'    }
];

const SEED_NOTICIAS = [
  { id:1, titulo:'Nuevas medidas para el registro de nacimientos en hospitales públicos', fecha:'2026-04-10', tag:'Institucional', icono:'bi-newspaper',            cuerpo:'A partir del 15 de abril, todos los hospitales públicos de la provincia contarán con un delegado del Registro Civil para la inscripción inmediata de nacimientos. Las familias no deberán trasladarse a las oficinas centrales.' },
  { id:2, titulo:'El Registro Civil amplía su horario durante el mes de mayo',            fecha:'2026-04-05', tag:'Trámites',      icono:'bi-megaphone-fill',        cuerpo:'Durante todo el mes de mayo, las sedes del Registro Civil atenderán de 8:00 a 15:00 hs. de lunes a viernes, con el objetivo de reducir la demanda acumulada de trámites.' },
  { id:3, titulo:'Sistema de actas digitales: avance en la modernización del Registro',   fecha:'2026-04-01', tag:'Digitalización',icono:'bi-file-earmark-text-fill',cuerpo:'La provincia avanza en la digitalización de todas sus actas de estado civil. Este sistema permitirá solicitar copias en formato digital con firma electrónica.' }
];

const SEED_USUARIOS = [
  { id:1, nombre:'Administrador Principal', email:'registroCivil@gmail.com', rol:'admin',    password: btoa('1422') }
];

/* ════════════════════════════════════════════════
   3. STORAGE HELPERS
   ════════════════════════════════════════════════ */

const Store = {
  get(key)       { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); },
  init(key, def) { if (!localStorage.getItem(key)) Store.set(key, def); },

  // Inicializar todos los datos si no existen
initAll() {
    Store.init(STORAGE_KEYS.TURNOS,   SEED_TURNOS);
    Store.init(STORAGE_KEYS.NOTICIAS, SEED_NOTICIAS);
},

  nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }
};

/* ════════════════════════════════════════════════
   4. AUTENTICACIÓN
   ════════════════════════════════════════════════ */

const Auth = {
  check(email, pass) {
    // Verifica contra credenciales maestras
    if (email === _CV[0] && pass === _CV[1]) return true;
    // Verifica contra usuarios creados en localStorage
    const usuarios = Store.get(STORAGE_KEYS.USUARIOS) || [];
    return usuarios.some(u => u.email === email && atob(u.password || '') === pass);
  },

  login(email) {
    Store.set(STORAGE_KEYS.SESSION, { loggedIn: true, user: email, ts: Date.now() });
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.location.href = '/login/';
  },

  isLogged() {
    const s = Store.get(STORAGE_KEYS.SESSION);
    return s && s.loggedIn === true;
  },

  currentUser() {
    const s = Store.get(STORAGE_KEYS.SESSION);
    return s ? s.user : null;
  },

  // Guard: redirige si no está logueado
  guard() {
    if (!Auth.isLogged()) {
      window.location.href = '/login/';
    }
  }
};

/* ════════════════════════════════════════════════
   5. TOAST NOTIFICATIONS
   ════════════════════════════════════════════════ */

const Toast = {
  show(msg, type = 'success') {
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const container = document.getElementById('adm-toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `adm-toast ${type}`;
    el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'none';
      el.style.opacity   = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = 'all .3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
};

/* ════════════════════════════════════════════════
  6. NAVEGACIÓN (sidebar)
   ════════════════════════════════════════════════ */

function initNav() {
  document.querySelectorAll('.adm-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;

      // Activar ítem del sidebar
      document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Mostrar sección correspondiente
      document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById(`sec-${target}`);
      if (sec) sec.classList.add('active');

      // Inicializar módulo al activar sección
      if (target === 'tramites-panel') ModTramites.init();
      if (target === 'sedes')          ModSedes.init();
      if (target === 'usuarios')       ModUsuarios.init();

      // Cerrar sidebar y overlay en mobile — delegado a cerrarSidebar()
      if (typeof cerrarSidebar === 'function') cerrarSidebar();
    });
  });
  // El toggle del hamburguesa lo maneja toggleAdmSidebar() desde el HTML
}

/* ════════════════════════════════════════════════
   7. MÓDULO TURNOS
   ════════════════════════════════════════════════ */

const ModTurnos = {
  ESTADOS: ['Pendiente', 'Asistió', 'No asistió', 'Cancelado'],
  TRAMITES: ['Nacimiento', 'Identificación', 'Matrimonio', 'Defunción'],

  load()   { return Store.get(STORAGE_KEYS.TURNOS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.TURNOS, arr); },

  badgeClass(estado) {
    return { Pendiente: 'badge-pendiente', Asistió: 'badge-asistio', 'No asistió': 'badge-noasistio', Cancelado: 'badge-cancelado' }[estado] || 'badge-pendiente';
  },

  render(filtro = '') {
    const turnos = this.load();
    const tbody  = document.getElementById('turnos-tbody');
    const stats  = { total: turnos.length, pendiente: 0, asistio: 0, cancelado: 0 };

    turnos.forEach(t => {
      if (t.estado === 'Pendiente')   stats.pendiente++;
      if (t.estado === 'Asistió')     stats.asistio++;
      if (t.estado === 'Cancelado' || t.estado === 'No asistió') stats.cancelado++;
    });

    // Actualizar stat cards
    document.getElementById('stat-total-turnos')?.innerText && (document.getElementById('stat-total-turnos').innerText = stats.total);
    document.getElementById('stat-pendientes')  ?. innerText !== undefined && (document.getElementById('stat-pendientes').innerText = stats.pendiente);
    document.getElementById('stat-asistio')     ?. innerText !== undefined && (document.getElementById('stat-asistio').innerText    = stats.asistio);
    document.getElementById('stat-cancelado')   ?. innerText !== undefined && (document.getElementById('stat-cancelado').innerText  = stats.cancelado);

    // Filtrar
    const q = filtro.toLowerCase();
    const visible = q ? turnos.filter(t =>
      t.nombre.toLowerCase().includes(q) ||
      t.dni.includes(q) ||
      t.tramite.toLowerCase().includes(q) ||
      t.numero.toLowerCase().includes(q) ||
      t.estado.toLowerCase().includes(q)
    ) : turnos;

    if (!tbody) return;
    if (visible.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No se encontraron turnos.</td></tr>`;
      return;
    }

    tbody.innerHTML = visible.map(t => `
      <tr data-id="${t.id}">
        <td><strong>${t.numero}</strong></td>
        <td>${t.fecha}</td>
        <td>${t.hora}</td>
        <td>${t.nombre}</td>
        <td><code style="font-size:12px;">${t.dni}</code></td>
        <td>${t.tramite}</td>
        <td>
          <select class="estado-select" data-turno-id="${t.id}" title="Cambiar estado">
            ${this.ESTADOS.map(e => `<option value="${e}" ${e === t.estado ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn-adm-icon trash" data-delete-turno="${t.id}" title="Eliminar">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>`).join('');

    // Evento cambio de estado
    tbody.querySelectorAll('.estado-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const id = parseInt(e.target.dataset.turnoId);
        const turnos = this.load();
        const idx = turnos.findIndex(t => t.id === id);
        if (idx !== -1) {
          turnos[idx].estado = e.target.value;
          this.save(turnos);
          Toast.show(`Turno ${turnos[idx].numero} actualizado a "${e.target.value}"`, 'success');
          this.render(filtro);
        }
      });
    });

    // Eliminar turno
    tbody.querySelectorAll('[data-delete-turno]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.deleteTurno);
        if (!confirm('¿Eliminar este turno?')) return;
        const turnos = this.load().filter(t => t.id !== id);
        this.save(turnos);
        Toast.show('Turno eliminado', 'warning');
        this.render(filtro);
      });
    });
  },

  openModal(turno = null) {
    const titulo = document.getElementById('modal-turno-titulo');
    const form   = document.getElementById('form-turno');
    if (!form) return;

    if (turno) {
      titulo.textContent = 'Editar Turno';
      form['turno-id'].value      = turno.id;
      form['turno-numero'].value  = turno.numero;
      form['turno-fecha'].value   = turno.fecha;
      form['turno-hora'].value    = turno.hora;
      form['turno-nombre'].value  = turno.nombre;
      form['turno-dni'].value     = turno.dni;
      form['turno-tramite'].value = turno.tramite;
      form['turno-estado'].value  = turno.estado;
    } else {
      titulo.textContent = 'Nuevo Turno';
      form.reset();
      const turnos = this.load();
      const nextNum = turnos.length + 1;
      form['turno-numero'].value = `T-${String(nextNum).padStart(3,'0')}`;
      const hoy = new Date().toISOString().split('T')[0];
      form['turno-fecha'].value = hoy;
    }
    new bootstrap.Modal(document.getElementById('modal-turno')).show();
  },

  handleFormSave() {
    const form   = document.getElementById('form-turno');
    if (!form) return;
    const id     = form['turno-id'].value ? parseInt(form['turno-id'].value) : null;
    const datos  = {
      numero:  form['turno-numero'].value.trim(),
      fecha:   form['turno-fecha'].value,
      hora:    form['turno-hora'].value,
      nombre:  form['turno-nombre'].value.trim(),
      dni:     form['turno-dni'].value.trim(),
      tramite: form['turno-tramite'].value,
      estado:  form['turno-estado'].value
    };
    if (!datos.nombre || !datos.dni || !datos.fecha) { Toast.show('Completá los campos requeridos', 'error'); return; }

    const turnos = this.load();
    if (id) {
      const idx = turnos.findIndex(t => t.id === id);
      if (idx !== -1) turnos[idx] = { ...turnos[idx], ...datos };
      Toast.show('Turno actualizado correctamente', 'success');
    } else {
      turnos.push({ id: Store.nextId(turnos), ...datos });
      Toast.show('Turno creado correctamente', 'success');
    }
    this.save(turnos);
    bootstrap.Modal.getInstance(document.getElementById('modal-turno'))?.hide();
    this.render();
  },

  init() {
    // Filtro búsqueda
    document.getElementById('filtro-turno')?.addEventListener('input', e => this.render(e.target.value));
    document.getElementById('filtro-tramite')?.addEventListener('change', e => this.render(e.target.value));

    // Botón nuevo
    document.getElementById('btn-nuevo-turno')?.addEventListener('click', () => this.openModal());

    // Guardar modal
    document.getElementById('btn-guardar-turno')?.addEventListener('click', () => this.handleFormSave());

    this.render();
  }
};

/* ════════════════════════════════════════════════
  8. MÓDULO USUARIOS
   ════════════════════════════════════════════════ */

const ModUsuarios = {
  async cargar() {
    const r = await fetch('/api/usuarios/');
    const data = await r.json();
    return data.usuarios || [];
  },

  render(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;

    const stat = document.getElementById('stat-total-usuarios');
    if (stat) stat.innerText = usuarios.length;

    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No hay usuarios registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = usuarios.map(u => `
      <tr data-uid="${u.id}">
        <td><strong>${u.nombre}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge-estado ${u.rol === 'super_admin' ? 'badge-admin' : 'badge-operador'}">
          ${u.rol === 'super_admin' ? 'Super Admin' : 'Operador'}
        </span></td>
        <td><span class="badge-estado ${u.activo ? 'badge-asistio' : 'badge-noasistio'}">
          ${u.activo ? 'Activo' : 'Inactivo'}
        </span></td>
        <td>
          <button class="btn-adm-icon edit" data-edit-user="${u.id}"
            data-nombre="${u.nombre}" data-email="${u.email}" data-rol="${u.rol}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn-adm-icon trash" data-toggle-user="${u.id}" data-activo="${u.activo}" title="${u.activo ? 'Desactivar' : 'Activar'}">
            <i class="bi bi-${u.activo ? 'person-slash' : 'person-check'}"></i>
          </button>
        </td>
      </tr>`).join('');

    // Botón editar
    tbody.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openModal({
          id:btn.dataset.editUser,
          nombre:btn.dataset.nombre,
          email:btn.dataset.email,
          rol:btn.dataset.rol,
        });
      });
    });

    // Botón activar/desactivar
    tbody.querySelectorAll('[data-toggle-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.toggleUser;
        const activo = btn.dataset.activo === 'true';
        this.toggleEstado(id, activo);
      });
    });
  },

  openModal(usuario = null) {
    const titulo = document.getElementById('modal-user-titulo');
    const form = document.getElementById('form-usuario');
    const passHelp = document.getElementById('pass-help');
    if (!form) return;

    if (usuario) {
      titulo.textContent  ='Editar Usuario';
      form['user-id'].value =usuario.id;
      form['user-nombre'].value =usuario.nombre;
      form['user-email'].value =usuario.email;
      form['user-rol'].value =usuario.rol;
      form['user-pass'].value = '';
      form['user-pass'].placeholder = 'Dejar vacío para no cambiar';
      if (passHelp) passHelp.textContent = 'Dejá vacío para mantener la contraseña actual.';
    } else {
      titulo.textContent = 'Nuevo Usuario';
      form.reset();
      form['user-id'].value = '';
      form['user-pass'].placeholder = 'Contraseña';
      if (passHelp) passHelp.textContent = 'Requerida para nuevos usuarios.';
    }

    new bootstrap.Modal(document.getElementById('modal-usuario')).show();
  },

  async handleFormSave() {
    const form   = document.getElementById('form-usuario');
    if (!form) return;

    const id = form['user-id'].value;
    const nombre = form['user-nombre'].value.trim();
    const email = form['user-email'].value.trim();
    const rol = form['user-rol'].value;
    const password = form['user-pass'].value.trim();

    if (!nombre || !email) { Toast.show('Nombre y email son requeridos', 'error'); return; }
    if (!id && !password)  { Toast.show('La contraseña es requerida para nuevos usuarios', 'error'); return; }

    const url = id ? `/api/usuarios/${id}/editar/` : '/api/usuarios/crear/';
    const body = { nombre, email, rol };
    if (password) body.password = password;

    try {
      const r = await fetch(url, {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          'X-CSRFToken':this.getCookie('csrftoken'),
        },
        body:JSON.stringify(body),
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }

      bootstrap.Modal.getInstance(document.getElementById('modal-usuario'))?.hide();
      Toast.show(id ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');
      await this.init();

    } catch { Toast.show('Error al guardar usuario.', 'error'); }
  },

  async toggleEstado(id, activo) {
    const accion = activo ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Querés ${accion} este usuario?`)) return;

    try {
      const r = await fetch(`/api/usuarios/${id}/desactivar/`, {
        method:'POST',
        headers: { 'X-CSRFToken': this.getCookie('csrftoken') },
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }
      Toast.show(`Usuario ${data.estado} correctamente.`, 'success');
      await this.init();

    } catch { Toast.show('Error al cambiar estado.', 'error'); }
  },

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  },

async init() {
    const btnNuevo   = document.getElementById('btn-nuevo-usuario');
    const btnGuardar = document.getElementById('btn-guardar-usuario');

    // onclick reemplaza el handler anterior, no lo acumula
    if (btnNuevo)   btnNuevo.onclick   = () => this.openModal();
    if (btnGuardar) btnGuardar.onclick = () => this.handleFormSave();

    const usuarios = await this.cargar();
    this.render(usuarios);

    const badge = document.getElementById('nav-badge-usuarios');
    if (badge) badge.textContent = usuarios.length;
  }
};

/* ════════════════════════════════════════════════
  9. MÓDULO NOTICIAS
   ════════════════════════════════════════════════ */

const ModNoticias = {
  ICONOS: ['bi-newspaper','bi-megaphone-fill','bi-file-earmark-text-fill','bi-bell-fill','bi-info-circle-fill'],

  load()    { return Store.get(STORAGE_KEYS.NOTICIAS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.NOTICIAS, arr); },

  render() {
    const noticias = this.load();
    const grid     = document.getElementById('noticias-admin-grid');
    if (!grid) return;

    document.getElementById('stat-total-noticias') && (document.getElementById('stat-total-noticias').innerText = noticias.length);

    if (noticias.length === 0) {
      grid.innerHTML = `<div class="col-12"><div class="adm-empty"><i class="bi bi-newspaper"></i><p>No hay noticias. Creá una nueva.</p></div></div>`;
      return;
    }

    grid.innerHTML = noticias.map((n, idx) => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="adm-noticia-card">
          <div class="adm-noticia-thumb">
            <i class="bi ${n.icono || this.ICONOS[idx % this.ICONOS.length]}"></i>
          </div>
          <div class="adm-noticia-body">
            <span class="adm-noticia-tag">${n.tag || 'General'}</span>
            <div class="adm-noticia-titulo">${n.titulo}</div>
            <div class="adm-noticia-fecha"><i class="bi bi-calendar3"></i> ${n.fecha}</div>
            <div class="adm-noticia-cuerpo-preview">${n.cuerpo.substring(0,90)}…</div>
            <div class="adm-noticia-actions">
              <button class="btn-adm-icon edit" data-edit-noticia="${n.id}" title="Editar">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn-adm-icon trash" data-delete-noticia="${n.id}" title="Eliminar">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');

    grid.querySelectorAll('[data-edit-noticia]').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = this.load().find(x => x.id === parseInt(btn.dataset.editNoticia));
        if (n) this.openModal(n);
      });
    });

    grid.querySelectorAll('[data-delete-noticia]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar esta noticia?')) return;
        this.save(this.load().filter(x => x.id !== parseInt(btn.dataset.deleteNoticia)));
        Toast.show('Noticia eliminada', 'warning');
        this.render();
      });
    });
  },

  openModal(noticia = null) {
    const titulo = document.getElementById('modal-noticia-titulo');
    const form   = document.getElementById('form-noticia');
    if (!form) return;

    if (noticia) {
      titulo.textContent = 'Editar Noticia';
      form['noticia-id'].value = noticia.id;
      form['noticia-titulo'].value = noticia.titulo;
      form['noticia-fecha'].value  = noticia.fecha;
      form['noticia-tag'].value = noticia.tag;
      form['noticia-icono'].value  = noticia.icono || this.ICONOS[0];
      form['noticia-cuerpo'].value = noticia.cuerpo;
    } else {
      titulo.textContent = 'Nueva Noticia';
      form.reset();
      form['noticia-id'].value    = '';
      form['noticia-fecha'].value = new Date().toISOString().split('T')[0];
    }
    new bootstrap.Modal(document.getElementById('modal-noticia-form')).show();
  },

  handleFormSave() {
    const form  = document.getElementById('form-noticia');
    if (!form) return;
    const id    = form['noticia-id'].value ? parseInt(form['noticia-id'].value) : null;
    const datos = {
      titulo: form['noticia-titulo'].value.trim(),
      fecha:  form['noticia-fecha'].value,
      tag:    form['noticia-tag'].value.trim() || 'General',
      icono:  form['noticia-icono'].value || this.ICONOS[0],
      cuerpo: form['noticia-cuerpo'].value.trim()
    };
    if (!datos.titulo || !datos.cuerpo) { Toast.show('Título y contenido son requeridos', 'error'); return; }

    const noticias = this.load();
    if (id) {
      const idx = noticias.findIndex(n => n.id === id);
      if (idx !== -1) noticias[idx] = { ...noticias[idx], ...datos };
      Toast.show('Noticia actualizada correctamente', 'success');
    } else {
      noticias.unshift({ id: Store.nextId(noticias), ...datos });
      Toast.show('Noticia creada correctamente', 'success');
    }
    this.save(noticias);
    bootstrap.Modal.getInstance(document.getElementById('modal-noticia-form'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('btn-nueva-noticia')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-guardar-noticia')?.addEventListener('click', () => this.handleFormSave());
    this.render();
  }
};

/* ════════════════════════════════════════════════
  10. MÓDULO TRÁMITES
   ════════════════════════════════════════════════ */
const ModTramites = {

  async cargar() {
    const r    = await fetch('/api/tramites/');
    const data = await r.json();
    return data.tramites || [];
  },

  async cargarCategorias() {
    const r    = await fetch('/api/categorias/');
    const data = await r.json();
    return data.categorias || [];
  },

  estadoBadge(estado) {
    const map = {
      'borrador':  'badge-cancelado',
      'revision':  'badge-pendiente',
      'publicado': 'badge-asistio',
      'archivado': 'badge-noasistio',
    };
    const labels = {
      'borrador':  'Borrador',
      'revision':  'En revisión',
      'publicado': 'Publicado',
      'archivado': 'Archivado',
    };
    return `<span class="badge-estado ${map[estado] || ''}">${labels[estado] || estado}</span>`;
  },

  render(tramites) {
    const tbody = document.getElementById('tbody-tramites-panel');
    if (!tbody) return;

    const statTotal      = document.getElementById('stat-total-tramites-panel');
    const statPublicados = document.getElementById('stat-tramites-publicados');
    const statPendientes = document.getElementById('stat-tramites-pendientes');
    const badge          = document.getElementById('nav-badge-tramites-panel');

    if (statTotal)      statTotal.innerText      = tramites.length;
    if (statPublicados) statPublicados.innerText  = tramites.filter(t => t.estado === 'publicado').length;
    if (statPendientes) statPendientes.innerText  = tramites.filter(t => t.estado === 'revision').length;
    if (badge)          badge.textContent         = tramites.length;

    this.renderTabla(tramites, tbody);
    this.aplicarFiltros(tramites);
  },

  renderTabla(tramites, tbody) {
    if (tramites.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay trámites registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = tramites.map(t => `
      <tr>
        <td><strong>${t.nombre}</strong></td>
        <td>${t.categoria}</td>
        <td><code style="font-size:12px;">${t.slug}</code></td>
        <td>${this.estadoBadge(t.estado)}</td>
        <td>${t.creado_por}</td>
        <td>
          <button class="btn-adm-icon edit btn-editar-tramite"
            data-id="${t.id}" data-nombre="${t.nombre}"
            data-categoria="${t.categoria_id || ''}"
            data-slug="${t.slug}" data-icono="${t.icono}"
            data-descripcion="${t.descripcion || ''}"
            data-estado="${t.estado}"
            title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn-adm-icon trash btn-eliminar-tramite"
            data-id="${t.id}" title="Eliminar">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-editar-tramite').forEach(btn => {
      btn.onclick = () => this.openModal({
        id:          btn.dataset.id,
        nombre:      btn.dataset.nombre,
        categoria:   btn.dataset.categoria,
        slug:        btn.dataset.slug,
        icono:       btn.dataset.icono,
        descripcion: btn.dataset.descripcion,
        estado:      btn.dataset.estado,
      });
    });

    tbody.querySelectorAll('.btn-eliminar-tramite').forEach(btn => {
      btn.onclick = () => this.eliminar(btn.dataset.id);
    });
  },

  aplicarFiltros(tramites) {
    const filtroNombre = document.getElementById('filtro-tramite-panel');
    const filtroEstado = document.getElementById('filtro-tramite-estado');
    const tbody        = document.getElementById('tbody-tramites-panel');

    const filtrar = () => {
      const texto  = filtroNombre?.value.toLowerCase() || '';
      const estado = filtroEstado?.value;

      const filtrados = tramites.filter(t => {
        const coincideTexto  = !texto || t.nombre.toLowerCase().includes(texto);
        const coincideEstado = !estado || t.estado === estado;
        return coincideTexto && coincideEstado;
      });

      this.renderTabla(filtrados, tbody);
    };

    filtroNombre?.addEventListener('input',  filtrar);
    filtroEstado?.addEventListener('change', filtrar);
  },

async openModal(tramite = null) {
    const form   = document.getElementById('form-tramite-panel');
    const titulo = document.getElementById('modal-tramite-panel-titulo');
    if (!form) return;

    // 1. Obtener las categorías de la API
    const categorias = await this.cargarCategorias();
    const select     = document.getElementById('select-categoria-tramite');
    
    // 2. Insertar la opción por defecto y las categorías principales fijas
    let htmlOptions = `
      <option value="">Seleccionar categoría</option>
      <option value="nacimiento">Nacimiento</option>
      <option value="identificacion">Identificación</option>
      <option value="matrimonio">Matrimonio</option>
      <option value="defuncion">Defunción</option>
    `;

    // 3. Inyectar todo en el select
    select.innerHTML = htmlOptions;

    // 4. Agregar de forma dinámica las categorías extras que vengan de la base de datos (evitando duplicar)
    categorias.forEach(c => {
      // Pasamos a minúsculas y limpiamos acentos para validar si ya existe por defecto
      const nombreLimpio = c.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const principales = ['nacimiento', 'identificacion', 'matrimonio', 'defuncion'];
      
      if (!principales.includes(nombreLimpio)) {
        const opt       = document.createElement('option');
        opt.value       = c.id;
        opt.textContent = c.nombre;
        select.appendChild(opt);
      }
    });

    if (tramite) {
      titulo.textContent                               = 'Editar Trámite';
      form['tramite-id'].value                        = tramite.id;
      form['tramite-nombre'].value                    = tramite.nombre;
      form['tramite-slug'].value                      = tramite.slug;
      // form['tramite-icono'].value                     = tramite.icono;
      form['tramite-descripcion'].value               = tramite.descripcion;
      form['tramite-estado'].value                    = tramite.estado;
      if (tramite.categoria) select.value             = tramite.categoria;
      // Deshabilitar slug en edición para no romper URLs
      form['tramite-slug'].disabled = true;
      const gratuito = tramite.es_gratuito;
      document.getElementById('tramite-gratuito').checked = gratuito;
      document.getElementById('precio-wrap').style.display = gratuito ? 'none' : 'block';
      if (!gratuito && tramite.precio) form['tramite-precio'].value = tramite.precio;
    } else {
      titulo.textContent = 'Nuevo Trámite';
      form.reset();
      form['tramite-id'].value      = '';
      form['tramite-slug'].disabled = false;
      // form['tramite-icono'].value   = 'bi-file-earmark-text';
    }

    new bootstrap.Modal(document.getElementById('modal-tramite-panel')).show();
  },

async handleFormSave() {
    const form = document.getElementById('form-tramite-panel');
    if (!form) return;

    const id          = form['tramite-id'].value;
    const nombre      = form['tramite-nombre'].value.trim();
    const slug        = form['tramite-slug'].value.trim();
    const descripcion = form['tramite-descripcion'].value.trim();
    const estado      = form['tramite-estado'].value;

    let categoriaId = document.getElementById('select-categoria-tramite').value;
    
    // --- ESTA LÍNEA CORRIGE EL ERROR ---
    // Si el valor NO es un número (es decir, es 'nacimiento', 'matrimonio', etc.), enviamos null para que el backend no falle
    if (isNaN(categoriaId)) {
        categoriaId = null;
    }

    const gratuito    = document.getElementById('tramite-gratuito').checked;
    const precio      = gratuito ? null : (form['tramite-precio'].value || null);

    if (!nombre) { Toast.show('El nombre es obligatorio.', 'error'); return; }
    if (!id && !slug) { Toast.show('El identificador de URL es obligatorio.', 'error'); return; }

    const url  = id ? `/api/tramites/${id}/editar/` : '/api/tramites/crear/';
    const body = {
      nombre, descripcion, estado,
      categoria_id: categoriaId || null,
      es_gratuito:  gratuito,
      precio:       precio,
    };
    if (!id) body.slug = slug;

    try {
      const r    = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken':  this.getCookie('csrftoken'),
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }

      bootstrap.Modal.getInstance(document.getElementById('modal-tramite-panel'))?.hide();
      Toast.show(id ? 'Trámite actualizado.' : 'Trámite creado correctamente.', 'success');
      await this.init();

    } catch { Toast.show('Error al guardar trámite.', 'error'); }
},

  async eliminar(id) {
    if (!confirm('¿Eliminar este trámite? Esta acción no se puede deshacer.')) return;

    try {
      const r    = await fetch(`/api/tramites/${id}/eliminar/`, {
        method:  'POST',
        headers: { 'X-CSRFToken': this.getCookie('csrftoken') },
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }
      Toast.show('Trámite eliminado.', 'warning');
      await this.init();

    } catch { Toast.show('Error al eliminar trámite.', 'error'); }
  },

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  },

  async init() {
    const btnNuevo = document.getElementById('btn-nuevo-tramite-panel');
    if (btnNuevo) btnNuevo.onclick = () => this.openModal();

    const tramites = await this.cargar();
    this.render(tramites);
  }
};

// Botón nueva categoría
const btnNuevaCat     = document.getElementById('btn-nueva-categoria');
const btnConfirmarCat = document.getElementById('btn-confirmar-categoria');
const btnCancelarCat  = document.getElementById('btn-cancelar-categoria');
const wrapNuevaCat    = document.getElementById('nueva-categoria-wrap');

if (btnNuevaCat) btnNuevaCat.onclick = () => {
  wrapNuevaCat.style.display = 'block';
  document.getElementById('nueva-categoria-nombre').focus();
};

if (btnCancelarCat) btnCancelarCat.onclick = () => {
  wrapNuevaCat.style.display = 'none';
  document.getElementById('nueva-categoria-nombre').value = '';
};

if (btnConfirmarCat) btnConfirmarCat.onclick = async () => {
  const nombre = document.getElementById('nueva-categoria-nombre').value.trim();
  const icono  = document.getElementById('nueva-categoria-icono').value;

  if (!nombre) { Toast.show('Escribí el nombre de la categoría.', 'warning'); return; }

  try {
    const r    = await fetch('/api/categorias/crear/', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken':  ModTramites.getCookie('csrftoken'),
      },
      body: JSON.stringify({ nombre, icono }),
    });
    const data = await r.json();

    if (data.error) { Toast.show(data.error, 'error'); return; }

    const select = document.getElementById('select-categoria-tramite');

    // Agregar la nueva categoría al select y seleccionarla
    const opt       = document.createElement('option');
    opt.value       = data.id;
    opt.textContent = data.nombre;
    select.appendChild(opt);
    select.value = data.id;

    // Ocultar el campo
    wrapNuevaCat.style.display = 'none';
    document.getElementById('nueva-categoria-nombre').value = '';
    Toast.show(`Categoría "${data.nombre}" creada.`, 'success');

  } catch { Toast.show('Error al crear categoría.', 'error'); }
};


/* ════════════════════════════════════════════════
  11. LOGIN (login.html)
   ════════════════════════════════════════════════ */

function initLogin() {
  if (!document.getElementById('login-form')) return;

  // Si ya está logueado, ir directo al admin
  if (Auth.isLogged()) { window.location.href = '/admin-panel/'; return; }

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');

    if (!email || !pass) {
      errEl.textContent = 'Por favor completá todos los campos.';
      errEl.style.display = 'block'; return;
    }

    if (Auth.check(email, pass)) {
      Auth.login(email);
      window.location.href = '/admin-panel/';
    } else {
      errEl.textContent   = 'Credenciales incorrectas. Verificá tu email y contraseña.';
      errEl.style.display = 'block';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    }
  });
}

/* ════════════════════════════════════════════════
  12. MÓDULO SEDES
   ════════════════════════════════════════════════ */
const ModSedes = {

  _cache: [],

abrirEdicion(id) {
  const sede = this._cache.find(s => s.id === id);
  if (sede) this.openModal(sede);
},

  async cargar() {
    const r    = await fetch('/api/sedes/');
    const data = await r.json();
    return data.sedes || [];
  },

  render(sedes) {
    this._cache = sedes;
    const tbody  = document.getElementById('tbody-sedes');
    if (!tbody) return;

    const statTotal     = document.getElementById('stat-total-sedes');
    const statActivas   = document.getElementById('stat-sedes-activas');
    const statPendientes = document.getElementById('stat-sedes-pendientes');
    const badge         = document.getElementById('nav-badge-sedes');

    if (statTotal)      statTotal.innerText      = sedes.length;
    if (statActivas)    statActivas.innerText     = sedes.filter(s => s.activo).length;
    if (statPendientes) statPendientes.innerText  = sedes.filter(s => !s.activo).length;
    if (badge)          badge.textContent         = sedes.length;

    if (sedes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay sedes registradas.</td></tr>`;
      return;
    }

tbody.innerHTML = sedes.map(s => `
  <tr data-id="${s.id}">
    <td><strong>${s.nombre}</strong></td>
    <td>${s.direccion}</td>
    <td>${s.departamento}</td>
    <td>${s.horario}</td>
    <td>
      <span class="badge-estado ${s.activo ? 'badge-asistio' : 'badge-pendiente'}">
        ${s.activo ? 'Activa' : 'Pendiente'}
      </span>
    </td>
    <td>
      <button class="btn-adm-icon edit btn-editar-sede"
        data-id="${s.id}"
        data-nombre="${s.nombre.replace(/"/g, '&quot;')}"
        data-direccion="${s.direccion.replace(/"/g, '&quot;')}"
        data-departamento="${s.departamento}"
        data-provincia="${s.provincia}"
        data-horario="${s.horario.replace(/"/g, '&quot;')}"
        data-lat="${s.lat || ''}"
        data-lng="${s.lng || ''}"
        data-activo="${s.activo}"
        title="Editar">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button class="btn-adm-icon trash"
        onclick="ModSedes.eliminar(${s.id})"
        title="Eliminar">
        <i class="bi bi-trash3"></i>
      </button>
    </td>
  </tr>
`).join('');

// Asignar eventos a botones editar
tbody.querySelectorAll('.btn-editar-sede').forEach(btn => {
  btn.onclick = () => ModSedes.openModal({
    id:           btn.dataset.id,
    nombre:       btn.dataset.nombre,
    direccion:    btn.dataset.direccion,
    departamento: btn.dataset.departamento,
    provincia:    btn.dataset.provincia,
    horario:      btn.dataset.horario,
    lat:          btn.dataset.lat,
    lng:          btn.dataset.lng,
    activo:       btn.dataset.activo === 'true',
  });
});

    // Filtros
    this.aplicarFiltros(sedes);
  },

  aplicarFiltros(sedes) {
    const filtroNombre  = document.getElementById('filtro-sede');
    const filtroEstado  = document.getElementById('filtro-sede-estado');

    const filtrar = () => {
      const texto  = filtroNombre?.value.toLowerCase() || '';
      const estado = filtroEstado?.value;

      const filtradas = sedes.filter(s => {
        const coincideTexto  = !texto || s.nombre.toLowerCase().includes(texto) || s.direccion.toLowerCase().includes(texto);
        const coincideEstado = estado === '' || s.activo.toString() === estado;
        return coincideTexto && coincideEstado;
      });

      const tbody = document.getElementById('tbody-sedes');
      if (!tbody) return;

      if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay resultados.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtradas.map(s => `
        <tr>
          <td><strong>${s.nombre}</strong></td>
          <td>${s.direccion}</td>
          <td>${s.departamento}</td>
          <td>${s.horario}</td>
          <td><span class="badge-estado ${s.activo ? 'badge-asistio' : 'badge-pendiente'}">
            ${s.activo ? 'Activa' : 'Pendiente'}
          </span></td>
          <td>
            <button class="btn-adm-icon edit" title="Editar"
  onclick="ModSedes.abrirEdicion(${s.id})">
  <i class="bi bi-pencil-square"></i>
</button>
            <button class="btn-adm-icon trash" data-eliminar="${s.id}" title="Eliminar">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
      `).join('');
    };

    filtroNombre?.addEventListener('input', filtrar);
    filtroEstado?.addEventListener('change', filtrar);
  },

  openModal(sede = null) {
    const form   = document.getElementById('form-sede');
    const titulo = document.getElementById('modal-sede-titulo');
    if (!form) return;

    if (sede) {
      titulo.textContent                          = 'Editar Sede';
      form['sede-id'].value                       = sede.id;
      form['sede-nombre'].value                   = sede.nombre;
      form['sede-direccion'].value                = sede.direccion;
      form['sede-departamento'].value             = sede.departamento;
      form['sede-provincia'].value                = sede.provincia;
      form['sede-horario'].value                  = sede.horario;
      form['sede-lat'].value                      = sede.lat;
      form['sede-lng'].value                      = sede.lng;
      if (form['sede-activo'])
        form['sede-activo'].value                 = sede.activo.toString();
    } else {
      titulo.textContent = 'Nueva Sede';
      form.reset();
      form['sede-id'].value      = '';
      form['sede-provincia'].value = 'Santiago del Estero';
    }

    new bootstrap.Modal(document.getElementById('modal-sede')).show();
  },

  async handleFormSave() {
    const form = document.getElementById('form-sede');
    if (!form) return;

    const id           = form['sede-id'].value;
    const nombre       = form['sede-nombre'].value.trim();
    const direccion    = form['sede-direccion'].value.trim();
    const departamento = form['sede-departamento'].value.trim();
    const provincia    = form['sede-provincia'].value.trim();
    const horario      = form['sede-horario'].value.trim();
    const lat          = form['sede-lat'].value;
    const lng          = form['sede-lng'].value;
    const activo       = form['sede-activo'] ? form['sede-activo'].value === 'true' : false;

    if (!nombre || !direccion || !departamento || !horario) {
      Toast.show('Completá los campos obligatorios.', 'error');
      return;
    }

    const url  = id ? `/api/sedes/${id}/editar/` : '/api/sedes/crear/';
    const body = { nombre, direccion, departamento, provincia, horario, lat, lng, activo };

    try {
      const r    = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken':  this.getCookie('csrftoken'),
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }

      bootstrap.Modal.getInstance(document.getElementById('modal-sede'))?.hide();
      Toast.show(id ? 'Sede actualizada.' : 'Sede creada correctamente.', 'success');
      await this.init();

    } catch { Toast.show('Error al guardar sede.', 'error'); }
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar esta sede? Esta acción no se puede deshacer.')) return;

    try {
      const r    = await fetch(`/api/sedes/${id}/eliminar/`, {
        method:  'POST',
        headers: { 'X-CSRFToken': this.getCookie('csrftoken') },
      });
      const data = await r.json();

      if (data.error) { Toast.show(data.error, 'error'); return; }
      Toast.show('Sede eliminada.', 'warning');
      await this.init();

    } catch { Toast.show('Error al eliminar sede.', 'error'); }
  },

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  },

  async init() {
    const btnNueva = document.getElementById('btn-nueva-sede');
    if (btnNueva) btnNueva.onclick = () => this.openModal();

    const sedes = await this.cargar();
    this.render(sedes);
  }
};

/* ════════════════════════════════════════════════
  12. INIT GENERAL ADMIN
   ════════════════════════════════════════════════ */

function initAdmin() {
  if (!document.querySelector('.admin-body')) return;
  if (document.getElementById('sec-sedes')) ModSedes.init();
  if (document.getElementById('sec-tramites-panel')) ModTramites.init();

  // Guard de autenticación
  /* Auth.guard(); */

  // Seed datos
  Store.initAll();

  // Mostrar usuario actual
const userDisplay = document.getElementById('adm-current-user');
if (userDisplay) {
    fetch('/api/usuario-actual/')
        .then(r => r.json())
        .then(data => { userDisplay.textContent = data.nombre || data.username; })
        .catch(() => { userDisplay.textContent = 'Admin'; });
}

  // Botón cerrar sesión
  document.querySelectorAll('.btn-logout-global').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('¿Cerrar sesión?')) Auth.logout();
    });
  });

  // Inicializar navegación y módulos
  initNav();
  ModTurnos.init();
  ModUsuarios.init();
  ModNoticias.init();
}

/* ════════════════════════════════════════════════
  12. BOOTSTRAP
   ════════════════════════════════════════════════ */

   // Limpiar backdrop de modales al cerrar
document.addEventListener('hidden.bs.modal', () => {
  document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  document.body.classList.remove('modal-open');
  document.body.style.overflow   = '';
  document.body.style.paddingRight = '';
});

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initAdmin();
});
