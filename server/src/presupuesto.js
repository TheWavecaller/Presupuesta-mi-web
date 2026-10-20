import { MONEDA, TARIFAS } from "./tarifas.js"

/**
 * Lógica de negocio: calcula el presupuesto desglosado.
 * Es independiente de Express: recibe datos YA validados y solo usa las
 * tarifas del servidor.
 *
 * Total = precio base + páginas adicionales + extras seleccionados
 */
export function calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma }) {
  const base = TARIFAS[tipo]
  const paginasAdicionales = (paginas - 1) * TARIFAS.paginaAdicional
  const costeFormulario = formulario ? TARIFAS.formulario : 0
  const costeSegundoIdioma = segundoIdioma ? TARIFAS.segundoIdioma : 0

  return {
    base,
    paginasAdicionales,
    formulario: costeFormulario,
    segundoIdioma: costeSegundoIdioma,
    total: base + paginasAdicionales + costeFormulario + costeSegundoIdioma,
    moneda: MONEDA,
  }
}
