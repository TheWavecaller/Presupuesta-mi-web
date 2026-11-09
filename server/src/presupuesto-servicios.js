import { buscarServicio, IDS_CATALOGO } from "./catalogo.js"
import { MONEDA } from "./tarifas.js"

export const MAX_SERVICIOS = 20

/**
 * Valida una selección de servicios: [{ id, cantidad? }].
 * Comprueba que cada id exista en el catálogo, que no se repita, que haya
 * exactamente un tipo de web (grupo "base") y que las partidas "por unidad"
 * traigan una cantidad entera dentro de su rango.
 *
 * Devuelve { valido: true, seleccion } (solo id y cantidad, nada más) o
 * { valido: false, campos, detalles }.
 */
export function validarSeleccion(servicios) {
  if (!Array.isArray(servicios)) {
    return {
      valido: false,
      campos: ["servicios"],
      detalles: ["'servicios' debe ser una lista de servicios del catálogo"],
    }
  }
  if (servicios.length === 0 || servicios.length > MAX_SERVICIOS) {
    return {
      valido: false,
      campos: ["servicios"],
      detalles: ["Selecciona al menos un servicio del catálogo"],
    }
  }

  const detalles = []
  const campos = new Set()
  const vistos = new Set()
  const seleccion = []

  for (const item of servicios) {
    const id = item?.id
    const servicio = typeof id === "string" ? buscarServicio(id) : undefined

    if (!servicio) {
      campos.add("servicios")
      detalles.push(`El servicio ${JSON.stringify(id ?? null)} no existe en el catálogo`)
      continue
    }
    if (vistos.has(id)) {
      campos.add("servicios")
      detalles.push(`El servicio '${servicio.nombre}' está repetido`)
      continue
    }
    vistos.add(id)

    if (servicio.regla === "unidad") {
      const { cantidad } = item
      if (
        !Number.isInteger(cantidad) ||
        cantidad < servicio.cantidadMin ||
        cantidad > servicio.cantidadMax
      ) {
        campos.add(`servicios.${id}.cantidad`)
        detalles.push(
          `Indica cuántas ${servicio.unidad}s en '${servicio.nombre}' (número entero entre ${servicio.cantidadMin} y ${servicio.cantidadMax})`
        )
        continue
      }
      seleccion.push({ id, cantidad })
    } else {
      seleccion.push({ id, cantidad: 1 })
    }
  }

  const bases = seleccion.filter((s) => buscarServicio(s.id).grupo === "base")
  if (bases.length !== 1) {
    campos.add("servicios.base")
    detalles.push(
      bases.length === 0
        ? "Elige el tipo de web (landing o corporativa): es la partida base del presupuesto"
        : "Solo puede haber un tipo de web: elige landing o corporativa"
    )
  }

  if (detalles.length > 0) {
    return { valido: false, campos: [...campos], detalles }
  }
  return { valido: true, seleccion }
}

/**
 * Calcula el presupuesto de una selección YA validada usando solo las
 * tarifas del catálogo. Las partidas salen en el orden del catálogo.
 */
export function calcularPresupuestoServicios(seleccion) {
  const lineas = seleccion
    .map(({ id, cantidad }) => {
      const s = buscarServicio(id)
      return {
        id,
        nombre: s.nombre,
        descripcion: s.descripcion,
        regla: s.regla,
        unidad: s.unidad ?? null,
        cantidad,
        precioUnitario: s.precio,
        importe: s.precio * cantidad,
      }
    })
    .sort((a, b) => ordenCatalogo(a.id) - ordenCatalogo(b.id))

  return {
    lineas,
    total: lineas.reduce((suma, l) => suma + l.importe, 0),
    moneda: MONEDA,
  }
}

const ordenCatalogo = (id) => IDS_CATALOGO.indexOf(id)
