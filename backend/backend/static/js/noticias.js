'use strict';

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function excerpt(text, max = 110) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

let _noticiasPublicas = [];

const IMAGEN_DEFAULT =
  'https://i.pinimg.com/736x/8c/c2/b2/8cc2b2e8191e930d298607a299fb92c8.jpg';

function thumbHtml(imagen) {
  const src = imagen || IMAGEN_DEFAULT;
  return `<img src="${escHtml(src)}" alt="" class="news-thumb" loading="lazy">`;
}

async function cargarNoticiasPublicas() {
  const grid = document.getElementById('noticias-grid');
  if (!grid) return;

  try {
    const r = await fetch('/api/noticias/publicas/');
    const data = await r.json();
    const noticias = data.noticias || [];
    _noticiasPublicas = noticias;

    if (noticias.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-3">No hay noticias disponibles.</div>';
      return;
    }

    grid.innerHTML = noticias.map(n => {
      const resumen = excerpt(n.cuerpo);

      return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="news-card">
            ${thumbHtml(n.imagen)}
            <div class="news-body">
              <span class="news-tag">${escHtml(n.tag || 'General')}</span>
              <div class="news-title">${escHtml(n.titulo)}</div>
              <p class="news-excerpt">${escHtml(resumen)}</p>
              <div class="news-date"><i class="bi bi-calendar3"></i> ${escHtml(n.fecha)}</div>
              <button type="button" class="btn-rc" data-bs-toggle="modal" data-bs-target="#modalNoticia"
                data-noticia-id="${n.id}">
                Ver noticia
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch {
    grid.innerHTML = '<div class="col-12 text-center text-muted py-3">No se pudieron cargar las noticias.</div>';
  }
}

function initModalNoticias() {
  const modal = document.getElementById('modalNoticia');
  if (!modal) return;

  modal.addEventListener('show.bs.modal', (event) => {
    const btn = event.relatedTarget;
    if (!btn) return;

    const id = parseInt(btn.dataset.noticiaId, 10);
    const noticia = _noticiasPublicas.find(n => n.id === id);

    if (noticia) {
      document.getElementById('modalNoticiaTitulo').textContent = noticia.titulo;
      document.getElementById('modalNoticiaFecha').innerHTML =
        `<i class="bi bi-calendar3"></i> ${noticia.fecha}`;
      document.getElementById('modalNoticiaCuerpo').textContent = noticia.cuerpo;
      return;
    }

    document.getElementById('modalNoticiaTitulo').textContent =
      btn.getAttribute('data-titulo') || 'Noticia';
    document.getElementById('modalNoticiaFecha').innerHTML =
      '<i class="bi bi-calendar3"></i> ' + (btn.getAttribute('data-fecha') || '');
    document.getElementById('modalNoticiaCuerpo').textContent =
      btn.getAttribute('data-cuerpo') || '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initModalNoticias();
  cargarNoticiasPublicas();
});
