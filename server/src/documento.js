import { buscarServicio } from "./catalogo.js"
import { CLIENTE_MAX, RESPUESTA_MAX } from "./propuesta.js"
import { calcularPresupuestoServicios, validarSeleccion } from "./presupuesto-servicios.js"

export const RESUMEN_MAX = 1500
export const NOTA_MAX = 400
export const NOTAS_MAX = 15

/**
 * Valida el contenido revisado por el usuario y monta el documento del
 * presupuesto con importes calculados en el servidor.
 *
 * Cuerpo: { cliente, resumen, servicios: [{ id, cantidad?, justificacion? }],
 *           aclaraciones: [texto], respuestas: [{ pregunta, respuesta }],
 *           pendientes: [{ necesidad, motivo }] }
 *
 * Se ignora cualquier precio, importe o total que venga en el cuerpo.
 */
export function prepararDocumento(cuerpo, ahora = new Date()) {
  if (typeof cuerpo !== "object" || cuerpo === null || Array.isArray(cuerpo)) {
    return {
      valido: false,
      campos: ["cuerpo"],
      detalles: ["El cuerpo debe ser un objeto JSON"],
    }
  }

  const campos = []
  const detalles = []

  const cliente = texto(cuerpo.cliente)
  if (!cliente || cliente.length > CLIENTE_MAX) {
    campos.push("cliente")
    detalles.push(`Indica el nombre del cliente o empresa (máximo ${CLIENTE_MAX} caracteres)`)
  }

  const resumen = texto(cuerpo.resumen)
  if (!resumen) {
    campos.push("resumen")
    detalles.push("El resumen del proyecto no puede estar vacío")
  } else if (resumen.length > RESUMEN_MAX) {
    campos.push("resumen")
    detalles.push(`El resumen no puede superar los ${RESUMEN_MAX} caracteres`)
  }

  const aclaraciones = listaTextos(cuerpo.aclaraciones)
  if (aclaraciones === null) {
    campos.push("aclaraciones")
    detalles.push(`'aclaraciones' debe ser una lista de hasta ${NOTAS_MAX} textos de ${NOTA_MAX} caracteres como máximo`)
  }

  const respuestas = listaRespuestas(cuerpo.respuestas)
  if (respuestas === null) {
    campos.push("respuestas")
    detalles.push(`'respuestas' debe ser una lista de hasta ${NOTAS_MAX} pares { pregunta, respuesta }`)
  }

  const pendientes = listaPendientes(cuerpo.pendientes)
  if (pendientes === null) {
    campos.push("pendientes")
    detalles.push(`'pendientes' debe ser una lista de hasta ${NOTAS_MAX} necesidades`)
  }

  const seleccion = validarSeleccion(cuerpo.servicios)
  if (!seleccion.valido) {
    campos.push(...seleccion.campos)
    detalles.push(...seleccion.detalles)
  }

  if (campos.length > 0) return { valido: false, campos, detalles }

  // Justificaciones de la IA (revisables): solo texto, recortado
  const justificaciones = new Map(
    cuerpo.servicios.map((s) => [s?.id, texto(s?.justificacion).slice(0, NOTA_MAX)])
  )
  const calculo = calcularPresupuestoServicios(seleccion.seleccion)

  return {
    valido: true,
    documento: {
      cliente,
      fecha: ahora.toISOString().slice(0, 10),
      fechaTexto: new Intl.DateTimeFormat("es-ES", {
        dateStyle: "long",
        timeZone: "Europe/Madrid",
      }).format(ahora),
      resumen,
      lineas: calculo.lineas.map((l) => ({
        ...l,
        justificacion: justificaciones.get(l.id) || null,
        detalle: detalleLinea(l),
      })),
      total: calculo.total,
      moneda: calculo.moneda,
      aclaraciones,
      respuestas,
      pendientes,
    },
  }
}

function detalleLinea(l) {
  if (l.regla !== "unidad") return null
  const s = buscarServicio(l.id)
  return `${l.cantidad} ${l.cantidad === 1 ? s.unidad : `${s.unidad}s`} × ${l.precioUnitario} €`
}

const texto = (v) => (typeof v === "string" ? v.trim() : "")

function listaTextos(valor) {
  if (valor === undefined) return []
  if (!Array.isArray(valor) || valor.length > NOTAS_MAX) return null
  const lista = valor.map(texto)
  if (lista.some((t) => t.length > NOTA_MAX)) return null
  return lista.filter(Boolean)
}

function listaPendientes(valor) {
  if (valor === undefined) return []
  if (!Array.isArray(valor) || valor.length > NOTAS_MAX) return null
  const lista = valor.map((p) => ({
    necesidad: texto(p?.necesidad),
    motivo: texto(p?.motivo),
  }))
  if (lista.some((p) => p.necesidad.length > 200 || p.motivo.length > NOTA_MAX)) return null
  return lista.filter((p) => p.necesidad)
}

function listaRespuestas(valor) {
  if (valor === undefined) return []
  if (!Array.isArray(valor) || valor.length > NOTAS_MAX) return null
  const lista = valor.map((r) => ({
    pregunta: texto(r?.pregunta),
    respuesta: texto(r?.respuesta),
  }))
  if (lista.some((r) => r.pregunta.length > RESPUESTA_MAX || r.respuesta.length > RESPUESTA_MAX)) return null
  return lista.filter((r) => r.pregunta && r.respuesta)
}
