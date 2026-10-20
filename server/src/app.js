import express from "express"
import { calcularPresupuesto } from "./presupuesto.js"
import { MONEDA, TARIFAS } from "./tarifas.js"
import { validarSolicitud } from "./validacion.js"

export const app = express()

// Permite que una interfaz web en otro puerto (p. ej. la de React) llame a la API
app.use((_req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Headers", "Content-Type")
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  next()
})
app.options("/{*ruta}", (_req, res) => {
  res.sendStatus(204)
})

// Interpreta los cuerpos con Content-Type: application/json
app.use(express.json())

// Raíz: indica qué rutas ofrece la API
app.get("/", (_req, res) => {
  res.json({
    servicio: "API de presupuestos web",
    rutas: ["GET /api/estado", "GET /api/tarifas", "POST /api/presupuesto"],
  })
})

// Comprueba que el servicio está en marcha
app.get("/api/estado", (_req, res) => {
  res.json({ status: "ok" })
})

// Publica las tarifas que aplica el servidor
app.get("/api/tarifas", (_req, res) => {
  res.json({ ...TARIFAS, moneda: MONEDA })
})

// Recibe la solicitud, la valida y devuelve el presupuesto desglosado
app.post("/api/presupuesto", (req, res) => {
  const resultado = validarSolicitud(req.body)

  if (!resultado.valido) {
    return res.status(400).json({
      error: "Solicitud no válida",
      campos: resultado.campos,
      detalles: resultado.detalles,
    })
  }

  res.status(200).json(calcularPresupuesto(resultado.datos))
})

// Ruta inexistente
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Errores: JSON mal formado (400) o fallo interno inesperado (500)
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Solicitud no válida",
      campos: ["cuerpo"],
      detalles: ["El cuerpo no es un JSON válido"],
    })
  }
  console.error(err)
  res.status(500).json({ error: "Error interno del servidor" })
})
