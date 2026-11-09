import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { calcularPresupuesto } from "../src/presupuesto.js"
import { calcularPresupuestoServicios, validarSeleccion } from "../src/presupuesto-servicios.js"
import { prepararDocumento } from "../src/documento.js"
import {
  ErrorIA,
  ESQUEMA_PROPUESTA,
  generarPropuesta,
  interpretarRespuesta,
  limpiarTexto,
  validarSolicitudCliente,
} from "../src/propuesta.js"

// Modelo simulado: devuelve el objeto indicado como texto JSON (sin llamar a OpenAI)
const modeloQueDevuelve = (objeto) => async () => JSON.stringify(objeto)
const respuesta = (extra = {}) => ({
  resumen: "Web para un restaurante ficticio.",
  servicios: [],
  aclaraciones: [],
  pendientesDeValorar: [],
  ...extra,
})

describe("1 · Solicitud clara que encaja con el catálogo", () => {
  test("se aceptan los servicios propuestos con su justificación", async () => {
    const propuesta = await generarPropuesta(
      { descripcion: "Web de restaurante con carta, reservas y dos idiomas" },
      modeloQueDevuelve(
        respuesta({
          servicios: [
            { id: "corporativa", justificacion: "Varias secciones.", cantidad: null },
            { id: "paginaAdicional", justificacion: "La carta.", cantidad: 1 },
            { id: "formulario", justificacion: "Reservas.", cantidad: null },
            { id: "segundoIdioma", justificacion: "Dos idiomas.", cantidad: null },
          ],
        })
      )
    )
    assert.deepEqual(
      propuesta.servicios.map((s) => [s.id, s.cantidad]),
      [["corporativa", null], ["paginaAdicional", 1], ["formulario", null], ["segundoIdioma", null]]
    )
    assert.deepEqual(propuesta.aclaraciones, [])
  })

  test("el esquema limita los ids al catálogo", () => {
    const enumIds = ESQUEMA_PROPUESTA.properties.servicios.items.properties.id.enum
    assert.deepEqual(enumIds, ["landing", "corporativa", "paginaAdicional", "formulario", "segundoIdioma"])
  })
})

describe("2 · Solicitud ambigua que necesita aclaraciones", () => {
  test("sin tipo de web se marca como dato que falta (aparte de las preguntas)", () => {
    const p = interpretarRespuesta(JSON.stringify(respuesta({ aclaraciones: ["¿Qué secciones necesitas?"] })))
    assert.equal(p.servicios.length, 0)
    assert.deepEqual(p.faltan, ["tipo"])
    assert.deepEqual(p.aclaraciones, ["¿Qué secciones necesitas?"])
  })

  test("las respuestas del cliente se envían al modelo en un bloque delimitado", async () => {
    let entradaRecibida = ""
    await generarPropuesta(
      {
        descripcion: "Web para mi estudio ficticio",
        respuestas: [{ pregunta: "¿Cuántas secciones?", respuesta: "Tres" }],
      },
      async ({ entrada }) => {
        entradaRecibida = entrada
        return JSON.stringify(respuesta())
      }
    )
    assert.match(entradaRecibida, /<respuestas_cliente>[\s\S]*Respuesta: Tres[\s\S]*<\/respuestas_cliente>/)
  })

  test("respuestas con formato incorrecto → 400", () => {
    const r = validarSolicitudCliente({
      cliente: "X",
      descripcion: "Web para mi estudio ficticio",
      respuestas: "tres",
    })
    assert.deepEqual(r.campos, ["respuestas"])
  })

  test("páginas adicionales sin cantidad quedan como dato pendiente", () => {
    const p = interpretarRespuesta(
      JSON.stringify(
        respuesta({
          servicios: [
            { id: "landing", justificacion: "x", cantidad: null },
            { id: "paginaAdicional", justificacion: "y", cantidad: 99 },
          ],
        })
      )
    )
    assert.equal(p.servicios.find((s) => s.id === "paginaAdicional").cantidad, null)
    assert.deepEqual(p.faltan, ["cantidad:paginaAdicional"])
  })

  test("si propone dos tipos de web se queda uno y el otro queda como alternativa", () => {
    const p = interpretarRespuesta(
      JSON.stringify(
        respuesta({
          servicios: [
            { id: "landing", justificacion: "x", cantidad: null },
            { id: "corporativa", justificacion: "y", cantidad: null },
          ],
        })
      )
    )
    assert.deepEqual(p.servicios.map((s) => s.id), ["landing"])
    assert.equal(p.tipoAlternativo, "corporativa")
  })
})

describe("3 · Petición de un servicio que no ofrecemos", () => {
  test("un id inventado no entra en servicios: pasa a pendientes", () => {
    const p = interpretarRespuesta(
      JSON.stringify(
        respuesta({
          servicios: [
            { id: "corporativa", justificacion: "x", cantidad: null },
            { id: "tiendaOnline", justificacion: "Vender ropa", cantidad: null },
          ],
          pendientesDeValorar: [{ necesidad: "Pasarela de pago", motivo: "No está en el catálogo" }],
        })
      )
    )
    assert.deepEqual(p.servicios.map((s) => s.id), ["corporativa"])
    assert.equal(p.pendientes.length, 2)
    assert.ok(p.pendientes.some((x) => x.necesidad.includes("tiendaOnline")))
  })

  test("una decisión pendiente no se cuenta como «fuera del catálogo»", () => {
    const p = interpretarRespuesta(
      JSON.stringify(
        respuesta({
          pendientesDeValorar: [
            { necesidad: "Definir si la web será landing o corporativa", motivo: "No está claro" },
            { necesidad: "Tienda online", motivo: "No está en el catálogo" },
          ],
        })
      )
    )
    assert.deepEqual(p.pendientes.map((x) => x.necesidad), ["Tienda online"])
  })

  test("se eliminan las frases con precios o plazos inventados", () => {
    assert.equal(
      limpiarTexto("Incluye la carta. Cuesta 200 €. Lo entregaremos en 5 días."),
      "Incluye la carta."
    )
    assert.equal(limpiarTexto("¿Tienes algún plazo en mente?"), "¿Tienes algún plazo en mente?")
  })
})

describe("4 · Descripción vacía o no válida", () => {
  test("vacía (solo espacios) → error en 'descripcion'", () => {
    const r = validarSolicitudCliente({ cliente: "Bistró Ficticio", descripcion: "   " })
    assert.equal(r.valido, false)
    assert.deepEqual(r.campos, ["descripcion"])
  })

  test("demasiado larga → error", () => {
    const r = validarSolicitudCliente({ cliente: "X", descripcion: "a".repeat(2001) })
    assert.equal(r.valido, false)
  })

  test("sin cliente y con tipos incorrectos → dos errores", () => {
    const r = validarSolicitudCliente({ cliente: 42, descripcion: ["no"] })
    assert.deepEqual(r.campos, ["cliente", "descripcion"])
  })

  test("válida → textos recortados", () => {
    const r = validarSolicitudCliente({ cliente: "  Bistró  ", descripcion: "  Web para mi restaurante ficticio  " })
    assert.deepEqual(r.datos, {
      cliente: "Bistró",
      descripcion: "Web para mi restaurante ficticio",
      respuestas: [],
    })
  })
})

describe("5 · Fallo en la llamada a OpenAI", () => {
  test("error de red o de la API → ErrorIA 'llamada'", async () => {
    await assert.rejects(
      generarPropuesta({ descripcion: "Web" }, async () => {
        throw new Error("ECONNRESET")
      }),
      (e) => e instanceof ErrorIA && e.codigo === "llamada"
    )
  })

  test("respuesta que no es JSON → ErrorIA 'respuesta_invalida'", async () => {
    await assert.rejects(
      generarPropuesta({ descripcion: "Web" }, async () => "Lo siento, no puedo"),
      (e) => e.codigo === "respuesta_invalida"
    )
  })

  test("JSON con otra forma → ErrorIA 'respuesta_invalida'", () => {
    assert.throws(() => interpretarRespuesta('{"servicios":"todos"}'), (e) => e.codigo === "respuesta_invalida")
  })
})

describe("6 · Modificación de servicios antes del PDF", () => {
  const base = {
    cliente: "Restaurante La Brasa Ficticia",
    resumen: "Web de restaurante.",
    aclaraciones: [],
    pendientes: [],
  }

  test("el documento refleja la selección final y las tarifas del servidor", () => {
    // Propuesta de la IA: corporativa + 1 página + formulario + idioma.
    // El usuario quita el idioma, sube a 3 páginas e intenta mandar precios.
    const r = prepararDocumento({
      ...base,
      servicios: [
        { id: "corporativa", precio: 1 },
        { id: "paginaAdicional", cantidad: 3, importe: 0 },
        { id: "formulario" },
      ],
      total: 5,
    })
    assert.equal(r.valido, true)
    assert.deepEqual(
      r.documento.lineas.map((l) => [l.id, l.cantidad, l.importe]),
      [["corporativa", 1, 600], ["paginaAdicional", 3, 150], ["formulario", 1, 80]]
    )
    assert.equal(r.documento.total, 830)
  })

  test("coincide con el cálculo del ejercicio anterior", () => {
    const nuevo = calcularPresupuestoServicios([
      { id: "landing", cantidad: 1 },
      { id: "paginaAdicional", cantidad: 4 },
      { id: "segundoIdioma", cantidad: 1 },
    ])
    const anterior = calcularPresupuesto({ tipo: "landing", paginas: 5, formulario: false, segundoIdioma: true })
    assert.equal(nuevo.total, anterior.total)
  })

  test("faltan datos: sin tipo de web o sin cantidad no se calcula", () => {
    const r = validarSeleccion([{ id: "paginaAdicional" }, { id: "formulario" }])
    assert.equal(r.valido, false)
    assert.ok(r.campos.includes("servicios.base"))
    assert.ok(r.campos.includes("servicios.paginaAdicional.cantidad"))
  })

  test("servicio inexistente o repetido → rechazado", () => {
    assert.equal(validarSeleccion([{ id: "landing" }, { id: "landing" }]).valido, false)
    assert.equal(validarSeleccion([{ id: "landing" }, { id: "hosting" }]).valido, false)
    assert.equal(validarSeleccion([]).valido, false)
  })

  test("resumen vacío → rechazado", () => {
    const r = prepararDocumento({ ...base, resumen: " ", servicios: [{ id: "landing" }] })
    assert.deepEqual(r.campos, ["resumen"])
  })
})
