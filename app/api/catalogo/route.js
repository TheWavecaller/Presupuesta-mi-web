import { catalogoPublico } from "@/server/src/catalogo"

// Catálogo de servicios con sus tarifas (para añadir servicios en la revisión)
export function GET() {
  return Response.json(catalogoPublico())
}
