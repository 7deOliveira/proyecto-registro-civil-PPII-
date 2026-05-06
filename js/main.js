/**
 * main.js — Noticias públicas con imagen
*/

function formatFecha(fecha){

  if(!fecha) return "";

  const partes = fecha.split("-");

  if(partes.length !== 3) return fecha;

  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
  ];

  return `${parseInt(partes[2])} de ${
    meses[parseInt(partes[1])-1]
  } de ${partes[0]}`;

}

function cargarNoticias(){

  const grid =
    document.getElementById("noticias-grid");

  if(!grid) return;

  let noticias = [];

  try{

    noticias = JSON.parse(
      localStorage.getItem("rc_noticias")
    ) || [];

  }catch{

    noticias = [];

  }

  // SOLO VIGENTES
  noticias = noticias.filter(
    noticia =>
      noticia.estado_noticia === "vigente"
      ||
      !noticia.estado_noticia
  );

  grid.innerHTML = "";

  if(noticias.length===0){

    grid.innerHTML=`
      <div class="col-12 text-center py-4">
        No hay noticias disponibles
      </div>
    `;

    return;

  }

  noticias.slice(0,3).forEach((noticia,index)=>{

    // ESTE ES EL CAMPO REAL DEL ADMIN
    const imagen =
      noticia["noticia-imagen-b64"] || "";

    const fecha =
      formatFecha(noticia.fecha);

    grid.innerHTML += `

      <div class="col-12 col-md-4">

        <div class="news-card">

          ${
            imagen
            ?
            `<img
              src="${imagen}"
              class="news-thumb"
            >`
            :
            `<div class="news-thumb-placeholder">
              📰
            </div>`
          }

          <div class="news-body">

            <span class="news-tag">
              ${noticia.tag || "Noticia"}
            </span>

            <div class="news-title">
              ${noticia.titulo || ""}
            </div>

            <div class="news-date">
              ${fecha}
            </div>

            <button
              class="btn-rc"
              onclick="abrirNoticia(${index})">

              Ver noticia

            </button>

          </div>

        </div>

      </div>

    `;

  });

  window.noticiasPublicas = noticias;

}

function abrirNoticia(index){

  const noticia =
    window.noticiasPublicas[index];

  if(!noticia) return;

  document.getElementById(
    "modalNoticiaTitulo"
  ).textContent =
    noticia.titulo || "";

  document.getElementById(
    "modalNoticiaFecha"
  ).textContent =
    formatFecha(noticia.fecha);

  document.getElementById(
    "modalNoticiaCuerpo"
  ).textContent =
    noticia.cuerpo || "";

  const imagen =
    noticia["noticia-imagen-b64"];

  const img =
    document.getElementById(
      "modalNoticiaImagen"
    );

  if(imagen){

    img.src = imagen;

    img.style.display = "block";

  }else{

    img.style.display = "none";

  }

  new bootstrap.Modal(
    document.getElementById(
      "modalNoticia"
    )
  ).show();

}

document.addEventListener(
  "DOMContentLoaded",
  cargarNoticias
);