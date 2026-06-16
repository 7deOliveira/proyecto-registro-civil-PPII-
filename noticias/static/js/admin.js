/**
 * admin.js — Panel Administrativo | Registro Civil Santiago del Estero
 * Maneja: autenticación, turnos, usuarios (con permisos), noticias — localStorage.
 */

'use strict';

/* ════════════════════════════════════════════════
   1. CONFIGURACIÓN Y CONSTANTES
   ════════════════════════════════════════════════ */

// Credenciales del administrador principal (base64)
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

// Permisos completos (para admin principal y rol admin)
const FULL_PERMS = { turnos: true, usuarios: true, noticias: true };
// Permisos por defecto para operadores nuevos
const DEFAULT_OP_PERMS = { turnos: true, usuarios: false, noticias: true };

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
  {
    id:1,
    nombre:'Administrador Principal',
    email:'registroCivil@gmail.com',
    rol:'admin',
    password: btoa('1422'),
    permisos: FULL_PERMS
  }
];

/* ════════════════════════════════════════════════
   3. STORAGE HELPERS
   ════════════════════════════════════════════════ */

const Store = {
  get(key)       { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); },
  init(key, def) { if (!localStorage.getItem(key)) Store.set(key, def); },
  initAll() {
    Store.init(STORAGE_KEYS.TURNOS,   SEED_TURNOS);
    Store.init(STORAGE_KEYS.NOTICIAS, SEED_NOTICIAS);
    Store.init(STORAGE_KEYS.USUARIOS, SEED_USUARIOS);
  },
  nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }
};

/* ════════════════════════════════════════════════
   4. AUTENTICACIÓN
   ════════════════════════════════════════════════ */

const Auth = {
  /** Verifica email+password, retorna objeto usuario o null */
  check(email, pass) {
    if (email === _CV[0] && pass === _CV[1]) return { rol: 'admin', permisos: FULL_PERMS };
    const usuarios = Store.get(STORAGE_KEYS.USUARIOS) || [];
    const u = usuarios.find(x => x.email === email && atob(x.password || '') === pass);
    return u || null;
  },

  /** Guarda sesión con rol y permisos */
  login(email, userData) {
    const role    = userData?.rol     || 'operador';
    const permisos = (role === 'admin')
      ? FULL_PERMS
      : (userData?.permisos || DEFAULT_OP_PERMS);
    Store.set(STORAGE_KEYS.SESSION, { loggedIn: true, user: email, role, permisos, ts: Date.now() });
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.location.href = 'login.html';
  },

  isLogged() {
    const s = Store.get(STORAGE_KEYS.SESSION);
    return s && s.loggedIn === true;
  },

  currentUser()   { const s = Store.get(STORAGE_KEYS.SESSION); return s ? s.user : null; },
  currentRole()   { const s = Store.get(STORAGE_KEYS.SESSION); return s ? (s.role || 'operador') : 'operador'; },
  currentPerms()  { const s = Store.get(STORAGE_KEYS.SESSION); return s ? (s.permisos || {}) : {}; },
  isAdmin()       { return Auth.currentRole() === 'admin'; },
  hasPerm(p)      { return Auth.isAdmin() || (Auth.currentPerms()[p] === true); },

  guard() { if (!Auth.isLogged()) { window.location.href = 'login.html'; } }
};

/* ════════════════════════════════════════════════
   5. TOAST NOTIFICATIONS
   ════════════════════════════════════════════════ */

const Toast = {
  show(msg, type = 'success') {
    const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' };
    const container = document.getElementById('adm-toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `adm-toast ${type}`;
    el.innerHTML = `<i class="bi ${icons[type]||icons.info}"></i><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all .3s ease';
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
      document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById(`sec-${target}`);
      if (sec) sec.classList.add('active');
      document.querySelector('.adm-sidebar')?.classList.remove('open');
    });
  });

  document.getElementById('adm-menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.adm-sidebar')?.classList.toggle('open');
  });
}

/** Aplica restricciones de permisos al sidebar y secciones */
function applyPermissions() {
  const perms = Auth.currentPerms();
  const isAdmin = Auth.isAdmin();

  // Si el usuario no tiene permiso sobre una sección, ocultar su botón de nav
  // y si es la sección activa, mover a la primera disponible
  const sections = [
    { key: 'turnos',   navId: 'nav-btn-turnos' },
    { key: 'usuarios', navId: 'nav-btn-usuarios' },
    { key: 'noticias', navId: 'nav-btn-noticias' }
  ];

  let firstAllowed = null;

  sections.forEach(({ key, navId }) => {
    const allowed = isAdmin || perms[key];
    const navBtn = document.getElementById(navId);
    if (!allowed && navBtn) {
      navBtn.style.display = 'none';
    } else if (allowed && !firstAllowed) {
      firstAllowed = key;
    }
  });

  // Si la sección activa no tiene permiso, activar la primera permitida
  if (firstAllowed) {
    const activeSec = document.querySelector('.adm-section.active');
    const activeBtn = document.querySelector('.adm-nav-item.active[data-section]');
    if (activeBtn) {
      const activeKey = activeBtn.dataset.section;
      const allowed = isAdmin || perms[activeKey];
      if (!allowed) {
        // Desactivar todo y activar la primera permitida
        document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
        const newBtn = document.getElementById(`nav-btn-${firstAllowed}`);
        const newSec = document.getElementById(`sec-${firstAllowed}`);
        if (newBtn) newBtn.classList.add('active');
        if (newSec) newSec.classList.add('active');
      }
    }
  }

  // Si no puede gestionar usuarios, ocultar el botón "Nuevo usuario"
  if (!Auth.hasPerm('usuarios')) {
    const btnNew = document.getElementById('btn-nuevo-usuario');
    if (btnNew) btnNew.style.display = 'none';
  }
}

/* ════════════════════════════════════════════════
   7. MÓDULO TURNOS
   ════════════════════════════════════════════════ */

const ModTurnos = {
  ESTADOS:  ['Pendiente','Asistió','No asistió','Cancelado'],
  TRAMITES: ['Nacimiento','Identificación','Matrimonio','Defunción'],

  load()    { return Store.get(STORAGE_KEYS.TURNOS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.TURNOS, arr); },

  badgeClass(estado) {
    return { Pendiente:'badge-pendiente', Asistió:'badge-asistio', 'No asistió':'badge-noasistio', Cancelado:'badge-cancelado' }[estado] || 'badge-pendiente';
  },

  render(filtro = '') {
    const turnos = this.load();
    const tbody  = document.getElementById('turnos-tbody');
    const stats  = { total: turnos.length, pendiente:0, asistio:0, cancelado:0 };
    turnos.forEach(t => {
      if (t.estado === 'Pendiente') stats.pendiente++;
      if (t.estado === 'Asistió')   stats.asistio++;
      if (t.estado === 'Cancelado' || t.estado === 'No asistió') stats.cancelado++;
    });

    const sv = id => document.getElementById(id);
    if (sv('stat-total-turnos')) sv('stat-total-turnos').innerText = stats.total;
    if (sv('stat-pendientes'))   sv('stat-pendientes').innerText   = stats.pendiente;
    if (sv('stat-asistio'))      sv('stat-asistio').innerText      = stats.asistio;
    if (sv('stat-cancelado'))    sv('stat-cancelado').innerText    = stats.cancelado;

    const q = filtro.toLowerCase();
    const visible = q ? turnos.filter(t =>
      t.nombre.toLowerCase().includes(q) || t.dni.includes(q) ||
      t.tramite.toLowerCase().includes(q) || t.numero.toLowerCase().includes(q) ||
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
          <select class="estado-select" data-turno-id="${t.id}">
            ${this.ESTADOS.map(e => `<option value="${e}" ${e===t.estado?'selected':''}>${e}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn-adm-icon trash" data-delete-turno="${t.id}" title="Eliminar">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.estado-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const id = parseInt(e.target.dataset.turnoId);
        const ts = this.load();
        const idx = ts.findIndex(t => t.id === id);
        if (idx !== -1) {
          ts[idx].estado = e.target.value;
          this.save(ts);
          Toast.show(`Turno ${ts[idx].numero} actualizado a "${e.target.value}"`, 'success');
          this.render(filtro);
        }
      });
    });

    tbody.querySelectorAll('[data-delete-turno]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.deleteTurno);
        if (!confirm('¿Eliminar este turno?')) return;
        this.save(this.load().filter(t => t.id !== id));
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
      const next = this.load().length + 1;
      form['turno-numero'].value = `T-${String(next).padStart(3,'0')}`;
      form['turno-fecha'].value  = new Date().toISOString().split('T')[0];
    }
    new bootstrap.Modal(document.getElementById('modal-turno')).show();
  },

  handleFormSave() {
    const form = document.getElementById('form-turno');
    if (!form) return;
    const id   = form['turno-id'].value ? parseInt(form['turno-id'].value) : null;
    const datos = {
      numero: form['turno-numero'].value.trim(),
      fecha:  form['turno-fecha'].value,
      hora:   form['turno-hora'].value,
      nombre: form['turno-nombre'].value.trim(),
      dni:    form['turno-dni'].value.trim(),
      tramite:form['turno-tramite'].value,
      estado: form['turno-estado'].value
    };
    if (!datos.nombre || !datos.dni || !datos.fecha) { Toast.show('Completá los campos requeridos','error'); return; }

    const ts = this.load();
    if (id) {
      const idx = ts.findIndex(t => t.id === id);
      if (idx !== -1) ts[idx] = { ...ts[idx], ...datos };
      Toast.show('Turno actualizado correctamente','success');
    } else {
      ts.push({ id: Store.nextId(ts), ...datos });
      Toast.show('Turno creado correctamente','success');
    }
    this.save(ts);
    bootstrap.Modal.getInstance(document.getElementById('modal-turno'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('filtro-turno')?.addEventListener('input', e => this.render(e.target.value));
    document.getElementById('filtro-tramite')?.addEventListener('change', e => this.render(e.target.value));
    document.getElementById('btn-nuevo-turno')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-guardar-turno')?.addEventListener('click', () => this.handleFormSave());
    this.render();
  }
};

/* ════════════════════════════════════════════════
   8. MÓDULO USUARIOS (con permisos granulares)
   ════════════════════════════════════════════════ */

const ModUsuarios = {
  load()    { return Store.get(STORAGE_KEYS.USUARIOS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.USUARIOS, arr); },

  /** Etiquetas visuales para los permisos */
  permTags(u) {
    if (u.rol === 'admin') return '<span class="perm-tag">Acceso total</span>';
    const p = u.permisos || DEFAULT_OP_PERMS;
    const tags = [];
    if (p.turnos)   tags.push('<span class="perm-tag t">Turnos</span>');
    if (p.noticias) tags.push('<span class="perm-tag n">Noticias</span>');
    if (p.usuarios) tags.push('<span class="perm-tag u">Usuarios</span>');
    return tags.length ? `<div class="perm-tags">${tags.join('')}</div>` : '<span style="color:#aaa;font-size:12px;">Sin permisos</span>';
  },

  render() {
    const usuarios = this.load();
    const tbody    = document.getElementById('usuarios-tbody');
    if (!tbody) return;

    const sv = document.getElementById('stat-total-usuarios');
    if (sv) sv.innerText = usuarios.length;

    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No hay usuarios registrados.</td></tr>`;
      return;
    }

    const currentIsAdmin = Auth.isAdmin();

    tbody.innerHTML = usuarios.map(u => {
      // Nunca mostrar botón eliminar habilitado para un usuario admin
      const isAdminUser = u.rol === 'admin';
      // Operadores no pueden eliminar ni admins ni (si no tienen perm_usuarios) a nadie
      const canDelete = currentIsAdmin && !isAdminUser;
      const trashBtn = isAdminUser
        ? `<button class="btn-adm-icon trash" disabled title="No se puede eliminar un Administrador" style="opacity:.35;cursor:not-allowed;">
             <i class="bi bi-shield-lock"></i>
           </button>`
        : canDelete
          ? `<button class="btn-adm-icon trash" data-delete-user="${u.id}" title="Eliminar usuario">
               <i class="bi bi-trash3"></i>
             </button>`
          : '';

      return `
        <tr data-uid="${u.id}">
          <td><strong>${u.nombre}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge-estado badge-${u.rol}">${u.rol.charAt(0).toUpperCase()+u.rol.slice(1)}</span></td>
          <td>${this.permTags(u)}</td>
          <td style="display:flex;gap:4px;align-items:center;">
            <button class="btn-adm-icon edit" data-edit-user="${u.id}" title="Editar">
              <i class="bi bi-pencil-square"></i>
            </button>
            ${trashBtn}
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = this.load().find(x => x.id === parseInt(btn.dataset.editUser));
        if (u) this.openModal(u);
      });
    });

    tbody.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.deleteUser);
        const u  = this.load().find(x => x.id === id);

        // Doble protección: nunca eliminar admin
        if (!u) return;
        if (u.rol === 'admin') {
          Toast.show('No se puede eliminar un usuario Administrador', 'error'); return;
        }
        if (!Auth.isAdmin()) {
          Toast.show('No tenés permiso para eliminar usuarios', 'error'); return;
        }

        if (!confirm(`¿Eliminar al usuario "${u.nombre}"?\nEsta acción no se puede deshacer.`)) return;
        this.save(this.load().filter(x => x.id !== id));
        Toast.show(`Usuario "${u.nombre}" eliminado`, 'warning');
        this.render();
      });
    });
  },

  openModal(usuario = null) {
    const titulo   = document.getElementById('modal-user-titulo');
    const form     = document.getElementById('form-usuario');
    const passHelp = document.getElementById('pass-help');
    if (!form) return;

    const rolSelect = document.getElementById('user-rol-select');
    const pTurnos   = document.getElementById('perm-turnos');
    const pNoticias = document.getElementById('perm-noticias');
    const pUsuarios = document.getElementById('perm-usuarios');
    const seccion   = document.getElementById('permisos-section');

    const syncPermisos = (rol) => {
      const isAdm = rol === 'admin';
      [pTurnos, pNoticias, pUsuarios].forEach(el => { if(el) el.disabled = isAdm; if(isAdm && el) el.checked = true; });
      if (seccion) seccion.style.opacity = isAdm ? '.6' : '1';
    };

    if (usuario) {
      titulo.textContent = 'Editar Usuario';
      form['user-id'].value     = usuario.id;
      form['user-nombre'].value = usuario.nombre;
      form['user-email'].value  = usuario.email;
      form['user-rol'].value    = usuario.rol;
      form['user-pass'].value   = '';
      form['user-pass'].placeholder = 'Dejar vacío para no cambiar';
      if (passHelp) passHelp.textContent = 'Dejar vacío para mantener la contraseña actual.';
      form['user-email'].disabled = (usuario.email === _CV[0]);

      // Cargar permisos del usuario
      const p = usuario.permisos || DEFAULT_OP_PERMS;
      if (pTurnos)   pTurnos.checked   = !!p.turnos;
      if (pNoticias) pNoticias.checked = !!p.noticias;
      if (pUsuarios) pUsuarios.checked = !!p.usuarios;
      syncPermisos(usuario.rol);
    } else {
      titulo.textContent = 'Nuevo Usuario';
      form.reset();
      form['user-id'].value = '';
      form['user-email'].disabled = false;
      form['user-pass'].placeholder = 'Contraseña';
      if (passHelp) passHelp.textContent = 'Requerida para nuevos usuarios.';

      // Permisos por defecto para nuevo operador
      if (pTurnos)   pTurnos.checked   = true;
      if (pNoticias) pNoticias.checked = true;
      if (pUsuarios) pUsuarios.checked = false;
      syncPermisos('operador');
    }

    // Escuchar cambio de rol en tiempo real
    if (rolSelect) {
      const handler = () => syncPermisos(rolSelect.value);
      rolSelect.removeEventListener('change', rolSelect._permHandler);
      rolSelect._permHandler = handler;
      rolSelect.addEventListener('change', handler);
    }

    new bootstrap.Modal(document.getElementById('modal-usuario')).show();
  },

  handleFormSave() {
    const form = document.getElementById('form-usuario');
    if (!form) return;
    const id     = form['user-id'].value ? parseInt(form['user-id'].value) : null;
    const nombre = form['user-nombre'].value.trim();
    const email  = form['user-email'].value.trim();
    const rol    = form['user-rol'].value;
    const pass   = form['user-pass'].value;

    if (!nombre || !email) { Toast.show('Nombre y email son requeridos','error'); return; }
    if (!id && !pass)       { Toast.show('La contraseña es requerida para nuevos usuarios','error'); return; }

    // Recoger permisos (si es admin, siempre full)
    const permisos = rol === 'admin' ? FULL_PERMS : {
      turnos:   document.getElementById('perm-turnos')?.checked   || false,
      noticias: document.getElementById('perm-noticias')?.checked || false,
      usuarios: document.getElementById('perm-usuarios')?.checked || false
    };

    const usuarios = this.load();

    if (!id && usuarios.some(u => u.email === email)) {
      Toast.show('Ya existe un usuario con ese email','error'); return;
    }

    if (id) {
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx !== -1) {
        // No permitir cambiar el rol del admin principal
        if (usuarios[idx].email === _CV[0] && rol !== 'admin') {
          Toast.show('No se puede cambiar el rol del administrador principal','error'); return;
        }
        usuarios[idx].nombre  = nombre;
        usuarios[idx].rol     = rol;
        usuarios[idx].permisos = permisos;
        if (!form['user-email'].disabled) usuarios[idx].email = email;
        if (pass) usuarios[idx].password = btoa(pass);
      }
      Toast.show('Usuario actualizado correctamente','success');
    } else {
      usuarios.push({ id: Store.nextId(usuarios), nombre, email, rol, password: btoa(pass), permisos });
      Toast.show('Usuario creado correctamente','success');
    }

    this.save(usuarios);
    bootstrap.Modal.getInstance(document.getElementById('modal-usuario'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => {
      if (!Auth.hasPerm('usuarios')) { Toast.show('No tenés permiso para crear usuarios','error'); return; }
      this.openModal();
    });
    document.getElementById('btn-guardar-usuario')?.addEventListener('click', () => this.handleFormSave());
    this.render();
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

    const sv = document.getElementById('stat-total-noticias');
    if (sv) sv.innerText = noticias.length;

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
              <button class="btn-adm-icon edit" data-edit-noticia="${n.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
              <button class="btn-adm-icon trash" data-delete-noticia="${n.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
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
        Toast.show('Noticia eliminada','warning');
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
      form['noticia-id'].value     = noticia.id;
      form['noticia-titulo'].value = noticia.titulo;
      form['noticia-fecha'].value  = noticia.fecha;
      form['noticia-tag'].value    = noticia.tag;
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
    const form = document.getElementById('form-noticia');
    if (!form) return;
    const id   = form['noticia-id'].value ? parseInt(form['noticia-id'].value) : null;
    const datos = {
      titulo: form['noticia-titulo'].value.trim(),
      fecha:  form['noticia-fecha'].value,
      tag:    form['noticia-tag'].value.trim() || 'General',
      icono:  form['noticia-icono'].value || this.ICONOS[0],
      cuerpo: form['noticia-cuerpo'].value.trim()
    };
    if (!datos.titulo || !datos.cuerpo) { Toast.show('Título y contenido son requeridos','error'); return; }

    const noticias = this.load();
    if (id) {
      const idx = noticias.findIndex(n => n.id === id);
      if (idx !== -1) noticias[idx] = { ...noticias[idx], ...datos };
      Toast.show('Noticia actualizada correctamente','success');
    } else {
      noticias.unshift({ id: Store.nextId(noticias), ...datos });
      Toast.show('Noticia creada correctamente','success');
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
   10. LOGIN (login.html)
   ════════════════════════════════════════════════ */

function initLogin() {
  if (!document.getElementById('login-form')) return;
  if (Auth.isLogged()) { window.location.href = 'admin.html'; return; }

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');

    if (!email || !pass) {
      errEl.textContent = 'Por favor completá todos los campos.';
      errEl.classList.remove('hidden'); return;
    }

    const userData = Auth.check(email, pass);
    if (userData) {
      Auth.login(email, userData);
      window.location.href = 'admin.html';
    } else {
      errEl.querySelector('#login-error-msg')
        ? (document.getElementById('login-error-msg').textContent = 'Credenciales incorrectas. Verificá tu email y contraseña.')
        : (errEl.textContent = 'Credenciales incorrectas.');
      errEl.classList.remove('hidden');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    }
  });
}

/* ════════════════════════════════════════════════
   11. INIT GENERAL ADMIN
   ════════════════════════════════════════════════ */

function initAdmin() {
  if (!document.querySelector('.admin-body')) return;

  Auth.guard();
  Store.initAll();

  // Mostrar usuario actual
  const email = Auth.currentUser();
  const el    = document.getElementById('adm-current-user');
  if (el && email) {
    const role = Auth.currentRole();
    el.textContent = `${email.split('@')[0]} (${role === 'admin' ? 'Admin' : 'Operador'})`;
  }

  // Cerrar sesión
  document.querySelectorAll('.btn-logout-global').forEach(btn => {
    btn.addEventListener('click', () => { if (confirm('¿Cerrar sesión?')) Auth.logout(); });
  });

  initNav();
  applyPermissions();
  ModTurnos.init();
  ModUsuarios.init();
  ModNoticias.init();
}

/* ════════════════════════════════════════════════
   12. BOOTSTRAP
   ════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initAdmin();
});
