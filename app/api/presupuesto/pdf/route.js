import { renderToBuffer } from "@react-pdf/renderer"

import { errorValidacion, leerJson } from "@/lib/server/http"
import { DocumentoPresupuesto } from "@/lib/pdf/documento-presupuesto"
import { prepararDocumento } from "@/server/src/documento"

// Genera el PDF a partir del contenido revisado. Los importes se vuelven a
// calcular aquí: el PDF refleja siempre la selección final y las tarifas del servidor.
export async function POST(request) {
  const { cuerpo, respuesta } = await leerJson(request)
  if (respuesta) return respuesta

  const resultado = prepararDocumento(cuerpo)
  if (!resultado.valido) return errorValidacion(resultado)

  const { documento } = resultado
  const pdf = await renderToBuffer(
    <DocumentoPresupuesto documento={documento} />
  )
  const nombre = `presupuesto-${slug(documento.cliente)}-${documento.fecha}.pdf`

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  })
}

const slug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "cliente"
