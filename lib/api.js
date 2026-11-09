import { useSyncExternalStore } from "react"

// Dirección de la API. Por defecto, el mismo servidor de Next.js (rutas app/api),
// que es lo que se despliega en Vercel. Para usar la API Express de server/,
// define NEXT_PUBLIC_API_URL=http://localhost:3000 en .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

// URL absoluta para mostrarla (p. ej. en el comando curl). En el servidor no
// existe window: se usa con useUrlApi() para no romper la hidratación.
export const urlApi = () =>
  API_URL || (typeof window === "undefined" ? "" : window.location.origin)

const sinSuscripcion = () => () => {}
export const useUrlApi = () =>
  useSyncExternalStore(sinSuscripcion, urlApi, () => API_URL)

export async function obtenerTarifas() {
  const res = await fetch(`${API_URL}/api/tarifas`)
  if (!res.ok) throw new Error(`La API respondió ${res.status}`)
  return res.json()
}

// Envía el cuerpo tal cual (texto JSON) y devuelve el estado y el contenido.
// No se calcula nada aquí: el presupuesto lo decide siempre el servidor.
export async function pedirPresupuesto(cuerpoJson) {
  const res = await fetch(`${API_URL}/api/presupuesto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpoJson,
  })
  return { estado: res.status, datos: await res.json() }
}

/* ─── Asistente con IA ───────────────────────────────────────────────────── */

export async function obtenerCatalogo() {
  const res = await fetch(`${API_URL}/api/catalogo`)
  if (!res.ok) throw new Error(`La API respondió ${res.status}`)
  return res.json()
}

// Devuelve { estado, datos }. estado 0 = sin conexión con el servidor.
async function postJson(ruta, cuerpo) {
  try {
    const res = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    })
    const datos = await res
      .json()
      .catch(() => ({ error: `Error ${res.status}` }))
    return { estado: res.status, datos }
  } catch {
    return {
      estado: 0,
      datos: {
        error: "No se pudo conectar con el servidor",
        reintentable: true,
      },
    }
  }
}

export const pedirPropuesta = (cuerpo) => postJson("/api/propuesta", cuerpo)
export const conversarConAgente = (cuerpo) => postJson("/api/agente", cuerpo)
export const calcularSeleccion = (cuerpo) =>
  postJson("/api/presupuesto/servicios", cuerpo)

// Pide el PDF al servidor (que recalcula los importes) y devuelve un Blob
export async function generarPdf(cuerpo) {
  let res
  try {
    res = await fetch(`${API_URL}/api/presupuesto/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    })
  } catch {
    return {
      estado: 0,
      datos: { error: "No se pudo conectar con el servidor" },
    }
  }
  if (!res.ok)
    return { estado: res.status, datos: await res.json().catch(() => ({})) }
  const nombre =
    res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ??
    "presupuesto.pdf"
  return { estado: 200, blob: await res.blob(), nombre }
}
