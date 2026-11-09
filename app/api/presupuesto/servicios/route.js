import { errorValidacion, leerJson } from "@/lib/server/http"
import { prepararDocumento } from "@/server/src/documento"

// Recibe la selección revisada por el usuario y devuelve el presupuesto
// calculado con las tarifas del servidor (lo mismo que llevará el PDF)
export async function POST(request) {
  const { cuerpo, respuesta } = await leerJson(request)
  if (respuesta) return respuesta

  const resultado = prepararDocumento(cuerpo)
  if (!resultado.valido) return errorValidacion(resultado)

  return Response.json(resultado.documento)
}
