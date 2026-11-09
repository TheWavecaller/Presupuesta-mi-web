import { errorValidacion, leerJson } from "@/lib/server/http"
import { pedirAOpenAI } from "@/lib/server/openai"
import { siguienteTurno, validarConversacion } from "@/server/src/agente"

export const maxDuration = 60

// Un turno de la conversación con V.E.R.A.: recibe el historial y devuelve
// su siguiente mensaje (pregunta, respuestas rápidas o cierre)
export async function POST(request) {
  const { cuerpo, respuesta } = await leerJson(request)
  if (respuesta) return respuesta

  const solicitud = validarConversacion(cuerpo)
  if (!solicitud.valido) return errorValidacion(solicitud)

  try {
    return Response.json(await siguienteTurno(solicitud.datos, pedirAOpenAI))
  } catch (error) {
    console.error("[agente]", error.codigo ?? "desconocido", error.cause ?? error)
    if (error.codigo === "configuracion") {
      return Response.json(
        { error: "El asistente no está configurado en el servidor", reintentable: false },
        { status: 503 }
      )
    }
    return Response.json(
      { error: "El agente no ha podido responder", reintentable: true },
      { status: 502 }
    )
  }
}
