import {
  Document,
  LinearGradient,
  Page,
  Path,
  Stop,
  StyleSheet,
  Svg,
  Defs,
  Text,
  View,
} from "@react-pdf/renderer"

import { ANILLOS_VERA } from "@/lib/simbolo-vera"

/*
 * Plantilla del presupuesto en PDF (@react-pdf/renderer).
 * Recibe el documento YA calculado por el servidor (prepararDocumento):
 * aquí no se calcula ningún importe, solo se maqueta.
 */

const VIOLETA = "#7c3aed"
const FUCSIA = "#c026d3"
const TINTA = "#1e1b2e"
const GRIS = "#6b6880"
const LINEA = "#e7e3f3"
const FONDO_SUAVE = "#f7f5fc"

const euros = (importe, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  })
    .format(importe)
    // Helvetica estándar no tiene el espacio fino U+202F: se usa uno normal
    .replace(/ /g, " ")

// Margen superior de todas las páginas (la cabecera de la primera lo compensa
// con un margen negativo para llegar al borde) e inferior para el pie
const MARGEN_SUPERIOR = 52
const MARGEN_INFERIOR = 64
const INTERLINEADO = 1.45

const s = StyleSheet.create({
  pagina: {
    paddingTop: MARGEN_SUPERIOR,
    paddingBottom: MARGEN_INFERIOR,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TINTA,
    // Sin lineHeight aquí: si la página lo define, el texto «Página X de Y»
    // (que usa totalPages) desaparece (fallo de @react-pdf 4.x). Se aplica en
    // cada estilo de texto (un lineHeight sin unidades en un View no se hereda bien).
  },
  cabecera: {
    position: "relative",
    height: 104,
    marginTop: -MARGEN_SUPERIOR,
    marginBottom: 18,
  },
  // Encabezado (páginas 2+) y pie (todas): textos fijos independientes con
  // posición absoluta. Un Text con `render` dentro de un View fijo no se
  // dibuja en @react-pdf 4.x; un Text fijo con su propio `render`, sí.
  margen: { position: "absolute", fontSize: 7.5, color: GRIS },
  encabezadoIzquierda: {
    top: 24,
    left: 44,
    color: VIOLETA,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
  },
  encabezadoDerecha: { top: 24, left: 260, right: 44, textAlign: "right" },
  encabezadoLinea: {
    position: "absolute",
    top: 38,
    left: 44,
    right: 44,
  },
  linea: { height: 0.75, backgroundColor: LINEA },
  pieLinea: {
    position: "absolute",
    bottom: 40,
    left: 44,
    right: 44,
    height: 0.75,
    backgroundColor: LINEA,
  },
  pieIzquierda: { bottom: 26, left: 44, right: 150 },
  pieDerecha: { bottom: 26, left: 445, right: 44, textAlign: "right" },
  cabeceraContenido: {
    position: "absolute",
    top: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  marca: { flexDirection: "row", alignItems: "center", gap: 6 },
  marcaTexto: {
    color: "#ffffff",
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
  },
  titulo: {
    color: "#ffffff",
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
  },
  metaDerecha: { alignItems: "flex-end", color: "#ffffff" },
  metaEtiqueta: {
    fontSize: 7.5,
    color: "#ede9fe",
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValor: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  cuerpo: { paddingHorizontal: 44 },
  seccion: { marginBottom: 14 },
  seccionTitulo: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: VIOLETA,
    letterSpacing: 1.6,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  parrafo: { fontSize: 10.5, color: TINTA, lineHeight: INTERLINEADO },
  tablaCabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: TINTA,
    paddingBottom: 5,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: GRIS,
    letterSpacing: 0.8,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: LINEA,
    paddingVertical: 7,
  },
  colServicio: { flex: 1, paddingRight: 12 },
  colCantidad: { width: 52, textAlign: "center" },
  colPrecio: { width: 70, textAlign: "right" },
  colImporte: { width: 74, textAlign: "right" },
  servicioNombre: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  servicioDescripcion: {
    fontSize: 8,
    color: GRIS,
    marginTop: 1,
    lineHeight: 1.35,
  },
  servicioJustificacion: {
    fontSize: 8,
    color: VIOLETA,
    marginTop: 2,
    lineHeight: 1.35,
    fontFamily: "Helvetica-Oblique",
  },
  numero: { fontSize: 10 },
  totalCaja: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: 230,
    borderRadius: 8,
    overflow: "hidden",
  },
  totalContenido: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalEtiqueta: { color: "#ede9fe", fontSize: 9, letterSpacing: 1 },
  totalImporte: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  notaImpuestos: { fontSize: 8, color: GRIS, textAlign: "right", marginTop: 5 },
  tarjeta: {
    backgroundColor: FONDO_SUAVE,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderLeftWidth: 3,
    borderLeftColor: VIOLETA,
    marginBottom: 5,
  },
  tarjetaAviso: { borderLeftColor: FUCSIA },
  puntoTexto: { fontSize: 9.5, lineHeight: INTERLINEADO },
  necesidad: { fontFamily: "Helvetica-Bold" },
  vacio: { fontSize: 9.5, color: GRIS },
  respuesta: { fontFamily: "Helvetica-Bold", color: VIOLETA },
})

// Símbolo de la marca: el anillo de V.E.R.A.
function SimboloVera({ size = 10, color = "#ffffff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ANILLOS_VERA.map(({ d, opacidad }) => (
        <Path
          key={opacidad}
          fillRule="evenodd"
          fill={color}
          opacity={opacidad}
          d={d}
        />
      ))}
    </Svg>
  )
}

// Fondo degradado violeta → fucsia (SVG, se ve igual en cualquier visor)
function Degradado({ width, height, radio = 0 }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="marca" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={VIOLETA} />
          <Stop offset="1" stopColor={FUCSIA} />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#marca)"
        d={
          radio
            ? `M${radio} 0H${width - radio}Q${width} 0 ${width} ${radio}V${height - radio}Q${width} ${height} ${width - radio} ${height}H${radio}Q0 ${height} 0 ${height - radio}V${radio}Q0 0 ${radio} 0Z`
            : `M0 0H${width}V${height}H0Z`
        }
      />
    </Svg>
  )
}

// Cada elemento es una tarjeta que nunca se parte entre páginas: el salto de
// página siempre cae entre tarjetas
function Tarjeta({ children, aviso }) {
  return (
    <View style={[s.tarjeta, aviso && s.tarjetaAviso]} wrap={false}>
      <Text style={s.puntoTexto}>{children}</Text>
    </View>
  )
}

// Título de sección: nunca se queda solo al final de una página
function TituloSeccion({ children }) {
  return (
    <Text style={s.seccionTitulo} minPresenceAhead={70}>
      {children}
    </Text>
  )
}

export function DocumentoPresupuesto({ documento }) {
  const d = documento
  return (
    <Document
      title={`Presupuesto · ${d.cliente}`}
      author="Presupuesta mi web"
      subject="Presupuesto de proyecto web"
      language="es-ES"
    >
      <Page size="A4" style={s.pagina}>
        {/* Encabezado de continuación: solo de la página 2 en adelante */}
        <Text
          fixed
          style={[s.margen, s.encabezadoIzquierda]}
          render={({ pageNumber }) =>
            pageNumber > 1 ? "PRESUPUESTA MI WEB · PRESUPUESTO" : ""
          }
        />
        <Text
          fixed
          style={[s.margen, s.encabezadoDerecha]}
          render={({ pageNumber }) =>
            pageNumber > 1 ? `${d.cliente} · ${d.fechaTexto}` : ""
          }
        />
        <View
          fixed
          style={s.encabezadoLinea}
          render={({ pageNumber }) =>
            pageNumber > 1 ? <View style={s.linea} /> : null
          }
        />

        <View style={s.cabecera}>
          <Degradado width={595.28} height={104} />
          <View style={s.cabeceraContenido}>
            <View>
              <View style={s.marca}>
                <SimboloVera size={9} />
                <Text style={s.marcaTexto}>PRESUPUESTA MI WEB</Text>
              </View>
              <Text style={s.titulo}>Presupuesto</Text>
            </View>
            <View style={s.metaDerecha}>
              <Text style={s.metaEtiqueta}>CLIENTE</Text>
              <Text style={s.metaValor}>{d.cliente}</Text>
              <Text style={s.metaEtiqueta}>FECHA</Text>
              <Text style={s.metaValor}>{d.fechaTexto}</Text>
            </View>
          </View>
        </View>

        <View style={s.cuerpo}>
          <View style={s.seccion}>
            <TituloSeccion>Resumen del proyecto</TituloSeccion>
            <Text style={s.parrafo}>{d.resumen}</Text>
          </View>

          <View style={s.seccion}>
            <TituloSeccion>Servicios confirmados</TituloSeccion>
            <View style={s.tablaCabecera}>
              <Text style={s.colServicio}>SERVICIO</Text>
              <Text style={s.colCantidad}>CANT.</Text>
              <Text style={s.colPrecio}>PRECIO</Text>
              <Text style={s.colImporte}>IMPORTE</Text>
            </View>
            {d.lineas.map((l) => (
              <View key={l.id} style={s.fila} wrap={false}>
                <View style={s.colServicio}>
                  <Text style={s.servicioNombre}>{l.nombre}</Text>
                  <Text style={s.servicioDescripcion}>{l.descripcion}</Text>
                  {l.justificacion && (
                    <Text style={s.servicioJustificacion}>
                      {l.justificacion}
                    </Text>
                  )}
                </View>
                <Text style={[s.colCantidad, s.numero]}>{l.cantidad}</Text>
                <Text style={[s.colPrecio, s.numero]}>
                  {euros(l.precioUnitario, d.moneda)}
                  {l.regla === "unidad" ? `/${l.unidad}` : ""}
                </Text>
                <Text
                  style={[
                    s.colImporte,
                    s.numero,
                    { fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  {euros(l.importe, d.moneda)}
                </Text>
              </View>
            ))}

            {/* El total y su nota siempre van juntos */}
            <View wrap={false}>
              <View style={s.totalCaja}>
                <Degradado width={230} height={52} radio={8} />
                <View style={s.totalContenido}>
                  <Text style={s.totalEtiqueta}>TOTAL</Text>
                  <Text style={s.totalImporte}>{euros(d.total, d.moneda)}</Text>
                </View>
              </View>
              <Text style={s.notaImpuestos}>
                Importes en {d.moneda}, impuestos no incluidos. Calculados por
                el servidor con las tarifas vigentes.
              </Text>
            </View>
          </View>

          <View style={s.seccion}>
            <TituloSeccion>Aclaraciones</TituloSeccion>
            {d.respuestas.map((r, i) => (
              <Tarjeta key={`r${i}`}>
                {r.pregunta}{" "}
                <Text style={s.respuesta}>Respuesta: {r.respuesta}</Text>
              </Tarjeta>
            ))}
            {d.aclaraciones.map((texto, i) => (
              <Tarjeta key={`a${i}`}>{texto}</Tarjeta>
            ))}
            {d.respuestas.length + d.aclaraciones.length === 0 && (
              <Tarjeta>
                <Text style={s.vacio}>
                  No hay aspectos pendientes de aclarar.
                </Text>
              </Tarjeta>
            )}
          </View>

          <View style={s.seccion}>
            <TituloSeccion>
              Pendiente de valorar (no incluido en el total)
            </TituloSeccion>
            {d.pendientes.map((p, i) => (
              <Tarjeta key={i} aviso>
                <Text style={s.necesidad}>{p.necesidad}</Text>
                {p.motivo ? `: ${p.motivo}` : ""}
              </Tarjeta>
            ))}
            {d.pendientes.length === 0 && (
              <Tarjeta aviso>
                <Text style={s.vacio}>
                  Todas las necesidades descritas están cubiertas por el
                  catálogo.
                </Text>
              </Tarjeta>
            )}
          </View>
        </View>

        {/* Pie de todas las páginas */}
        <View fixed style={s.pieLinea} />
        <Text fixed style={[s.margen, s.pieIzquierda]}>
          Presupuesto orientativo · Los plazos y condiciones se acordarán con la
          agencia
        </Text>
        <Text
          fixed
          style={[s.margen, s.pieDerecha]}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}
