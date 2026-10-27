import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/** Construye una tarjeta a partir de la plantilla #tpl-equipo. */
const crearTarjeta = (equipo) => {
  const $fragmento = $plantilla.content.cloneNode(true);
  const $li = $fragmento.querySelector("li");
  const $estado = $fragmento.querySelector(".estado");

  $li.dataset.id = equipo.id;
  $fragmento.querySelector(".codigo").textContent = equipo.codigo;
  $fragmento.querySelector(".nombre").textContent = equipo.nombre;
  $fragmento.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "Sin categoría";
  $fragmento.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

  $estado.textContent = equipo.estado;
  $estado.dataset.estado = equipo.estado;

  return $fragmento;
};

/** Muestra el estado vacío cuando la página no trae equipos. */
const mostrarVacio = () => {
  const $vacio = document.createElement("li");
  $vacio.className = "vacio";
  $vacio.textContent = "No hay equipos registrados.";
  $lista.append($vacio);
};

/**
 * Carga una página del inventario y la pinta en la lista.
 * Marca aria-busy mientras espera y actualiza resumen, paginador y botones.
 */
export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const { data = [], meta = {} } = await listarEquipos(pagina, POR_PAGINA);

    paginaActual = meta.current_page ?? pagina;
    ultimaPagina = meta.last_page ?? 1;

    $lista.replaceChildren();

    if (data.length === 0) {
      mostrarVacio();
    } else {
      for (const equipo of data) {
        $lista.append(crearTarjeta(equipo));
      }
    }

    $resumen.textContent = data.length
      ? `Mostrando ${meta.from}–${meta.to} de ${meta.total}`
      : "Mostrando 0 de 0";
    $paginaActual.textContent = `Página ${paginaActual} de ${ultimaPagina}`;

    $btnAnterior.disabled = paginaActual <= 1;
    $btnSiguiente.disabled = paginaActual >= ultimaPagina;
  } catch (error) {
    mostrarMensaje("error", error.message ?? "No fue posible cargar el inventario.");
  } finally {
    $lista.setAttribute("aria-busy", "false");
  }
};

/**
 * Delegación de eventos: un solo listener en la lista atiende el botón
 * Eliminar de todas las tarjetas, incluidas las que todavía no existen.
 */
const alHacerClicEnLista = async (evento) => {
  const $boton = evento.target.closest(".btn-eliminar");
  if (!$boton) return;

  const id = $boton.closest("li")?.dataset.id;
  if (!id) return;

  if (!confirm("¿Seguro que desea eliminar este equipo?")) return;

  $boton.disabled = true;

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    // Si era el último de la página, retrocede una página.
    const eraElUltimo = $lista.querySelectorAll("li[data-id]").length === 1;
    const destino = eraElUltimo && paginaActual > 1 ? paginaActual - 1 : paginaActual;

    await cargarPagina(destino);
  } catch (error) {
    const mensaje = error.status === 409
      ? error.datos.mensaje
      : "No fue posible eliminar el equipo.";

    mostrarMensaje("error", mensaje);
    $boton.disabled = false;
  }
};

export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) cargarPagina(paginaActual - 1);
  });

  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) cargarPagina(paginaActual + 1);
  });

  cargarPagina(1);
};
