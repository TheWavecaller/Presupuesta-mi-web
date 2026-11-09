import { MONEDA, TARIFAS } from "@/server/src/tarifas"

// Publica las tarifas que aplica el servidor
export function GET() {
  return Response.json({ ...TARIFAS, moneda: MONEDA })
}
