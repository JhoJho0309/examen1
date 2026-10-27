import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/** Borra los mensajes de error y las marcas aria-invalid del intento anterior. */
const limpiarErrores = () => {
  $form.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
  $form.querySelectorAll("[aria-invalid]").forEach(($campo) => $campo.removeAttribute("aria-invalid"));
};

/** Pinta cada error 422 junto a su campo y marca el campo como inválido. */
const mostrarErroresDeCampo = (errores = {}) => {
  for (const [campo, mensajes] of Object.entries(errores)) {
    const $error = $form.querySelector(`[data-error="${campo}"]`);
    if ($error) $error.textContent = mensajes[0];

    const $campo = $form.elements[campo];
    if ($campo) $campo.setAttribute("aria-invalid", "true");
  }
};

/** Llena el select de categorías con los datos de la API. */
const cargarCategorias = async () => {
  try {
    const { data = [] } = await listarCategorias();

    for (const categoria of data) {
      const $opcion = document.createElement("option");
      $opcion.value = categoria.id;
      $opcion.textContent = categoria.nombre;
      $selectCategoria.append($opcion);
    }
  } catch {
    mostrarMensaje("error", "No fue posible cargar las categorías.");
  }
};

/**
 * Registro de equipos: carga las categorías y maneja el envío del formulario,
 * mostrando los errores 422 campo por campo.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  cargarCategorias();

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();

    const datos = Object.fromEntries(new FormData($form));
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = Number(datos.costo_interno);

    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const { data } = await crearEquipo(datos);

      $form.reset();
      mostrarMensaje("exito", `Equipo ${data.codigo} registrado.`);
      alGuardar();
    } catch (error) {
      if (error.status === 422) {
        mostrarErroresDeCampo(error.datos.errors);
      } else {
        mostrarMensaje("error", "No fue posible registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};
