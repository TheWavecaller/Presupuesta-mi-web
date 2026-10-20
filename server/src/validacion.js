import { PAGINAS_MAX, PAGINAS_MIN, TIPOS_VALIDOS } from "./tarifas.js"

/**
 * Comprueba que el cuerpo cumple el contrato de POST /api/presupuesto.
 * Devuelve { valido: true, datos } con solo los cuatro campos del contrato
 * (las propiedades adicionales se descartan) o { valido: false, campos, detalles }.
 */
export function validarSolicitud(cuerpo) {
  if (typeof cuerpo !== "object" || cuerpo === null || Array.isArray(cuerpo)) {
    return {
      valido: false,
      campos: ["cuerpo"],
      detalles: ["El cuerpo debe ser un objeto JSON enviado con Content-Type: application/json"],
    }
  }

  const { tipo, paginas, formulario, segundoIdioma } = cuerpo
  const campos = []
  const detalles = []

  if (tipo === undefined) {
    campos.push("tipo")
    detalles.push("Falta el campo obligatorio 'tipo'")
  } else if (!TIPOS_VALIDOS.includes(tipo)) {
    campos.push("tipo")
    detalles.push(`'tipo' debe ser uno de: ${TIPOS_VALIDOS.join(", ")}`)
  }

  if (paginas === undefined) {
    campos.push("paginas")
    detalles.push("Falta el campo obligatorio 'paginas'")
  } else if (!Number.isInteger(paginas) || paginas < PAGINAS_MIN || paginas > PAGINAS_MAX) {
    // Number.isInteger rechaza "4" (cadena), 2.5 (decimal), NaN e Infinity
    campos.push("paginas")
    detalles.push(`'paginas' debe ser un número entero entre ${PAGINAS_MIN} y ${PAGINAS_MAX}`)
  }

  for (const [nombre, valor] of [
    ["formulario", formulario],
    ["segundoIdioma", segundoIdioma],
  ]) {
    if (valor === undefined) {
      campos.push(nombre)
      detalles.push(`Falta el campo obligatorio '${nombre}'`)
    } else if (typeof valor !== "boolean") {
      // "false" es una cadena, no un booleano
      campos.push(nombre)
      detalles.push(`'${nombre}' debe ser un booleano (true o false), no ${JSON.stringify(valor)}`)
    }
  }

  if (campos.length > 0) {
    return { valido: false, campos, detalles }
  }

  return { valido: true, datos: { tipo, paginas, formulario, segundoIdioma } }
}
