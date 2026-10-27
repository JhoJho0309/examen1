import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/**
 * Cliente HTTP único de la aplicación.
 *
 * Centraliza la URL base, el encabezado Accept, el token Bearer, la
 * serialización a JSON, el tiempo máximo de espera y la traducción de
 * cualquier respuesta no exitosa a un ErrorApi. Ningún otro archivo
 * llama a fetch, salvo auth.js.
 */
export const request = async (ruta, opciones = {}) => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  const cabeceras = { Accept: "application/json", ...(opciones.headers ?? {}) };

  const token = obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let cuerpo = opciones.body;
  if (cuerpo && typeof cuerpo === "object" && !(cuerpo instanceof FormData)) {
    cabeceras["Content-Type"] = "application/json";
    cuerpo = JSON.stringify(cuerpo);
  }

  try {
    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers: cabeceras,
      body: cuerpo,
      signal: controlador.signal,
    });

    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(respuesta.status, datos);
    }

    return datos;
  } finally {
    clearTimeout(temporizador);
  }
};
