/**
 * admin.js — Panel Administrativo | Registro Civil Santiago del Estero
 * Maneja: autenticación, turnos, usuarios (con permisos), noticias — localStorage.
 */

'use strict';

/* ════════════════════════════════════════════════
   1. CONSTANTES Y CONFIGURACIÓN
   ════════════════════════════════════════════════ */

const _CV = [
  atob('cmVnaXN0cm9DaXZpbEBnbWFpbC5jb20='),
  atob('MTQyMg==')
];

const STORAGE_KEYS = {
  SESSION:  'rc_session',
  TURNOS:   'rc_turnos',
  USUARIOS: 'rc_usuarios',
  NOTICIAS: 'rc_noticias'
};

const FULL_PERMS        = { turnos: true, usuarios: true, noticias: true };
const DEFAULT_OP_PERMS  = { turnos: true, usuarios: false, noticias: true };

/* ════════════════════════════════════════════════
   2. DATOS INICIALES (seed)
   ════════════════════════════════════════════════ */

const SEED_TURNOS = [
  { id:1, numero:'T-001', fecha:'2026-04-17', hora:'09:00', nombre:'María García',    dni:'32456789', mail:'maria.garcia@gmail.com',     tramite:'Nacimiento',    estado:'Pendiente'  },
  { id:2, numero:'T-002', fecha:'2026-04-17', hora:'09:30', nombre:'Carlos López',    dni:'28901234', mail:'carlos.lopez@outlook.com',    tramite:'Matrimonio',    estado:'Asistió'    },
  { id:3, numero:'T-003', fecha:'2026-04-17', hora:'10:00', nombre:'Ana Rodríguez',   dni:'35678901', mail:'ana.rodriguez@gmail.com',     tramite:'Identificación',estado:'Pendiente'  },
  { id:4, numero:'T-004', fecha:'2026-04-18', hora:'09:00', nombre:'Pedro Martínez',  dni:'30123456', mail:'',                            tramite:'Defunción',     estado:'No asistió' },
  { id:5, numero:'T-005', fecha:'2026-04-18', hora:'09:30', nombre:'Laura Fernández', dni:'33567890', mail:'laura.f@hotmail.com',         tramite:'Nacimiento',    estado:'Cancelado'  },
  { id:6, numero:'T-006', fecha:'2026-04-19', hora:'10:30', nombre:'Jorge Sánchez',   dni:'27890123', mail:'j.sanchez@gmail.com',         tramite:'Matrimonio',    estado:'Pendiente'  },
  { id:7, numero:'T-007', fecha:'2026-04-19', hora:'11:00', nombre:'Sofía Herrera',   dni:'38901234', mail:'sofia.herrera@yahoo.com.ar',  tramite:'Identificación',estado:'Asistió'    }
];

const HOY = new Date().toISOString().split('T')[0];
const EN_30 = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
const EN_60 = new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0];
const HACE_10 = new Date(Date.now() - 10*24*60*60*1000).toISOString().split('T')[0];
const HACE_5  = new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0];

const SEED_NOTICIAS = [
  {
    id: 1,
    titulo: 'Nuevas medidas para el registro de nacimientos en hospitales públicos',
    fecha: '2026-04-10',
    tag: 'Institucional',
    imagen: '',
    vigencia_inicio: HOY,
    vigencia_fin:    EN_60,
    cuerpo: 'A partir del 15 de abril, todos los hospitales públicos de la provincia contarán con un delegado del Registro Civil para la inscripción inmediata de nacimientos.',
    estado_noticia: 'vigente',
    aprobaciones: [
      { user: 'registroCivil@gmail.com', ts: Date.now() - 200000 },
      { user: 'admin2@registrocivil.gob.ar', ts: Date.now() - 100000 }
    ]
  },
  {
    id: 2,
    titulo: 'El Registro Civil amplía su horario durante mayo',
    fecha: '2026-04-05',
    tag: 'Trámites',
    imagen: '',
    vigencia_inicio: HOY,
    vigencia_fin:    EN_30,
    cuerpo: 'Durante todo el mes de mayo, las sedes del Registro Civil atenderán de 8:00 a 15:00 hs. de lunes a viernes.',
    estado_noticia: 'vigente',
    aprobaciones: [
      { user: 'registroCivil@gmail.com', ts: Date.now() - 150000 },
      { user: 'admin2@registrocivil.gob.ar', ts: Date.now() - 80000 }
    ]
  },
  {
    id: 3,
    titulo: 'Sistema de actas digitales: avance en la modernización',
    fecha: '2026-04-01',
    tag: 'Digitalización',
    imagen: '',
    vigencia_inicio: HACE_10,
    vigencia_fin:    HACE_5,
    cuerpo: 'La provincia avanza en la digitalización de todas sus actas de estado civil. Este sistema permitirá solicitar copias en formato digital con firma electrónica.',
    estado_noticia: 'vencida',
    aprobaciones: [
      { user: 'registroCivil@gmail.com', ts: Date.now() - 900000 },
      { user: 'admin2@registrocivil.gob.ar', ts: Date.now() - 800000 }
    ]
  },
  {
    id: 4,
    titulo: 'Renovación del sistema de turnos en línea',
    fecha: HOY,
    tag: 'Tecnología',
    imagen: '',
    vigencia_inicio: HOY,
    vigencia_fin:    EN_30,
    cuerpo: 'Se implementará un nuevo sistema de turnos en línea para mejorar la atención ciudadana.',
    estado_noticia: 'pendiente',
    aprobaciones: [
      { user: 'registroCivil@gmail.com', ts: Date.now() - 10000 }
    ]
  }
];

const SEED_USUARIOS = [
  {
    id: 1, nombre: 'Administrador Principal',
    email: 'registroCivil@gmail.com', rol: 'admin',
    password: btoa('1422'), permisos: FULL_PERMS
  }
];

/* ════════════════════════════════════════════════
   3. STORE — helpers localStorage
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
   4. AUTH
   ════════════════════════════════════════════════ */

const Auth = {
  check(email, pass) {
    if (email === _CV[0] && pass === _CV[1]) return { rol: 'admin', permisos: FULL_PERMS };
    const us = Store.get(STORAGE_KEYS.USUARIOS) || [];
    const u  = us.find(x => x.email === email && atob(x.password || '') === pass);
    return u || null;
  },
  login(email, userData) {
    const role    = userData?.rol || 'operador';
    const permisos = role === 'admin' ? FULL_PERMS : (userData?.permisos || DEFAULT_OP_PERMS);
    Store.set(STORAGE_KEYS.SESSION, { loggedIn: true, user: email, role, permisos, ts: Date.now() });
  },
  logout()       { localStorage.removeItem(STORAGE_KEYS.SESSION); window.location.href = 'login.html'; },
  isLogged()     { const s = Store.get(STORAGE_KEYS.SESSION); return !!(s && s.loggedIn); },
  currentUser()  { return Store.get(STORAGE_KEYS.SESSION)?.user || null; },
  currentRole()  { return Store.get(STORAGE_KEYS.SESSION)?.role || 'operador'; },
  currentPerms() { return Store.get(STORAGE_KEYS.SESSION)?.permisos || {}; },
  isAdmin()      { return Auth.currentRole() === 'admin'; },
  hasPerm(p)     { return Auth.isAdmin() || Auth.currentPerms()[p] === true; },
  guard()        { if (!Auth.isLogged()) window.location.href = 'login.html'; }
};

/* ════════════════════════════════════════════════
   5. TOAST
   ════════════════════════════════════════════════ */

const Toast = {
  show(msg, type = 'success') {
    const icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' };
    const c = document.getElementById('adm-toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `adm-toast ${type}`;
    el.innerHTML = `<i class="bi ${icons[type]||icons.info}"></i><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all .3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
};

/* ════════════════════════════════════════════════
   6. NAVEGACIÓN
   ════════════════════════════════════════════════ */

function initNav() {
  document.querySelectorAll('.adm-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      const tgt = item.dataset.section;
      document.querySelectorAll('.adm-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`sec-${tgt}`)?.classList.add('active');
      document.querySelector('.adm-sidebar')?.classList.remove('open');
    });
  });
}

function applyPermissions() {
  const perms   = Auth.currentPerms();
  const isAdmin = Auth.isAdmin();
  [['turnos','nav-btn-turnos'], ['usuarios','nav-btn-usuarios'], ['noticias','nav-btn-noticias']].forEach(([key, navId]) => {
    const allowed = isAdmin || perms[key];
    if (!allowed) document.getElementById(navId)?.style.setProperty('display','none');
  });
  if (!Auth.hasPerm('usuarios')) document.getElementById('btn-nuevo-usuario')?.style.setProperty('display','none');
}

/* ════════════════════════════════════════════════
   7. MÓDULO TURNOS (con columna Mail)
   ════════════════════════════════════════════════ */

const ModTurnos = {
  ESTADOS:  ['Pendiente','Asistió','No asistió','Cancelado'],

  load()    { return Store.get(STORAGE_KEYS.TURNOS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.TURNOS, arr); },

  render(filtro = '') {
    const turnos = this.load();
    const stats  = { total: turnos.length, pendiente: 0, asistio: 0, cancelado: 0 };
    turnos.forEach(t => {
      if (t.estado === 'Pendiente')             stats.pendiente++;
      if (t.estado === 'Asistió')               stats.asistio++;
      if (t.estado === 'Cancelado' || t.estado === 'No asistió') stats.cancelado++;
    });

    const sv = id => document.getElementById(id);
    if (sv('stat-total-turnos')) sv('stat-total-turnos').textContent = stats.total;
    if (sv('stat-pendientes'))   sv('stat-pendientes').textContent   = stats.pendiente;
    if (sv('stat-asistio'))      sv('stat-asistio').textContent      = stats.asistio;
    if (sv('stat-cancelado'))    sv('stat-cancelado').textContent    = stats.cancelado;

    const q = filtro.toLowerCase();
    const visible = q
      ? turnos.filter(t =>
          t.nombre.toLowerCase().includes(q) || t.dni.includes(q) ||
          (t.mail || '').toLowerCase().includes(q) || t.tramite.toLowerCase().includes(q) ||
          t.numero.toLowerCase().includes(q) || t.estado.toLowerCase().includes(q)
        )
      : turnos;

    const tbody = document.getElementById('turnos-tbody');
    if (!tbody) return;

    if (!visible.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No se encontraron turnos.</td></tr>`;
      return;
    }

    tbody.innerHTML = visible.map(t => `
      <tr data-id="${t.id}">
        <td><strong>${t.numero}</strong></td>
        <td>${t.fecha}</td>
        <td>${t.hora}</td>
        <td>${t.nombre}</td>
        <td><code style="font-size:12px;">${t.dni}</code></td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${t.mail ? `<a href="mailto:${t.mail}" style="color:var(--adm-blue);font-size:12px;">${t.mail}</a>` : '<span style="color:#ccc;">—</span>'}
        </td>
        <td>${t.tramite}</td>
        <td>
          <select class="estado-select" data-turno-id="${t.id}">
            ${this.ESTADOS.map(e => `<option ${e===t.estado?'selected':''}>${e}</option>`).join('')}
          </select>
        </td>
        <td style="display:flex;gap:4px;">
          <button class="btn-adm-icon edit" data-edit-turno="${t.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn-adm-icon trash" data-delete-turno="${t.id}" title="Eliminar">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.estado-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const id  = parseInt(e.target.dataset.turnoId);
        const ts  = this.load();
        const idx = ts.findIndex(x => x.id === id);
        if (idx !== -1) {
          ts[idx].estado = e.target.value;
          this.save(ts);
          Toast.show(`Turno ${ts[idx].numero}: "${e.target.value}"`, 'success');
          this.render(filtro);
        }
      });
    });

    tbody.querySelectorAll('[data-edit-turno]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = this.load().find(x => x.id === parseInt(btn.dataset.editTurno));
        if (t) this.openModal(t);
      });
    });

    tbody.querySelectorAll('[data-delete-turno]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar este turno?')) return;
        this.save(this.load().filter(x => x.id !== parseInt(btn.dataset.deleteTurno)));
        Toast.show('Turno eliminado', 'warning');
        this.render(filtro);
      });
    });
  },

  openModal(turno = null) {
    const form = document.getElementById('form-turno');
    if (!form) return;
    document.getElementById('modal-turno-titulo').textContent = turno ? 'Editar Turno' : 'Nuevo Turno';

    if (turno) {
      form['turno-id'].value      = turno.id;
      form['turno-numero'].value  = turno.numero;
      form['turno-fecha'].value   = turno.fecha;
      form['turno-hora'].value    = turno.hora;
      form['turno-nombre'].value  = turno.nombre;
      form['turno-dni'].value     = turno.dni;
      form['turno-mail'].value    = turno.mail || '';
      form['turno-tramite'].value = turno.tramite;
      form['turno-estado'].value  = turno.estado;
    } else {
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
    const id = form['turno-id'].value ? parseInt(form['turno-id'].value) : null;
    const datos = {
      numero:  form['turno-numero'].value.trim(),
      fecha:   form['turno-fecha'].value,
      hora:    form['turno-hora'].value,
      nombre:  form['turno-nombre'].value.trim(),
      dni:     form['turno-dni'].value.trim(),
      mail:    form['turno-mail'].value.trim(),
      tramite: form['turno-tramite'].value,
      estado:  form['turno-estado'].value
    };
    if (!datos.nombre || !datos.dni || !datos.fecha) {
      Toast.show('Completá los campos requeridos', 'error'); return;
    }
    const ts = this.load();
    if (id) {
      const idx = ts.findIndex(x => x.id === id);
      if (idx !== -1) { ts[idx] = { ...ts[idx], ...datos }; }
      Toast.show('Turno actualizado', 'success');
    } else {
      ts.push({ id: Store.nextId(ts), ...datos });
      Toast.show('Turno creado', 'success');
    }
    this.save(ts);
    bootstrap.Modal.getInstance(document.getElementById('modal-turno'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('filtro-turno')?.addEventListener('input',   e => this.render(e.target.value));
    document.getElementById('filtro-tramite')?.addEventListener('change', e => this.render(e.target.value));
    document.getElementById('btn-nuevo-turno')?.addEventListener('click',  () => this.openModal());
    document.getElementById('btn-guardar-turno')?.addEventListener('click', () => this.handleFormSave());
    this.render();
  }
};

/* ════════════════════════════════════════════════
   8. MÓDULO USUARIOS
   ════════════════════════════════════════════════ */

const ModUsuarios = {
  load()    { return Store.get(STORAGE_KEYS.USUARIOS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.USUARIOS, arr); },

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
    const sv       = document.getElementById('stat-total-usuarios');
    if (sv) sv.textContent = usuarios.length;
    if (!tbody) return;

    tbody.innerHTML = usuarios.map(u => {
      const isAdm   = u.rol === 'admin';
      const canDel  = Auth.isAdmin() && !isAdm;
      const trashBtn = isAdm
        ? `<button class="btn-adm-icon" disabled title="No se puede eliminar un Administrador" style="opacity:.35;cursor:not-allowed;"><i class="bi bi-shield-lock"></i></button>`
        : canDel
          ? `<button class="btn-adm-icon trash" data-del-user="${u.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>`
          : '';
      return `
        <tr>
          <td><strong>${u.nombre}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge-estado badge-${u.rol}">${u.rol === 'admin' ? 'Administrador' : 'Operador'}</span></td>
          <td>${this.permTags(u)}</td>
          <td style="display:flex;gap:4px;">
            <button class="btn-adm-icon edit" data-edit-user="${u.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
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
    tbody.querySelectorAll('[data-del-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.delUser);
        const u  = this.load().find(x => x.id === id);
        if (!u) return;
        if (u.rol === 'admin') { Toast.show('No se puede eliminar un Administrador','error'); return; }
        if (!Auth.isAdmin())   { Toast.show('Sin permiso para eliminar usuarios','error');   return; }
        if (!confirm(`¿Eliminar a "${u.nombre}"?`)) return;
        this.save(this.load().filter(x => x.id !== id));
        Toast.show(`Usuario "${u.nombre}" eliminado`, 'warning');
        this.render();
      });
    });
  },

  openModal(usuario = null) {
    const form     = document.getElementById('form-usuario');
    const passHelp = document.getElementById('pass-help');
    const rolSel   = document.getElementById('user-rol-select');
    if (!form) return;

    const syncPerms = rol => {
      const isAdm = rol === 'admin';
      ['perm-turnos','perm-noticias','perm-usuarios'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.disabled = isAdm;
        if (isAdm) el.checked = true;
      });
      const sec = document.getElementById('permisos-section');
      if (sec) sec.style.opacity = isAdm ? '.6' : '1';
    };

    document.getElementById('modal-user-titulo').textContent = usuario ? 'Editar Usuario' : 'Nuevo Usuario';

    if (usuario) {
      form['user-id'].value     = usuario.id;
      form['user-nombre'].value = usuario.nombre;
      form['user-email'].value  = usuario.email;
      form['user-rol'].value    = usuario.rol;
      form['user-pass'].value   = '';
      form['user-pass'].placeholder = 'Dejar vacío para no cambiar';
      if (passHelp) passHelp.textContent = 'Dejar vacío para mantener la contraseña actual.';
      form['user-email'].disabled = usuario.email === _CV[0];
      const p = usuario.permisos || DEFAULT_OP_PERMS;
      ['turnos','noticias','usuarios'].forEach(k => {
        const el = document.getElementById(`perm-${k}`);
        if (el) el.checked = !!p[k];
      });
      syncPerms(usuario.rol);
    } else {
      form.reset();
      form['user-id'].value = '';
      form['user-email'].disabled = false;
      form['user-pass'].placeholder = 'Contraseña';
      if (passHelp) passHelp.textContent = 'Requerida para nuevos usuarios.';
      ['turnos','noticias'].forEach(k => { const el = document.getElementById(`perm-${k}`); if(el) el.checked=true; });
      const elU = document.getElementById('perm-usuarios'); if(elU) elU.checked=false;
      syncPerms('operador');
    }

    if (rolSel) {
      rolSel.removeEventListener('change', rolSel._ph);
      rolSel._ph = () => syncPerms(rolSel.value);
      rolSel.addEventListener('change', rolSel._ph);
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
    if (!id && !pass)       { Toast.show('La contraseña es requerida','error');   return; }

    const permisos = rol === 'admin' ? FULL_PERMS : {
      turnos:   !!document.getElementById('perm-turnos')?.checked,
      noticias: !!document.getElementById('perm-noticias')?.checked,
      usuarios: !!document.getElementById('perm-usuarios')?.checked
    };

    const usuarios = this.load();
    if (!id && usuarios.some(u => u.email === email)) {
      Toast.show('Ya existe un usuario con ese email','error'); return;
    }
    if (id) {
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx !== -1) {
        if (usuarios[idx].email === _CV[0] && rol !== 'admin') {
          Toast.show('No se puede cambiar el rol del admin principal','error'); return;
        }
        usuarios[idx] = { ...usuarios[idx], nombre, rol, permisos };
        if (!form['user-email'].disabled) usuarios[idx].email = email;
        if (pass) usuarios[idx].password = btoa(pass);
      }
      Toast.show('Usuario actualizado','success');
    } else {
      usuarios.push({ id: Store.nextId(usuarios), nombre, email, rol, password: btoa(pass), permisos });
      Toast.show('Usuario creado','success');
    }
    this.save(usuarios);
    bootstrap.Modal.getInstance(document.getElementById('modal-usuario'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', () => {
      if (!Auth.hasPerm('usuarios')) { Toast.show('Sin permiso para crear usuarios','error'); return; }
      this.openModal();
    });
    document.getElementById('btn-guardar-usuario')?.addEventListener('click', () => this.handleFormSave());
    this.render();
  }
};

/* ════════════════════════════════════════════════
   9. MÓDULO NOTICIAS
   — Imagen (base64), Vigencia, Doble aprobación,
     3 estados: vigente / pendiente / vencida
   ════════════════════════════════════════════════ */

const ModNoticias = {
  _filtroActivo: 'todas',

  load()    { return Store.get(STORAGE_KEYS.NOTICIAS) || []; },
  save(arr) { Store.set(STORAGE_KEYS.NOTICIAS, arr); },

  /* Actualiza estados según vigencia (auto-expiración) */
  actualizarEstados(arr) {
    const hoy = new Date().toISOString().split('T')[0];
    let changed = false;
    arr.forEach(n => {
      if (n.estado_noticia === 'vigente' && n.vigencia_fin && n.vigencia_fin < hoy) {
        n.estado_noticia = 'vencida';
        changed = true;
      }
    });
    if (changed) this.save(arr);
    return arr;
  },

  /* Badge HTML por estado */
  badgeEstado(estado) {
    const map = {
      vigente:  '<span class="badge-noticia-vigente"><i class="bi bi-check2-circle"></i> Vigente</span>',
      pendiente:'<span class="badge-noticia-pendiente"><i class="bi bi-clock-history"></i> Pend. aprobación</span>',
      vencida:  '<span class="badge-noticia-vencida"><i class="bi bi-archive"></i> Vencida</span>'
    };
    return map[estado] || '';
  },

  /* Cuántas aprobaciones faltan para la noticia */
  aprobacioesFaltantes(n) {
    return Math.max(0, 2 - (n.aprobaciones || []).length);
  },

  /* El usuario actual ya aprobó esta noticia? */
  yaAprobo(n) {
    const me = Auth.currentUser();
    return (n.aprobaciones || []).some(a => a.user === me);
  },

  /* Actualizar contadores de tabs y stats */
  actualizarContadores(todas) {
    const cuentas = { vigente: 0, pendiente: 0, vencida: 0 };
    todas.forEach(n => { if (cuentas[n.estado_noticia] !== undefined) cuentas[n.estado_noticia]++; });
    const sv = id => document.getElementById(id);
    if (sv('stat-total-noticias')) sv('stat-total-noticias').textContent = todas.length;
    if (sv('stat-n-vigentes'))     sv('stat-n-vigentes').textContent     = cuentas.vigente;
    if (sv('stat-n-pendientes'))   sv('stat-n-pendientes').textContent   = cuentas.pendiente;
    if (sv('stat-n-vencidas'))     sv('stat-n-vencidas').textContent     = cuentas.vencida;
    if (sv('tab-count-todas'))     sv('tab-count-todas').textContent     = todas.length;
    if (sv('tab-count-vigente'))   sv('tab-count-vigente').textContent   = cuentas.vigente;
    if (sv('tab-count-pendiente')) sv('tab-count-pendiente').textContent = cuentas.pendiente;
    if (sv('tab-count-vencida'))   sv('tab-count-vencida').textContent   = cuentas.vencida;
  },

  render(filtro = null) {
    if (filtro !== null) this._filtroActivo = filtro;
    let todas = this.actualizarEstados(this.load());
    this.actualizarContadores(todas);

    const grid = document.getElementById('noticias-admin-grid');
    if (!grid) return;

    const visible = this._filtroActivo === 'todas'
      ? todas
      : todas.filter(n => n.estado_noticia === this._filtroActivo);

    if (!visible.length) {
      grid.innerHTML = `<div class="col-12"><div class="adm-empty"><i class="bi bi-newspaper"></i><p>No hay noticias en esta categoría.</p></div></div>`;
      return;
    }

    const isAdmin = Auth.isAdmin();

    grid.innerHTML = visible.map(n => {
      const faltantes = this.aprobacioesFaltantes(n);
      const yaAprobo  = this.yaAprobo(n);
      const puedeAprobar = isAdmin && n.estado_noticia === 'pendiente' && !yaAprobo && faltantes > 0;

      const thumbHtml = n.imagen
        ? `<img src="${n.imagen}" alt="${n.titulo}" style="width:100%;height:110px;object-fit:cover;display:block;"/>`
        : `<i class="bi bi-newspaper" style="font-size:36px;color:var(--adm-red);"></i>`;

      const vigHtml = (n.vigencia_inicio || n.vigencia_fin)
        ? `<div class="adm-noticia-vigencia">
             <i class="bi bi-calendar-range" style="color:var(--adm-muted);"></i>
             ${n.vigencia_inicio || '∞'} → ${n.vigencia_fin || '∞'}
           </div>`
        : '';

      const aprobHtml = n.estado_noticia === 'pendiente'
        ? `<div style="font-size:11px;color:var(--adm-muted);margin-top:4px;">
             <i class="bi bi-people-fill"></i>
             ${(n.aprobaciones||[]).length}/2 aprobaciones
           </div>`
        : '';

      return `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="adm-noticia-card">
            <div class="adm-noticia-thumb">${thumbHtml}</div>
            <div class="adm-noticia-body">
              <span class="adm-noticia-tag">${n.tag || 'General'}</span>
              <div class="adm-noticia-titulo">${n.titulo}</div>
              <div class="adm-noticia-fecha"><i class="bi bi-calendar3"></i> ${n.fecha}</div>
              ${vigHtml}
              <div class="adm-noticia-cuerpo-preview">${n.cuerpo.substring(0,85)}…</div>
              <div class="adm-noticia-footer">
                <div>
                  ${this.badgeEstado(n.estado_noticia)}
                  ${aprobHtml}
                </div>
                <div class="adm-noticia-actions">
                  ${puedeAprobar ? `<button class="btn-adm-success" data-aprobar-noticia="${n.id}" title="Aprobar noticia" style="font-size:12px;padding:4px 10px;"><i class="bi bi-shield-check"></i> Aprobar</button>` : ''}
                  <button class="btn-adm-icon edit" data-edit-noticia="${n.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
                  <button class="btn-adm-icon trash" data-del-noticia="${n.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    /* Eventos */
    grid.querySelectorAll('[data-edit-noticia]').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = this.load().find(x => x.id === parseInt(btn.dataset.editNoticia));
        if (n) this.openModal(n);
      });
    });

    grid.querySelectorAll('[data-del-noticia]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('¿Eliminar esta noticia del historial?')) return;
        this.save(this.load().filter(x => x.id !== parseInt(btn.dataset.delNoticia)));
        Toast.show('Noticia eliminada del historial','warning');
        this.render();
      });
    });

    grid.querySelectorAll('[data-aprobar-noticia]').forEach(btn => {
      btn.addEventListener('click', () => this.aprobar(parseInt(btn.dataset.aprobarNoticia)));
    });
  },

  /* Aprobar noticia (segundo admin) */
  aprobar(id) {
    if (!Auth.isAdmin()) { Toast.show('Solo administradores pueden aprobar noticias','error'); return; }
    const noticias = this.load();
    const idx = noticias.findIndex(n => n.id === id);
    if (idx === -1) return;
    const n = noticias[idx];
    if (this.yaAprobo(n)) { Toast.show('Ya aprobaste esta noticia anteriormente','info'); return; }
    n.aprobaciones = n.aprobaciones || [];
    n.aprobaciones.push({ user: Auth.currentUser(), ts: Date.now() });
    if (n.aprobaciones.length >= 2) {
      n.estado_noticia = 'vigente';
      Toast.show('✓ Noticia aprobada y publicada con éxito','success');
    } else {
      Toast.show('Aprobación registrada. Falta 1 administrador más','info');
    }
    this.save(noticias);
    this.render();
  },

  openModal(noticia = null) {
    const form   = document.getElementById('form-noticia');
    const titulo = document.getElementById('modal-noticia-titulo');
    const b64    = document.getElementById('noticia-imagen-b64');
    const thumb  = document.getElementById('noticia-imagen-thumb');
    const wrap   = document.getElementById('img-preview-wrap');
    const aprobBlk = document.getElementById('aprobacion-info-block');
    if (!form) return;

    if (noticia) {
      titulo.textContent = 'Editar Noticia';
      form['noticia-id'].value              = noticia.id;
      form['noticia-titulo'].value          = noticia.titulo;
      form['noticia-fecha'].value           = noticia.fecha;
      form['noticia-tag'].value             = noticia.tag || '';
      form['noticia-vigencia-inicio'].value = noticia.vigencia_inicio || '';
      form['noticia-vigencia-fin'].value    = noticia.vigencia_fin    || '';
      form['noticia-cuerpo'].value          = noticia.cuerpo;

      if (b64 && noticia.imagen) {
        b64.value    = noticia.imagen;
        thumb.src    = noticia.imagen;
        document.getElementById('img-preview-nombre').textContent = 'Imagen actual';
        document.getElementById('img-preview-size').textContent   = '';
        wrap.classList.add('visible');
      } else {
        if (b64)  b64.value = '';
        if (thumb) thumb.src = '';
        wrap.classList.remove('visible');
      }

      /* Mostrar estado de aprobaciones */
      if (aprobBlk) {
        aprobBlk.style.display = 'block';
        const aprobs = noticia.aprobaciones || [];
        const falta  = Math.max(0, 2 - aprobs.length);
        const dots   = aprobs.map(a => `<span class="aprobacion-dot"><i class="bi bi-check-circle-fill"></i>${a.user}</span>`).join('');
        document.getElementById('aprobaciones-detalle').innerHTML = `
          <strong>Estado:</strong> ${this.badgeEstado(noticia.estado_noticia)}<br>
          <div style="margin-top:6px;">${dots || '<span style="color:#aaa;">Sin aprobaciones aún</span>'}</div>
          ${falta > 0 ? `<div style="margin-top:5px;color:#8a6000;font-size:11.5px;"><i class="bi bi-clock"></i> Faltan ${falta} aprobación${falta>1?'es':''} de administrador.</div>` : ''}`;
      }
    } else {
      titulo.textContent = 'Nueva Noticia';
      form.reset();
      form['noticia-id'].value              = '';
      form['noticia-fecha'].value           = new Date().toISOString().split('T')[0];
      form['noticia-vigencia-inicio'].value = new Date().toISOString().split('T')[0];
      form['noticia-vigencia-fin'].value    = '';
      if (b64)  b64.value = '';
      if (thumb) thumb.src = '';
      wrap.classList.remove('visible');
      if (aprobBlk) aprobBlk.style.display = 'none';
    }

    new bootstrap.Modal(document.getElementById('modal-noticia-form')).show();
  },

  handleFormSave() {
    const form = document.getElementById('form-noticia');
    if (!form) return;
    const id = form['noticia-id'].value ? parseInt(form['noticia-id'].value) : null;

    const titulo    = form['noticia-titulo'].value.trim();
    const cuerpo    = form['noticia-cuerpo'].value.trim();
    const fecha     = form['noticia-fecha'].value;
    const tag       = form['noticia-tag'].value.trim() || 'General';
    const vInicio   = form['noticia-vigencia-inicio'].value;
    const vFin      = form['noticia-vigencia-fin'].value;
    const imgB64    = document.getElementById('noticia-imagen-b64')?.value || '';

    if (!titulo || !cuerpo) { Toast.show('Título y contenido son requeridos','error'); return; }
    if (vInicio && vFin && vFin < vInicio) {
      Toast.show('La fecha de fin debe ser posterior al inicio','error'); return;
    }

    const noticias = this.load();
    const currentUser = Auth.currentUser();

    if (id) {
      const idx = noticias.findIndex(n => n.id === id);
      if (idx !== -1) {
        /* Al editar: si cambia el contenido se resetean aprobaciones */
        const n = noticias[idx];
        const contenidoCambio = n.titulo !== titulo || n.cuerpo !== cuerpo;
        noticias[idx] = {
          ...n, titulo, fecha, tag, imagen: imgB64 || n.imagen,
          vigencia_inicio: vInicio, vigencia_fin: vFin, cuerpo,
          ...(contenidoCambio ? {
            estado_noticia: 'pendiente',
            aprobaciones: [{ user: currentUser, ts: Date.now() }]
          } : {})
        };
        if (contenidoCambio) {
          Toast.show('Noticia modificada. Las aprobaciones se reiniciaron por cambios en el contenido.','warning');
        } else {
          Toast.show('Noticia actualizada correctamente','success');
        }
      }
    } else {
      noticias.unshift({
        id: Store.nextId(noticias),
        titulo, fecha, tag,
        imagen: imgB64,
        vigencia_inicio: vInicio, vigencia_fin: vFin,
        cuerpo,
        estado_noticia: 'pendiente',
        aprobaciones: [{ user: currentUser, ts: Date.now() }]
      });
      Toast.show('Noticia enviada a aprobación. Falta 1 administrador más para publicarla.','info');
    }

    this.save(noticias);
    bootstrap.Modal.getInstance(document.getElementById('modal-noticia-form'))?.hide();
    this.render();
  },

  init() {
    document.getElementById('btn-nueva-noticia')?.addEventListener('click',    () => this.openModal());
    document.getElementById('btn-guardar-noticia')?.addEventListener('click',   () => this.handleFormSave());
    this.render();
  }
};

/* Exponer para uso desde HTML */
window.ModNoticias = ModNoticias;

/* ════════════════════════════════════════════════
   10. LOGIN
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
      errEl.classList.remove('hidden');
      document.getElementById('login-error-msg').textContent = 'Completá todos los campos.';
      return;
    }
    const userData = Auth.check(email, pass);
    if (userData) {
      Auth.login(email, userData);
      window.location.href = 'admin.html';
    } else {
      errEl.classList.remove('hidden');
      document.getElementById('login-error-msg').textContent = 'Credenciales incorrectas.';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    }
  });
}

/* ════════════════════════════════════════════════
   11. INIT ADMIN
   ════════════════════════════════════════════════ */

function initAdmin() {
  if (!document.querySelector('.admin-body')) return;
  Auth.guard();
  Store.initAll();

  const email = Auth.currentUser();
  const el    = document.getElementById('adm-current-user');
  if (el && email) {
    el.textContent = `${email.split('@')[0]} (${Auth.isAdmin() ? 'Admin' : 'Operador'})`;
  }

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
   12. ARRANQUE
   ════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initAdmin();
});
