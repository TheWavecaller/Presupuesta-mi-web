import { errorValidacion, leerJson } from "@/lib/server/http"
import { pedirAOpenAI } from "@/lib/server/openai"
import {
  generarPropuesta,
  validarSolicitudCliente,
} from "@/server/src/propuesta"

// Da margen a la llamada a OpenAI en Vercel (segundos)
export const maxDuration = 60

// Interpreta la descripción del cliente con OpenAI y devuelve una propuesta
// de servicios del catálogo, ya validada por el servidor
export async function POST(request) {
  const { cuerpo, respuesta } = await leerJson(request)
  if (respuesta) return respuesta

  const solicitud = validarSolicitudCliente(cuerpo)
  if (!solicitud.valido) return errorValidacion(solicitud)

  try {
    const propuesta = await generarPropuesta(solicitud.datos, pedirAOpenAI)
    return Response.json({ cliente: solicitud.datos.cliente, ...propuesta })
  } catch (error) {
    // El detalle técnico solo va al registro del servidor, nunca al navegador
    console.error(
      "[propuesta]",
      error.codigo ?? "desconocido",
      error.cause ?? error
    )

    if (error.codigo === "configuracion") {
      return Response.json(
        {
          error: "El asistente no está configurado en el servidor",
          reintentable: false,
        },
        { status: 503 }
      )
    }
    return Response.json(
      {
        error:
          error.codigo === "respuesta_invalida"
            ? "La IA devolvió una respuesta que no se pudo validar"
            : "No se pudo contactar con el servicio de IA",
        reintentable: true,
      },
      { status: 502 }
    )
  }
}
