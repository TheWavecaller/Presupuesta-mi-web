import "server-only"

// Utilidades comunes de los Route Handlers (mismo formato de error que la API Express)

export function errorValidacion({ campos, detalles }) {
  return Response.json(
    { error: "Solicitud no válida", campos, detalles },
    { status: 400 }
  )
}

/** Lee el cuerpo JSON. Devuelve { cuerpo } o { respuesta } con un 400 listo para enviar. */
export async function leerJson(request) {
  try {
    return { cuerpo: await request.json() }
  } catch {
    return {
      respuesta: errorValidacion({
        campos: ["cuerpo"],
        detalles: ["El cuerpo no es un JSON válido"],
      }),
    }
  }
}
