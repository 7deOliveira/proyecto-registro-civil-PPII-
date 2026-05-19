function formatFecha(fecha){

    if(!fecha) return "";

    const partes = fecha.split("-");

    if(partes.length !== 3) return fecha;

    const meses = [
        "enero","febrero","marzo","abril",
        "mayo","junio","julio","agosto",
        "septiembre","octubre","noviembre","diciembre"
    ];

    return `${parseInt(partes[2])} de ${
        meses[parseInt(partes[1]) - 1]
    } de ${partes[0]}`;

}


let noticiasGlobal = [];


function cargarNoticias(){

    const grid =
        document.getElementById("noticias-grid");

    if(!grid) return;


    noticiasGlobal =
     (
        JSON.parse(
            localStorage.getItem("rc_noticias")
        ) || []
     )
     .filter(noticia => noticia.estado_noticia === "vigente");


    grid.innerHTML = "";


    if(noticiasGlobal.length === 0){

        grid.innerHTML =
            `<p>No hay noticias</p>`;

        return;

    }


    noticiasGlobal.forEach((noticia,index)=>{

        // detecta TODOS los posibles nombres
        const imagen =
            noticia["noticia-imagen-b64"]
            ||
            noticia.imagen
            ||
            noticia.imagen_b64
            ||
            "";


        grid.innerHTML += `

            <div class="col-md-4">

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
                            ${formatFecha(
                                noticia.fecha
                            )}
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

}


function abrirNoticia(index){

    const noticia =
        noticiasGlobal[index];


    document.getElementById(
        "modalNoticiaTitulo"
    ).textContent =
        noticia.titulo || "";


    document.getElementById(
        "modalNoticiaFecha"
    ).textContent =
        formatFecha(
            noticia.fecha
        );


    document.getElementById(
        "modalNoticiaCuerpo"
    ).textContent =
        noticia.cuerpo || "";


    const imagen =
        noticia["noticia-imagen-b64"]
        ||
        noticia.imagen
        ||
        noticia.imagen_b64
        ||
        "";


    const img =
        document.getElementById(
            "modalNoticiaImagen"
        );


    if(imagen){

        img.src = imagen;

        img.style.display = "block";

    }

    else{

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
