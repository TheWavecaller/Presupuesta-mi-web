// Dirección de la API de presupuestos (carpeta server/)
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

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
