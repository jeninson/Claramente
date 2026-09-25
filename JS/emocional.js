import { enviarPeticion } from "./herramientas.js";

let selectedEmotionId = null;

export async function cargarEmociones() {
    // Lógica para cargar las emociones
    let info = "", $div_emociones = document.getElementById("emotion-grid");
    $div_emociones.innerHTML = `<div role="status">
        <svg aria-hidden="true" class="w-8 h-8 text-neutral-tertiary animate-spin fill-brand" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="sr-only">Cargando emociones...</span>
        </div>`; // Mensaje de carga

    await enviarPeticion({
        url: "../backend/vista_emociones/index.php",
        method: "GET",
        params: {},
        fSucces: (resp) => {
            //console.log("Respuesta del servidor:", resp);
            if (resp.code == 200) {
                //alert("Inicio de sesión exitoso");
                info = "";
                resp.datos.forEach(emocion => {
                    //console.log("Datos de la emoción:", emocion);
                    info += `<button value="${emocion.ID_EMOCION}"
                        class="emotion-card group flex flex-col items-center justify-center p-6 bg-surface border-2 border-transparent rounded-[24px] hover:border-primary-container hover:bg-surface-container-high transition-all duration-300"
                        onclick="selectEmotion(this)">
                        <span
                            class="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">${emocion.ICONO}</span>
                        <span class="font-label-md text-label-md text-on-surface-variant">${emocion.NOMBRE}</span>
                    </button>`;
                });
            }
            else { alert(resp.msg || "Error en la petición"); }
        }
    });
    $div_emociones.innerHTML = info; // Limpiar el contenido previo
}

// --- Selección de emoción ---
// Se llama desde el atributo onclick="selectEmotion(this)" de cada botón generado en cargarEmociones()
export function selectEmotion(boton) {
    document.querySelectorAll("#emotion-grid .emotion-card").forEach(b => b.classList.remove("active"));
    boton.classList.add("active");
    selectedEmotionId = boton.value;
}

// --- Guardar registro ---
// Se llama desde el botón "Guardar Registro" (onclick="saveRegistry()")
export async function saveRegistry() {
    if (!selectedEmotionId) {
        alert("Por favor selecciona cómo te sientes antes de guardar.");
        return;
    }

    const intensidad = document.getElementById("intensity-slider").value;
    const comentario = document.getElementById("notes").value;

    await enviarPeticion({
        url: "../backend/vista_emociones/index.php",
        method: "POST",
        params: {
            id_emocion: selectedEmotionId,
            intensidad: intensidad,
            comentario: comentario,
            id_usuario: localStorage.getItem("iduser")
        },
        fSucces: (resp) => {
            if (resp.code == 200) {
                document.getElementById("success-modal").classList.remove("hidden", "opacity-0");
            } else {
                alert(resp.msg || "No se pudo guardar el registro.");
            }
        }
    });
}

export function closeModal() {
    document.getElementById("success-modal").classList.add("opacity-0");
    setTimeout(() => {document.getElementById("success-modal").classList.add("hidden"); window.location.reload();}, 300);
}

// Exponer al scope global porque el HTML las llama vía atributos onclick
window.selectEmotion = selectEmotion;
window.saveRegistry = saveRegistry;
window.closeModal = closeModal;

// --- Actualizar el número visible junto al slider de intensidad ---
// El input existe de forma estática en Registro_emocional.html; el optional chaining (?.)
// evita errores en otras páginas donde este elemento no exista.
document.getElementById("intensity-slider")?.addEventListener("input", (e) => {
    document.getElementById("intensity-value").textContent = e.target.value;
});

export async function cargarEstadisticas() { 
    await enviarPeticion({
        url: "../backend/vista_emociones/index.php",
        method: "GET",
        params: {
            id: "*",
            id_usuario: localStorage.getItem("iduser")
        },
        fSucces: (resp) => {
            if (resp.code == 200) {
                estadistica(resp.datos)
            } else {
                alert(resp.msg || "No se pudo guardar el registro.");
            }
        }
    });
}

function estadistica(datos) {
    const emocionpredominante = document.getElementById("emocion-predominante");
    const emocionactual = document.getElementById("emocion-actual");
    const totalregistros = document.getElementById("total-registros");
    const fechaemocion = document.getElementById("fecha-emocion");
    const intensidadpredominante = document.getElementById("intensidad-predominante");  
    const tabla = document.querySelector("#historico-emocional tbody");
    const grafico = document.getElementById("grafico-frecuencia");
    let historial = "", barras ="";
    console.log(datos);
    datos.forEach((emocion) => {
        totalregistros.textContent = datos.length;
        emocionactual.textContent = emocion.NOMBRE;
        fechaemocion.textContent = emocion.FECHA_REG;
        intensidadpredominante.textContent = emocion.INTENSIDAD;
        barras += `
            <div class="w-full flex flex-col items-center gap-2 h-full justify-end">
                <div class="w-full bg-primary-container rounded-t-lg transition-all hover:brightness-110 flex items-center justify-center text-xs font-bold" style="height: ${emocion.INTENSIDAD*10}%;">${emocion.INTENSIDAD}</div>
                <span class="font-label-sm text-label-sm rotate-45 mt-4 whitespace-nowrap">${emocion.NOMBRE}</span>
            </div>
        `;
        historial += `
            <tr>
                <td class="px-8 py-5">${emocion.FECHA_REG}</td>
                <td class="px-8 py-5">
                    <span class="flex items-center gap-2">
                        <!--<span class="w-2 h-2 rounded-full bg-verde-menta"></span>-->
                        <span class="text-4xl group-hover:scale-125 transition-transform duration-300">${emocion.ICONO}</span>
                        ${emocion.NOMBRE}
                    </span>
                </td>
                <td class="px-8 py-5 text-on-surface-variant truncate max-w-xs">${emocion.COMENTARIO}</td>
                <td class="px-8 py-5">
                    <div class="flex gap-0.5" title="Intensidad de la emoción: ${emocion.INTENSIDAD}/10">
                        ${intensidadenEstrella(emocion.INTENSIDAD/2)}
                    </div>
                </td>
                <td class="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined cursor-pointer text-on-surface-variant hover:text-primary" data-icon="chevron_right">chevron_right</span>
                </td>
            </tr>
        `;
    });
    tabla.innerHTML = historial;
    grafico.innerHTML = barras;
}

function intensidadenEstrella(datos) {
    let intensidad = Math.round(datos);
    switch (intensidad) {
        case 0:
            return `
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
            `;
        case 1:
            return `
                <span class="material-symbols text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
            `;
        case 2:
            return `
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm"data-icon="star">star</span>
            `;
        case 3:
            return `
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
            `;
        case 4:
            return `
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-outline-variant text-sm" data-icon="star">star</span>
            `;
        case 5:
            return `
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill">star</span>
                <span class="material-symbols-outlined text-primary text-sm" data-icon="star" data-weight="fill[1]">star</span>
            `;
    }
}