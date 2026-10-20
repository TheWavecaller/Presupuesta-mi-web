import assert from "node:assert/strict"
import { after, before, describe, test } from "node:test"
import { app } from "../src/app.js"

let servidor
let URL_BASE

before(async () => {
  // Puerto 0: el sistema asigna uno libre, así no choca con `npm start`
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve)
  })
  URL_BASE = `http://localhost:${servidor.address().port}`
})

after(() => servidor.close())

function pedirPresupuesto(cuerpo) {
  return fetch(`${URL_BASE}/api/presupuesto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  })
}

// Solicitud válida de referencia: cada caso inválido cambia un solo campo
const VALIDA = { tipo: "landing", paginas: 1, formulario: false, segundoIdioma: false }

describe("Rutas GET", () => {
  test("GET /api/estado devuelve status ok", async () => {
    const res = await fetch(`${URL_BASE}/api/estado`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { status: "ok" })
  })

  test("GET /api/tarifas devuelve las cinco tarifas", async () => {
    const res = await fetch(`${URL_BASE}/api/tarifas`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), {
      landing: 300,
      corporativa: 600,
      paginaAdicional: 50,
      formulario: 80,
      segundoIdioma: 150,
      moneda: "EUR",
    })
  })
})

describe("POST /api/presupuesto · casos válidos", () => {
  test("Caso 1: landing, 1 página, sin extras → 300 €", async () => {
    const res = await pedirPresupuesto(VALIDA)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), {
      base: 300,
      paginasAdicionales: 0,
      formulario: 0,
      segundoIdioma: 0,
      total: 300,
      moneda: "EUR",
    })
  })

  test("Caso 2: corporativa, 4 páginas, formulario → 830 €", async () => {
    const res = await pedirPresupuesto({
      tipo: "corporativa",
      paginas: 4,
      formulario: true,
      segundoIdioma: false,
    })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), {
      base: 600,
      paginasAdicionales: 150,
      formulario: 80,
      segundoIdioma: 0,
      total: 830,
      moneda: "EUR",
    })
  })

  test("Caso 3: landing, 2 páginas, ambos extras → 580 €", async () => {
    const res = await pedirPresupuesto({ ...VALIDA, paginas: 2, formulario: true, segundoIdioma: true })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).total, 580)
  })

  test("Caso 4: landing, 20 páginas, sin extras → 1250 €", async () => {
    const res = await pedirPresupuesto({ ...VALIDA, paginas: 20 })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).total, 1250)
  })
})

describe("POST /api/presupuesto · casos inválidos (400)", () => {
  const casos = [
    ["Caso 5: paginas 0", { paginas: 0 }, "paginas"],
    ["Caso 6: paginas 21", { paginas: 21 }, "paginas"],
    ["Caso 7: paginas 2.5", { paginas: 2.5 }, "paginas"],
    ["Caso 8: tipo tienda", { tipo: "tienda" }, "tipo"],
    ['Caso 9: formulario "false"', { formulario: "false" }, "formulario"],
    ['Extra: paginas "4" (cadena)', { paginas: "4" }, "paginas"],
  ]

  for (const [nombre, cambio, campo] of casos) {
    test(nombre, async () => {
      const res = await pedirPresupuesto({ ...VALIDA, ...cambio })
      assert.equal(res.status, 400)
      const cuerpo = await res.json()
      assert.equal(cuerpo.error, "Solicitud no válida")
      assert.deepEqual(cuerpo.campos, [campo])
    })
  }

  test("Extra: falta un campo obligatorio", async () => {
    const { segundoIdioma, ...incompleta } = VALIDA
    const res = await pedirPresupuesto(incompleta)
    assert.equal(res.status, 400)
    assert.deepEqual((await res.json()).campos, ["segundoIdioma"])
  })
})

describe("El servidor controla las tarifas", () => {
  test("Ignora un total o tarifas enviados por el cliente", async () => {
    const res = await pedirPresupuesto({ ...VALIDA, total: 1, base: 1, landing: 1 })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).total, 300)
  })
})
