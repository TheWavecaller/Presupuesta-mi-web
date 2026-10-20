import { app } from "./app.js"

const PUERTO = Number(process.env.PORT) || 3000

app.listen(PUERTO, () => {
  console.log(`API de presupuestos escuchando en http://localhost:${PUERTO}`)
})
