// Tarifas oficiales de la agencia. Solo el servidor las conoce y las aplica:
// nunca se acepta un precio o un total enviado por el cliente.
export const MONEDA = "EUR"

export const TARIFAS = Object.freeze({
  landing: 300, // incluye la primera página
  corporativa: 600, // incluye la primera página
  paginaAdicional: 50, // cada página a partir de la segunda
  formulario: 80,
  segundoIdioma: 150,
})

// Tipos de web admitidos (los que tienen precio base)
export const TIPOS_VALIDOS = ["landing", "corporativa"]

export const PAGINAS_MIN = 1
export const PAGINAS_MAX = 20
