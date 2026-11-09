import { MONEDA, PAGINAS_MAX, TARIFAS } from "./tarifas.js"

/**
 * Catálogo de servicios de la agencia. Es la ÚNICA referencia para preparar
 * propuestas: la IA solo puede elegir estos identificadores y los precios
 * salen siempre de TARIFAS (nunca del modelo ni del navegador).
 *
 * Reglas de cálculo:
 *  - "fijo":     importe = precio
 *  - "unidad":   importe = precio × cantidad (la cantidad es obligatoria)
 *
 * grupo "base": hay que elegir exactamente uno (es el tipo de web).
 */
export const CATALOGO = Object.freeze([
  {
    id: "landing",
    nombre: "Web landing",
    descripcion:
      "Una única página para presentar un producto, servicio o campaña: diseño adaptable a móvil, secciones de presentación y llamada a la acción. Incluye la primera página.",
    precio: TARIFAS.landing,
    regla: "fijo",
    grupo: "base",
  },
  {
    id: "corporativa",
    nombre: "Web corporativa",
    descripcion:
      "Web de empresa con varias secciones y menú de navegación (inicio, quiénes somos, servicios, contacto…), adaptable a móvil. Incluye la primera página.",
    precio: TARIFAS.corporativa,
    regla: "fijo",
    grupo: "base",
  },
  {
    id: "paginaAdicional",
    nombre: "Páginas adicionales",
    descripcion:
      "Cada página o sección independiente a partir de la segunda (por ejemplo: carta, galería, equipo, blog estático).",
    precio: TARIFAS.paginaAdicional,
    regla: "unidad",
    unidad: "página",
    cantidadMin: 1,
    cantidadMax: PAGINAS_MAX - 1,
    grupo: "extra",
  },
  {
    id: "formulario",
    nombre: "Formulario de contacto",
    descripcion:
      "Formulario que envía por correo las consultas o solicitudes de los visitantes (contacto, reservas, presupuestos), con validación de campos.",
    precio: TARIFAS.formulario,
    regla: "fijo",
    grupo: "extra",
  },
  {
    id: "segundoIdioma",
    nombre: "Segundo idioma",
    descripcion:
      "Versión completa de la web en un segundo idioma con selector de idioma. La traducción de los textos la aporta el cliente.",
    precio: TARIFAS.segundoIdioma,
    regla: "fijo",
    grupo: "extra",
  },
])

export const IDS_CATALOGO = CATALOGO.map((s) => s.id)

export function buscarServicio(id) {
  return CATALOGO.find((s) => s.id === id)
}

export const catalogoPublico = () => ({ servicios: CATALOGO, moneda: MONEDA })
