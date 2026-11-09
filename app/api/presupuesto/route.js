import { errorValidacion, leerJson } from "@/lib/server/http"
import { calcularPresupuesto } from "@/server/src/presupuesto"
import { validarSolicitud } from "@/server/src/validacion"

// Contrato del ejercicio anterior: { tipo, paginas, formulario, segundoIdioma }
export async function POST(request) {
  const { cuerpo, respuesta } = await leerJson(request)
  if (respuesta) return respuesta

  const resultado = validarSolicitud(cuerpo)
  if (!resultado.valido) return errorValidacion(resultado)

  return Response.json(calcularPresupuesto(resultado.datos))
}
