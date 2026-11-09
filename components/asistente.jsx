"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useTheme } from "next-themes"
import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Check,
  CircleHelp,
  Download,
  ExternalLink,
  Eye,
  FilePlus2,
  Minus,
  PackageOpen,
  Pencil,
  Plus,
  StickyNote,
  TriangleAlert,
  X,
} from "lucide-react"

import { HugeiconsBadgeAlertIcon } from "@/components/icons/hugeicons-badge-alert"
import { HugeiconsBriefcaseBusinessIcon } from "@/components/icons/hugeicons-briefcase-business"
import { HugeiconsLanguagesIcon } from "@/components/icons/hugeicons-languages"
import { HugeiconsMailIcon } from "@/components/icons/hugeicons-mail"
import { HugeiconsReceiptEuroIcon } from "@/components/icons/hugeicons-receipt-euro"
import { HugeiconsRefreshCwIcon } from "@/components/icons/hugeicons-refresh-cw"
import { HugeiconsRocketIcon } from "@/components/icons/hugeicons-rocket"
import { HugeiconsServerCrashIcon } from "@/components/icons/hugeicons-server-crash"
import {
  BotonDegradado,
  BotonSuave,
  CAMPO,
  CAMPO_ERROR,
  DEGRADADO_MARCA,
  DEGRADADO_TOTAL,
  SimboloVera,
  formatoEuros,
  IconoAnimado,
  Panel,
  PIEZA,
  SUPERFICIE,
  Titulo,
  useHover,
} from "@/components/marca"
import AnimatedGradient from "@/components/spell/animated-gradient"
import { SpecialText } from "@/components/spell/special-text"
import { Spinner } from "@/components/spell/spinner"
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura"
import { AgentChatTranscript } from "@/components/agents-ui/agent-chat-transcript"
import {
  calcularSeleccion,
  conversarConAgente,
  generarPdf,
  obtenerCatalogo,
  pedirPropuesta,
} from "@/lib/api"
import { cn } from "@/lib/utils"

/* ─── Datos ──────────────────────────────────────────────────────────────── */

// Mismos límites que valida el servidor (server/src/propuesta.js)
const CLIENTE_MAX = 120
const DESCRIPCION_MAX = 2000
const RESPUESTA_MAX = 300
const RESPUESTAS_MAX = 10
const NOMBRE_AGENTE = "V.E.R.A."

// Solicitudes de prueba con datos ficticios
const EJEMPLOS = [
  {
    etiqueta: "Clara",
    cliente: "Restaurante La Brasa Ficticia",
    descripcion:
      "Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.",
  },
  {
    etiqueta: "Ambigua",
    cliente: "Estudio Ficticio Norte",
    descripcion:
      "Quiero algo para que me conozca más gente en internet, con alguna sección más aparte de la principal. Aún no sé bien qué necesito.",
  },
  {
    etiqueta: "Fuera de catálogo",
    cliente: "Moda Inventada SL",
    descripcion:
      "Web corporativa para mi marca de ropa con tienda online, pasarela de pago y área de clientes. También quiero que os encarguéis del SEO.",
  },
]

const ICONOS = {
  landing: HugeiconsRocketIcon,
  corporativa: HugeiconsBriefcaseBusinessIcon,
  formulario: HugeiconsMailIcon,
  segundoIdioma: HugeiconsLanguagesIcon,
}

const SOLICITUD_INICIAL = { cliente: "", descripcion: "" }

/**
 * Convierte la propuesta del servidor en el estado editable de la revisión.
 * `previo` conserva lo que el usuario ya había respondido y sus notas.
 */
function aBorrador(p, catalogo, solicitud, previo) {
  const sugerencias = Object.fromEntries(p.servicios.map((s) => [s.id, s]))
  const extras = Object.fromEntries(
    Object.values(catalogo)
      .filter((s) => s.grupo !== "base")
      .map((s) => {
        const sugerido = sugerencias[s.id]
        return [
          s.id,
          {
            activo: Boolean(sugerido),
            cantidad:
              sugerido?.cantidad != null ? String(sugerido.cantidad) : "",
          },
        ]
      })
  )
  return {
    cliente: p.cliente,
    descripcion: solicitud.descripcion,
    resumen: p.resumen,
    tipo: p.servicios.find((s) => catalogo[s.id]?.grupo === "base")?.id ?? null,
    tipoAlternativo: p.tipoAlternativo ?? null,
    sugerencias,
    extras,
    // Dudas de la IA que siguen abiertas (irán al PDF como aclaraciones)
    preguntas: p.aclaraciones,
    notas: previo?.notas ?? [],
    pendientes: p.pendientes,
    // Conversación con V.E.R.A.: se conserva al rehacer la propuesta
    chat: previo?.chat ?? CHAT_INICIAL,
  }
}

const CHAT_INICIAL = { mensajes: [], estado: "inactivo", error: null }

// Pares pregunta (redactada de forma neutra por el agente) → respuesta del cliente
function respuestasDe(b) {
  const pares = []
  const m = b.chat.mensajes
  for (let i = 0; i < m.length - 1; i++) {
    if (m[i].rol === "agente" && m[i].pregunta && m[i + 1].rol === "cliente")
      pares.push({ pregunta: m[i].pregunta, respuesta: m[i + 1].texto })
  }
  return pares
}

// Resumen de lo ya decidido, para que V.E.R.A. no lo vuelva a preguntar
function resumenParaAgente(b, catalogo) {
  const partes = [
    `Tipo de web: ${b.tipo ? catalogo[b.tipo].nombre : "sin decidir"}.`,
  ]
  const extras = Object.entries(b.extras)
    .filter(([, e]) => e.activo)
    .map(([id, e]) =>
      catalogo[id].regla === "unidad"
        ? `${catalogo[id].nombre} (${e.cantidad || "cantidad sin decidir"})`
        : catalogo[id].nombre
    )
  partes.push(`Extras: ${extras.length ? extras.join(", ") : "ninguno"}.`)
  if (b.pendientes.length)
    partes.push(
      `Fuera del catálogo: ${b.pendientes.map((p) => p.necesidad).join(", ")}.`
    )
  return partes.join(" ").slice(0, 800)
}

// Datos sin los que no se puede calcular: V.E.R.A. no se despide sin ellos
function obligatoriosDe(b, catalogo) {
  const lista = []
  if (!b.tipo)
    lista.push(
      "Tipo de web: una sola página (landing) o varias secciones con menú (corporativa)"
    )
  for (const [id, e] of Object.entries(b.extras)) {
    if (e.activo && catalogo[id]?.regla === "unidad" && e.cantidad === "")
      lista.push(
        `Número exacto de ${catalogo[id].unidad}s adicionales además de la principal`
      )
  }
  return lista
}

// Lo que V.E.R.A. tiene que aclarar: las dudas de la IA y los datos que faltan
function dudasDe(b, catalogo) {
  const dudas = [...b.preguntas]
  if (!b.tipo)
    dudas.unshift(
      "Falta decidir el tipo de web: una sola página (landing) o varias secciones con menú (corporativa)"
    )
  for (const [id, e] of Object.entries(b.extras)) {
    if (e.activo && catalogo[id]?.regla === "unidad" && e.cantidad === "")
      dudas.push(
        `Falta saber cuántas ${catalogo[id].unidad}s adicionales necesita además de la principal`
      )
  }
  return dudas.slice(0, 10)
}

// Cuerpo que se envía para calcular y para el PDF (sin precios: los pone el servidor)
function aCuerpo(b) {
  const servicios = []
  if (b.tipo)
    servicios.push({
      id: b.tipo,
      justificacion: b.sugerencias[b.tipo]?.justificacion ?? "",
    })
  for (const [id, e] of Object.entries(b.extras)) {
    if (!e.activo) continue
    servicios.push({
      id,
      justificacion: b.sugerencias[id]?.justificacion ?? "",
      ...(e.cantidad !== "" && { cantidad: Number(e.cantidad) }),
    })
  }
  return {
    cliente: b.cliente,
    resumen: b.resumen,
    servicios,
    // Preguntas sin responder + notas del usuario → «Aclaraciones» del PDF
    aclaraciones: [...b.preguntas, ...b.notas],
    respuestas: respuestasDe(b).slice(-15),
    pendientes: b.pendientes,
  }
}

// Datos que faltan antes de poder calcular (el servidor lo vuelve a comprobar)
function datosQueFaltan(b, catalogo) {
  const faltan = []
  if (!b.tipo) faltan.push({ ancla: "tipo-web", texto: "Elige el tipo de web" })
  for (const [id, e] of Object.entries(b.extras)) {
    const info = catalogo[id]
    if (!e.activo || info.regla !== "unidad") continue
    const n = Number(e.cantidad)
    if (
      e.cantidad === "" ||
      !Number.isInteger(n) ||
      n < info.cantidadMin ||
      n > info.cantidadMax
    )
      faltan.push({
        ancla: `extra-${id}`,
        texto: `Indica cuántas ${info.unidad}s adicionales`,
      })
  }
  if (!b.resumen.trim())
    faltan.push({ ancla: "resumen", texto: "Escribe el resumen del proyecto" })
  return faltan
}

const precioTexto = (s) =>
  s.regla === "unidad"
    ? `${formatoEuros(s.precio)} / ${s.unidad}`
    : formatoEuros(s.precio)

const irA = (ancla) =>
  document
    .getElementById(ancla)
    ?.scrollIntoView({ behavior: "smooth", block: "center" })

/* ─── Componente principal ───────────────────────────────────────────────── */

export function Asistente() {
  const [catalogo, setCatalogo] = React.useState(null) // { [id]: servicio }
  const [solicitud, setSolicitud] = React.useState(SOLICITUD_INICIAL)
  const [envio, setEnvio] = React.useState({ cargando: false, error: null })
  const [borrador, setBorrador] = React.useState(null) // null = aún sin propuesta
  const [vista, setVista] = React.useState(null) // { cargando, url, nombre, error }
  const [chatAbierto, setChatAbierto] = React.useState(false)
  // Memorizado: el agente lo usa como dependencia de sus callbacks
  const dudas = React.useMemo(
    () => (borrador && catalogo ? dudasDe(borrador, catalogo) : []),
    [borrador, catalogo]
  )

  const cargarCatalogo = React.useCallback(() => {
    obtenerCatalogo()
      .then((c) =>
        setCatalogo(Object.fromEntries(c.servicios.map((s) => [s.id, s])))
      )
      .catch(() => setCatalogo(false))
  }, [])
  React.useEffect(cargarCatalogo, [cargarCatalogo])

  // Libera la URL del PDF al cerrar la vista previa
  React.useEffect(
    () => () => vista?.url && URL.revokeObjectURL(vista.url),
    [vista?.url]
  )

  async function enviarSolicitud(evento) {
    evento?.preventDefault()
    if (!catalogo) {
      setEnvio({
        cargando: false,
        error: {
          estado: 0,
          error: "No se pudo cargar el catálogo",
          reintentable: true,
        },
      })
      cargarCatalogo()
      return
    }
    setEnvio({ cargando: true, error: null })
    const { estado, datos } = await pedirPropuesta(solicitud)
    if (estado === 200) {
      const nuevo = aBorrador(datos, catalogo, solicitud)
      setBorrador(nuevo)
      // Si hay dudas, V.E.R.A. abre el chat ella sola
      if (dudasDe(nuevo, catalogo).length > 0) setChatAbierto(true)
      setEnvio({ cargando: false, error: null })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setEnvio({ cargando: false, error: { estado, ...datos } })
    }
  }

  async function abrirVistaPrevia() {
    setVista({ cargando: true })
    const r = await generarPdf(aCuerpo(borrador))
    if (r.estado === 200)
      setVista({ url: URL.createObjectURL(r.blob), nombre: r.nombre })
    else
      setVista({
        error:
          r.datos?.detalles?.join(" · ") ||
          r.datos?.error ||
          "No se pudo generar el PDF",
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <Pasos actual={borrador ? 2 : 1} />
      {!borrador ? (
        <FormularioSolicitud
          solicitud={solicitud}
          setSolicitud={setSolicitud}
          envio={envio}
          onEnviar={enviarSolicitud}
        />
      ) : (
        <Revision
          borrador={borrador}
          setBorrador={setBorrador}
          catalogo={catalogo}
          dudas={dudas}
          onAbrirChat={() => setChatAbierto(true)}
          onVistaPrevia={abrirVistaPrevia}
          onVolver={() => setBorrador(null)}
        />
      )}
      {vista && <VistaPrevia vista={vista} onCerrar={() => setVista(null)} />}

      {/* V.E.R.A. siempre está en la esquina inferior derecha */}
      <ChatAgente
        borrador={borrador}
        setBorrador={setBorrador}
        catalogo={catalogo}
        dudas={dudas}
        abierto={chatAbierto}
        setAbierto={setChatAbierto}
      />
    </div>
  )
}

function Pasos({ actual }) {
  const pasos = [
    "Describe tu proyecto",
    "Revisa la propuesta",
    "Descarga el PDF",
  ]
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {pasos.map((texto, i) => {
        const n = i + 1
        const hecho = n < actual
        const activo = n === actual
        return (
          <li key={texto} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  n <= actual ? "bg-primary/60" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                activo &&
                  cn(
                    DEGRADADO_MARCA,
                    "text-white shadow-md shadow-fuchsia-500/25"
                  ),
                hecho && "bg-primary/15 text-primary",
                !activo && !hecho && "border text-muted-foreground"
              )}
            >
              {hecho ? <Check className="size-3.5" /> : n}
            </span>
            <span
              className={cn(
                activo
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {texto}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ─── Paso 1: solicitud del cliente ──────────────────────────────────────── */

function FormularioSolicitud({ solicitud, setSolicitud, envio, onEnviar }) {
  const { cargando, error } = envio
  const campos = error?.estado === 400 ? (error.campos ?? []) : []
  const largo = solicitud.descripcion.length

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form
        onSubmit={onEnviar}
        noValidate
        className={cn(SUPERFICIE, "flex flex-col gap-7 p-5 sm:p-8")}
      >
        <fieldset className="flex flex-col gap-2">
          <Titulo
            numero="1"
            texto="Cliente o empresa"
            error={campos.includes("cliente")}
          />
          <input
            value={solicitud.cliente}
            onChange={(e) =>
              setSolicitud((s) => ({ ...s, cliente: e.target.value }))
            }
            maxLength={CLIENTE_MAX + 20}
            placeholder="Ej.: Restaurante La Brasa Ficticia"
            aria-label="Nombre del cliente o empresa"
            className={cn(CAMPO, campos.includes("cliente") && CAMPO_ERROR)}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <Titulo
            numero="2"
            texto="¿Qué necesitas?"
            error={campos.includes("descripcion")}
          />
          <textarea
            value={solicitud.descripcion}
            onChange={(e) =>
              setSolicitud((s) => ({ ...s, descripcion: e.target.value }))
            }
            rows={7}
            placeholder="Cuéntanos tu proyecto: a qué se dedica tu negocio, qué secciones quieres, si necesitas formularios, idiomas…"
            aria-label="Descripción del proyecto"
            className={cn(
              CAMPO,
              "resize-y leading-relaxed",
              campos.includes("descripcion") && CAMPO_ERROR
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex flex-wrap items-center gap-1.5">
              Probar con:
              {EJEMPLOS.map((e) => (
                <button
                  key={e.etiqueta}
                  type="button"
                  onClick={() =>
                    setSolicitud({
                      cliente: e.cliente,
                      descripcion: e.descripcion,
                    })
                  }
                  className="rounded-full border bg-card/80 px-2.5 py-1 font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {e.etiqueta}
                </button>
              ))}
            </span>
            <span
              className={cn(
                "tabular-nums",
                largo > DESCRIPCION_MAX && "font-semibold text-destructive"
              )}
            >
              {largo} / {DESCRIPCION_MAX}
            </span>
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            La IA propone servicios del catálogo. Los precios los calcula el
            servidor.
          </p>
          <BotonDegradado type="submit" disabled={cargando}>
            {cargando ? (
              <Spinner size="default" />
            ) : (
              <SimboloVera className="size-4 [&_path]:fill-white" />
            )}
            {cargando ? "Analizando…" : "Generar propuesta"}
          </BotonDegradado>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6">
        {error ? (
          <ErrorPropuesta
            error={error}
            onReintentar={onEnviar}
            cargando={cargando}
          />
        ) : (
          <Panel>
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <span
                className={cn(
                  "mb-1 flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-fuchsia-500/25",
                  DEGRADADO_MARCA
                )}
              >
                {cargando ? (
                  <Spinner size="lg" className="text-white" />
                ) : (
                  <SimboloVera className="size-6 [&_path]:fill-white" />
                )}
              </span>
              <p className="font-heading font-semibold text-foreground">
                {cargando ? "Preparando la propuesta…" : "Así funciona"}
              </p>
              <ol className="flex flex-col gap-2 text-left text-sm">
                <li>1. Describe tu proyecto con tus palabras.</li>
                <li>
                  2. La IA preselecciona servicios y te pregunta lo que no tenga
                  claro.
                </li>
                <li>3. Ajusta lo que quieras y descarga el presupuesto.</li>
              </ol>
            </div>
          </Panel>
        )}
      </aside>
    </div>
  )
}

function ErrorPropuesta({ error, onReintentar, cargando }) {
  const [hover, propsHover] = useHover()
  const validacion = error.estado === 400
  return (
    <Panel className="border-destructive/25">
      <div className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <IconoAnimado
            icono={
              validacion ? HugeiconsBadgeAlertIcon : HugeiconsServerCrashIcon
            }
            activo
            size={24}
          />
        </span>
        <div>
          <p className="font-heading font-semibold">
            {validacion ? "Revisa la solicitud" : error.error}
          </p>
          <p className="text-sm text-muted-foreground">
            {validacion
              ? "El servidor no ha enviado nada a la IA."
              : error.reintentable === false
                ? "Avisa al administrador de la web."
                : "Puede ser un fallo puntual. Tu texto se ha conservado."}
          </p>
        </div>
        {validacion && (
          <ul className="flex flex-col gap-2">
            {(error.detalles ?? []).map((d) => (
              <li
                key={d}
                className="rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive"
              >
                {d}
              </li>
            ))}
          </ul>
        )}
        {!validacion && error.reintentable !== false && (
          <BotonSuave
            onClick={() => onReintentar()}
            disabled={cargando}
            className="self-start"
            {...propsHover}
          >
            {cargando ? (
              <Spinner size="sm" />
            ) : (
              <IconoAnimado
                icono={HugeiconsRefreshCwIcon}
                activo={hover}
                size={16}
              />
            )}
            Reintentar
          </BotonSuave>
        )}
      </div>
    </Panel>
  )
}

/* ─── Paso 2: revisión de la propuesta ───────────────────────────────────── */

function Revision({
  borrador,
  setBorrador,
  catalogo,
  dudas,
  onAbrirChat,
  onVistaPrevia,
  onVolver,
}) {
  const calculo = useCalculoAutomatico(borrador, catalogo)

  const faltan = datosQueFaltan(borrador, catalogo)
  const anclasConFalta = new Set(faltan.map((f) => f.ancla))
  const bases = Object.values(catalogo).filter((s) => s.grupo === "base")
  const extras = Object.values(catalogo).filter((s) => s.grupo !== "base")
  const numSugeridos = Object.keys(borrador.sugerencias).length

  const editar = (cambio) => setBorrador((b) => ({ ...b, ...cambio(b) }))
  const cambiarExtra = (id, cambio) =>
    editar((b) => ({
      extras: { ...b.extras, [id]: { ...b.extras[id], ...cambio } },
    }))

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        {/* Cabecera: qué ha hecho la IA */}
        <div className={cn(SUPERFICIE, "flex flex-col gap-4 p-5 sm:p-6")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BotonSuave onClick={onVolver}>
              <ArrowLeft /> Cambiar la descripción
            </BotonSuave>
            <p className="text-sm text-muted-foreground">
              Propuesta para{" "}
              <span className="font-semibold text-foreground">
                {borrador.cliente}
              </span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-md shadow-fuchsia-500/25",
                DEGRADADO_MARCA
              )}
            >
              <SimboloVera className="size-4 [&_path]:fill-white" />
            </span>
            <div className="flex flex-col gap-2">
              <p className="font-heading font-semibold">
                La IA ha preparado una propuesta
              </p>
              <p className="text-sm text-muted-foreground">
                Lo marcado con <EtiquetaIA /> es lo que ha preseleccionado.
                Puedes cambiar cualquier cosa: el total se recalcula al momento.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {numSugeridos > 0 && (
                  <Chip>
                    {numSugeridos}{" "}
                    {numSugeridos === 1
                      ? "servicio sugerido"
                      : "servicios sugeridos"}
                  </Chip>
                )}
                {dudas.length > 0 && (
                  <Chip aviso onClick={onAbrirChat}>
                    {dudas.length} {dudas.length === 1 ? "duda" : "dudas"} por
                    aclarar con {NOMBRE_AGENTE}
                  </Chip>
                )}
                {borrador.pendientes.length > 0 && (
                  <Chip onClick={() => irA("fuera-catalogo")}>
                    {borrador.pendientes.length} fuera del catálogo
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(SUPERFICIE, "flex flex-col gap-9 p-5 sm:p-8")}>
          {/* Tipo de web: elección exclusiva */}
          <section id="tipo-web" className="flex scroll-mt-6 flex-col gap-3">
            <Encabezado
              numero="1"
              titulo="Tipo de web"
              subtitulo="Elige una opción: es la base del presupuesto"
            />
            {!borrador.tipo && (
              <Aviso>
                La IA no ha podido decidirlo con tu descripción. Elige el que
                encaje mejor.
              </Aviso>
            )}
            {borrador.tipoAlternativo && borrador.tipo && (
              <Aviso suave>
                La IA duda entre las dos opciones: ha preseleccionado{" "}
                <strong>{catalogo[borrador.tipo].nombre}</strong>, pero{" "}
                <strong>{catalogo[borrador.tipoAlternativo].nombre}</strong>{" "}
                también podría encajar.
              </Aviso>
            )}
            <div
              role="radiogroup"
              aria-label="Tipo de web"
              className="grid gap-3 sm:grid-cols-2"
            >
              {bases.map((s) => (
                <OpcionTipo
                  key={s.id}
                  servicio={s}
                  elegido={borrador.tipo === s.id}
                  sugerencia={borrador.sugerencias[s.id]}
                  onElegir={() => editar(() => ({ tipo: s.id }))}
                />
              ))}
            </div>
          </section>

          {/* Extras: interruptores */}
          <section className="flex flex-col gap-3">
            <Encabezado
              numero="2"
              titulo="Extras"
              subtitulo="Activa o desactiva lo que necesites"
            />
            <div className="flex flex-col gap-3">
              {extras.map((s) => (
                <FilaExtra
                  key={s.id}
                  servicio={s}
                  estado={borrador.extras[s.id]}
                  sugerencia={borrador.sugerencias[s.id]}
                  falta={anclasConFalta.has(`extra-${s.id}`)}
                  onCambiar={(cambio) => cambiarExtra(s.id, cambio)}
                />
              ))}
            </div>
          </section>

          <Resumen
            texto={borrador.resumen}
            error={anclasConFalta.has("resumen")}
            onCambiar={(resumen) => editar(() => ({ resumen }))}
          />

          <ListaEditable
            id="fuera-catalogo"
            numero="4"
            titulo="Fuera del catálogo"
            subtitulo="La agencia lo valorará aparte: no suma en el total"
            icono={PackageOpen}
            vacio="Todo lo que has pedido está cubierto por el catálogo."
            elementos={borrador.pendientes}
            texto={(p) => (
              <>
                <span className="font-medium">{p.necesidad}</span>
                {p.motivo && (
                  <span className="block text-xs text-muted-foreground">
                    {p.motivo}
                  </span>
                )}
              </>
            )}
            onQuitar={(i) =>
              editar((b) => ({
                pendientes: b.pendientes.filter((_, j) => j !== i),
              }))
            }
            onAnadir={(t) =>
              editar((b) => ({
                pendientes: [...b.pendientes, { necesidad: t, motivo: "" }],
              }))
            }
            placeholder="Añadir otra necesidad a valorar…"
          />

          <ListaEditable
            numero="5"
            titulo="Notas para el presupuesto"
            subtitulo="Opcional: aparecerán en el PDF como aclaraciones"
            icono={StickyNote}
            vacio=""
            elementos={borrador.notas}
            texto={(n) => n}
            onQuitar={(i) =>
              editar((b) => ({ notas: b.notas.filter((_, j) => j !== i) }))
            }
            onAnadir={(t) => editar((b) => ({ notas: [...b.notas, t] }))}
            placeholder="Ej.: el cliente aportará las fotos de la carta"
          />
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <PanelPresupuesto
          faltan={faltan}
          calculo={calculo}
          onVistaPrevia={onVistaPrevia}
        />
      </aside>
    </div>
  )
}

// Recalcula en el servidor cada vez que cambia la selección (con una pequeña
// espera para no lanzar una petición por cada pulsación)
function useCalculoAutomatico(borrador, catalogo) {
  const [calculo, setCalculo] = React.useState({ estado: "idle" })
  const listo = datosQueFaltan(borrador, catalogo).length === 0
  const clave = JSON.stringify(aCuerpo(borrador))

  React.useEffect(() => {
    if (!listo) return
    let vigente = true
    const espera = setTimeout(async () => {
      setCalculo((c) => ({ ...c, estado: "cargando" }))
      const r = await calcularSeleccion(JSON.parse(clave))
      if (!vigente) return
      setCalculo(
        r.estado === 200
          ? { estado: "ok", datos: r.datos, clave }
          : { estado: "error", datos: r.datos, clave }
      )
    }, 350)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [clave, listo])

  return { ...calculo, vigente: listo && calculo.clave === clave }
}

/* ─── Piezas de la revisión ──────────────────────────────────────────────── */

function EtiquetaIA({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[0.7rem] font-semibold whitespace-nowrap text-primary",
        className
      )}
    >
      <SimboloVera className="size-2.5" /> Sugerido por la IA
    </span>
  )
}

function Chip({ children, aviso, onClick }) {
  const Etiqueta = onClick ? "button" : "span"
  return (
    <Etiqueta
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 font-medium",
        aviso
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "bg-card/80",
        onClick && "transition-colors hover:border-primary/40"
      )}
    >
      {children}
    </Etiqueta>
  )
}

function Aviso({ children, suave }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
        suave
          ? "bg-primary/[0.06] text-foreground/90"
          : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
      )}
    >
      {suave ? (
        <CircleHelp className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  )
}

function Encabezado({ numero, titulo, subtitulo, error }) {
  return (
    <div>
      <Titulo as="h2" numero={numero} texto={titulo} error={error} />
      {subtitulo && (
        <p className="-mt-2 ml-10 text-sm text-muted-foreground">{subtitulo}</p>
      )}
    </div>
  )
}

function PorQue({ children }) {
  return (
    <p className="rounded-xl bg-primary/[0.06] px-3 py-2 text-sm text-foreground/90">
      <span className="mr-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <SimboloVera className="size-2.5" /> Por qué
      </span>
      {children}
    </p>
  )
}

function OpcionTipo({ servicio, elegido, sugerencia, onElegir }) {
  const [hover, propsHover] = useHover()
  return (
    <label
      {...propsHover}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-card/80 p-4 transition-all hover:border-primary/40 has-focus-visible:ring-3 has-focus-visible:ring-ring/40 dark:bg-card/50",
        elegido && "borde-degradado shadow-lg shadow-fuchsia-500/15"
      )}
    >
      <input
        type="radio"
        name="tipo-web"
        checked={elegido}
        onChange={onElegir}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl transition-all",
            elegido
              ? cn(
                  DEGRADADO_MARCA,
                  "text-white shadow-md shadow-fuchsia-500/30"
                )
              : "bg-primary/10 text-primary"
          )}
        >
          <IconoAnimado icono={ICONOS[servicio.id]} activo={hover} size={20} />
        </span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
            elegido ? "border-primary bg-primary" : "border-muted-foreground/40"
          )}
          aria-hidden="true"
        >
          {elegido && <span className="size-2 rounded-full bg-white" />}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-heading font-semibold">{servicio.nombre}</span>
          <span className="text-sm font-semibold text-primary tabular-nums">
            {formatoEuros(servicio.precio)}
          </span>
        </div>
        <p className="text-sm leading-snug text-muted-foreground">
          {servicio.descripcion}
        </p>
      </div>
      {sugerencia && (
        <div className="flex flex-col gap-2">
          <EtiquetaIA className="self-start" />
          <p className="text-sm text-foreground/85">
            {sugerencia.justificacion}
          </p>
        </div>
      )}
    </label>
  )
}

function FilaExtra({ servicio, estado, sugerencia, falta, onCambiar }) {
  const [hover, propsHover] = useHover()
  const porUnidad = servicio.regla === "unidad"
  const n = Number(estado.cantidad)

  function activar(activo) {
    // Al activar a mano las páginas, se empieza en 1 (la IA puede dejarlo vacío)
    if (activo && porUnidad && estado.cantidad === "" && !sugerencia)
      onCambiar({ activo, cantidad: "1" })
    else onCambiar({ activo })
  }
  function sumar(delta) {
    const actual = Number.isInteger(n) && estado.cantidad !== "" ? n : 0
    const nuevo = Math.min(
      servicio.cantidadMax,
      Math.max(servicio.cantidadMin, actual + delta)
    )
    onCambiar({ cantidad: String(nuevo) })
  }

  return (
    <div
      id={`extra-${servicio.id}`}
      {...propsHover}
      className={cn(
        PIEZA,
        "flex scroll-mt-6 flex-col gap-3 p-4 transition-all",
        estado.activo &&
          "border-primary/40 bg-primary/[0.04] dark:bg-primary/[0.06]",
        falta && "border-amber-500/50"
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={estado.activo}
          onChange={(e) => activar(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
            estado.activo
              ? cn(DEGRADADO_MARCA, "text-white")
              : "bg-primary/10 text-primary"
          )}
        >
          {ICONOS[servicio.id] ? (
            <IconoAnimado
              icono={ICONOS[servicio.id]}
              activo={hover}
              size={20}
            />
          ) : (
            <FilePlus2 className="size-5" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{servicio.nombre}</span>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {precioTexto(servicio)}
            </span>
            {sugerencia && <EtiquetaIA />}
          </span>
          <span className="text-sm leading-snug text-muted-foreground">
            {servicio.descripcion}
          </span>
        </span>
        <span
          className={cn(
            "relative mt-2 h-6 w-11 shrink-0 rounded-full ring-1 transition-colors ring-inset peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40",
            estado.activo
              ? "bg-linear-to-r from-violet-600 to-fuchsia-600 ring-0"
              : "bg-muted ring-border"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform",
              estado.activo && "translate-x-5"
            )}
          />
        </span>
      </label>

      {sugerencia && estado.activo && (
        <div className="sm:ml-13">
          <PorQue>{sugerencia.justificacion}</PorQue>
        </div>
      )}
      {sugerencia && !estado.activo && (
        <p className="text-xs text-muted-foreground sm:ml-13">
          Lo habías descartado. Actívalo de nuevo si lo necesitas.
        </p>
      )}

      {porUnidad && estado.activo && (
        <div className="flex flex-col gap-2 sm:ml-13">
          {falta && (
            <Aviso>
              La IA no ha podido deducir cuántas {servicio.unidad}s necesitas.
              Indícalo para calcular el presupuesto.
            </Aviso>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border bg-background/60 p-1">
              <BotonCantidad
                aria-label="Una página menos"
                onClick={() => sumar(-1)}
                disabled={estado.cantidad !== "" && n <= servicio.cantidadMin}
              >
                <Minus />
              </BotonCantidad>
              <input
                type="number"
                inputMode="numeric"
                min={servicio.cantidadMin}
                max={servicio.cantidadMax}
                value={estado.cantidad}
                onChange={(e) => onCambiar({ cantidad: e.target.value })}
                placeholder="?"
                aria-label={`Número de ${servicio.unidad}s adicionales`}
                className={cn(
                  "h-8 w-12 [appearance:textfield] rounded-full bg-transparent text-center font-heading text-lg font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none",
                  falta && "text-amber-600 placeholder:text-amber-600"
                )}
              />
              <BotonCantidad
                aria-label="Una página más"
                onClick={() => sumar(1)}
                disabled={n >= servicio.cantidadMax}
              >
                <Plus />
              </BotonCantidad>
            </div>
            <span className="text-sm text-muted-foreground">
              {servicio.unidad}s además de la principal
              {estado.cantidad !== "" && Number.isInteger(n) && n > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {n + 1} en total
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function BotonCantidad({ children, ...props }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4"
      {...props}
    >
      {children}
    </button>
  )
}

const sinSuscripcion = () => () => {}

// Crea un mensaje del chat (fuera del componente: usa la hora actual)
const crearMensaje = (rol, texto, extra = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  rol,
  texto,
  hora: Date.now(),
  ...extra,
})

const ESTADOS_CHAT = {
  pensando: "Pensando…",
  esperando: "Esperando tu respuesta",
  actualizando: "Actualizando la propuesta…",
  terminado: "Disponible",
  error: "Algo ha fallado",
  inactivo: "Disponible",
}

// Último mensaje cuando la propuesta ya se ha rehecho (no gasta otra llamada a la IA)
const CIERRE_LOCAL =
  "Propuesta actualizada con tus respuestas. Revísala en la página: puedes cambiar lo que quieras, aunque estadísticamente lo dejarás igual."

// Mensajes de bienvenida (locales: no se envían a la IA)
const BIENVENIDA_SIN_PROPUESTA = {
  id: "bienvenida-formulario",
  rol: "agente",
  hora: 0,
  texto:
    "Soy V.E.R.A., Validadora Experimental de Requisitos y Alcance. Describe tu proyecto en el formulario y, si algo no me cuadra, te lo preguntaré aquí. Procuraré contener mi entusiasmo.",
}
const BIENVENIDA_SIN_DUDAS = {
  id: "bienvenida-sin-dudas",
  rol: "agente",
  hora: 0,
  texto:
    "He revisado tu propuesta y no tengo dudas. Inquietante, pero agradable. Si quieres añadir o matizar algo, escríbemelo.",
}

// Cuando el usuario escribe sin que V.E.R.A. haya preguntado nada
const DUDA_LIBRE =
  "El cliente quiere añadir o matizar algo de su proyecto: entiende qué es y pregunta solo lo necesario"

// Colores de la marca para Aura: violeta que se desplaza hacia el fucsia
const COLOR_AURA = "#a855f7"
const DESPLAZAMIENTO_AURA = 0.35

// Aura de V.E.R.A. (Agents UI) con los colores de la web
function AuraVera({ estado, volumen, tema, className }) {
  return (
    <AgentAudioVisualizerAura
      size="sm"
      state={estado}
      volume={volumen}
      color={COLOR_AURA}
      colorShift={DESPLAZAMIENTO_AURA}
      themeMode={tema}
      className={cn("aspect-square", className)}
    />
  )
}

function ChatAgente({
  borrador,
  setBorrador,
  catalogo,
  dudas,
  abierto,
  setAbierto,
}) {
  const chat = borrador?.chat ?? CHAT_INICIAL
  const [texto, setTexto] = React.useState("")
  const { resolvedTheme } = useTheme()
  const montado = React.useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false
  )
  const tema = resolvedTheme === "light" ? "light" : "dark"
  const pensando = chat.estado === "pensando" || chat.estado === "actualizando"
  const hablo = chat.mensajes.some((m) => m.rol === "cliente")
  const cliente = borrador?.cliente
  // Texto (no objeto): solo cambia cuando cambia la selección
  const propuestaActual =
    borrador && catalogo ? resumenParaAgente(borrador, catalogo) : ""
  const obligatorios =
    borrador && catalogo ? obligatoriosDe(borrador, catalogo) : []
  const descripcion = borrador?.descripcion

  const setChat = React.useCallback(
    (cambio) =>
      setBorrador((b) => (b ? { ...b, chat: { ...b.chat, ...cambio } } : b)),
    [setBorrador]
  )

  // Rehace la propuesta con todo lo hablado. Si después siguen faltando datos
  // imprescindibles (tipo de web, nº exacto de páginas), V.E.R.A. no se despide:
  // vuelve a preguntar, porque sin ellos no se puede calcular el presupuesto.
  async function actualizar(mensajes) {
    setChat({ mensajes, estado: "actualizando", error: null })
    const respuestas = respuestasDe({ chat: { mensajes } }).slice(
      -RESPUESTAS_MAX
    )
    const { estado, datos } = await pedirPropuesta({
      cliente,
      descripcion,
      respuestas,
    })
    if (estado !== 200) {
      setChat({
        estado: "error",
        error: {
          texto: datos?.error ?? "No se pudo actualizar la propuesta",
          reintentar: "actualizar",
        },
      })
      return
    }

    // Se calcula fuera del actualizador de estado (React no garantiza
    // ejecutarlo en el momento); las notas y el chat se toman del estado más reciente
    const nuevo = aBorrador(datos, catalogo, borrador)
    setBorrador((b) => ({ ...nuevo, notas: b.notas, chat: b.chat }))
    const faltan = obligatoriosDe(nuevo, catalogo)
    if (faltan.length > 0) {
      // Nueva ronda solo para el dato que falta: se marca el último mensaje
      // como límite de ronda para que el contador de turnos empiece de cero
      const conLimite = mensajes.map((m, i) =>
        i === mensajes.length - 1 ? { ...m, finRonda: true } : m
      )
      await pedirTurno(conLimite, {
        dudasTurno: faltan,
        obligatoriosTurno: faltan,
        propuestaTurno: resumenParaAgente(nuevo, catalogo),
      })
      return
    }
    const cierre = crearMensaje("agente", CIERRE_LOCAL, { cierre: true })
    setChat({
      mensajes: [...mensajes, cierre],
      estado: "terminado",
      error: null,
    })
  }

  // Pide a V.E.R.A. su siguiente mensaje
  async function pedirTurno(
    mensajes,
    {
      dudasTurno = dudas,
      obligatoriosTurno = obligatorios,
      propuestaTurno = propuestaActual,
    } = {}
  ) {
    setChat({ mensajes, estado: "pensando", error: null })
    const { estado, datos } = await conversarConAgente({
      cliente,
      descripcion,
      propuestaActual: propuestaTurno,
      obligatorios: obligatoriosTurno,
      dudas: dudasTurno.slice(0, 10),
      // Solo la ronda actual (lo anterior ya está en la propuesta): así el
      // límite de turnos del servidor cuenta por ronda
      conversacion: mensajes
        .slice(mensajes.findLastIndex((m) => m.cierre || m.finRonda) + 1)
        .slice(-24)
        .map(({ rol, texto }) => ({ rol, texto })),
    })
    if (estado !== 200) {
      setChat({
        estado: "error",
        error: {
          texto: datos?.error ?? "El agente no ha podido responder",
          reintentar: "turno",
        },
      })
      return
    }
    const mensaje = crearMensaje("agente", datos.mensaje, {
      pregunta: datos.pregunta,
      opciones: datos.opciones,
    })
    const lista = [...mensajes, mensaje]
    if (datos.terminado) await actualizar(lista)
    else setChat({ mensajes: lista, estado: "esperando" })
  }

  // Arranca sola cuando hay una propuesta con dudas y todavía no ha hablado
  // (depende del estado del chat y no de una ref de «ya iniciado»: así funciona
  // también con el doble montaje de React en desarrollo). La ref guarda la
  // última versión de pedirTurno para usarla desde el efecto.
  const pedirTurnoRef = React.useRef(pedirTurno)
  React.useEffect(() => {
    pedirTurnoRef.current = pedirTurno
  })
  const debeEmpezar =
    Boolean(borrador) &&
    chat.estado === "inactivo" &&
    chat.mensajes.length === 0 &&
    dudas.length > 0
  React.useEffect(() => {
    if (!debeEmpezar) return
    const t = setTimeout(() => pedirTurnoRef.current([]), 0)
    return () => clearTimeout(t)
  }, [debeEmpezar])

  // Se puede escribir cuando V.E.R.A. pregunta o, con propuesta, cuando está libre
  const libre =
    Boolean(borrador) &&
    (chat.estado === "terminado" ||
      (chat.estado === "inactivo" && dudas.length === 0))
  const puedeEscribir = chat.estado === "esperando" || libre

  function enviar(respuesta) {
    const limpio = respuesta.trim().slice(0, RESPUESTA_MAX)
    if (!limpio || !puedeEscribir) return
    setTexto("")
    const lista = [...chat.mensajes, crearMensaje("cliente", limpio)]
    // Si no había pregunta abierta, el agente sabe que el cliente quiere añadir algo
    pedirTurno(lista, libre ? [DUDA_LIBRE, ...dudas] : dudas)
  }

  function reintentar() {
    if (chat.error?.reintentar === "actualizar") actualizar(chat.mensajes)
    else pedirTurno(chat.mensajes)
  }

  // Sin conversación todavía: mensaje de bienvenida local
  const mensajesVisibles =
    chat.mensajes.length > 0
      ? chat.mensajes
      : !borrador
        ? [BIENVENIDA_SIN_PROPUESTA]
        : dudas.length === 0
          ? [BIENVENIDA_SIN_DUDAS]
          : []
  const ultimo = mensajesVisibles.at(-1)

  // Efecto «hablando»: el último mensaje de V.E.R.A. aparece letra a letra y el
  // Aura se mueve con un volumen simulado (no hay audio: solo texto).
  const { visible, hablando, volumen } = useHabla(
    ultimo?.rol === "agente" ? ultimo : null
  )
  const estadoAura = hablando
    ? "speaking"
    : pensando ||
        (chat.estado === "inactivo" && Boolean(borrador) && dudas.length > 0)
      ? "thinking"
      : "listening"

  // Si llega un mensaje con el panel cerrado, el lanzador lo avisa
  const [vistos, setVistos] = React.useState(0)
  const mensajesAgente = chat.mensajes.filter((m) => m.rol === "agente").length
  const sinLeer = abierto ? 0 : Math.max(0, mensajesAgente - vistos)
  const abrir = () => {
    setVistos(mensajesAgente)
    setAbierto(true)
  }
  const cerrar = () => {
    setVistos(mensajesAgente)
    setAbierto(false)
  }

  // Formato de mensaje que espera AgentChatTranscript (Agents UI)
  const mensajes = mensajesVisibles.map((m) => ({
    id: m.id,
    timestamp: m.hora || Date.UTC(2026, 0, 1),
    from: { isLocal: m.rol === "cliente" },
    message: m === ultimo && m.rol === "agente" ? visible : m.texto,
  }))
  const opciones =
    chat.estado === "esperando" && !hablando ? (ultimo?.opciones ?? []) : []

  // El portal necesita document: solo se pinta en el navegador (no en el render del servidor)
  if (!montado) return null

  return createPortal(
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      {abierto && (
        <section
          id="agente"
          role="dialog"
          aria-label={`Chat con ${NOMBRE_AGENTE}`}
          className="flex h-[min(38rem,calc(100dvh-8rem))] w-[min(25rem,calc(100vw-2rem))] origin-bottom-right animate-in flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-violet-950/30 duration-200 zoom-in-95 fade-in"
        >
          <header className="flex shrink-0 items-center gap-3 border-b bg-linear-to-r from-violet-600/10 to-fuchsia-600/10 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold tracking-wide">
                {NOMBRE_AGENTE}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Validadora Experimental de Requisitos y Alcance
              </p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium",
                chat.estado === "error"
                  ? "bg-destructive/10 text-destructive"
                  : chat.estado === "esperando"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "bg-primary/10 text-primary"
              )}
            >
              {hablando ? "Escribiendo…" : ESTADOS_CHAT[chat.estado]}
            </span>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Minimizar el chat"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="size-5" />
            </button>
          </header>

          <AgentChatTranscript
            messages={mensajes}
            agentState={pensando ? "thinking" : "listening"}
            thinkingLabel={
              chat.estado === "actualizando"
                ? "Actualizando la propuesta con tus respuestas…"
                : `${NOMBRE_AGENTE} está pensando…`
            }
            // Aura viva solo junto al último mensaje (cada Aura es un contexto WebGL)
            agentAvatar={(_mensaje, esUltimo) =>
              esUltimo ? (
                <AuraVera
                  estado={estadoAura}
                  volumen={volumen}
                  tema={tema}
                  className="h-12! w-12"
                />
              ) : (
                <span className="block size-12" aria-hidden="true" />
              )
            }
            agentBubbleClassName="rounded-2xl rounded-tl-sm border-primary/15! bg-background! text-foreground! shadow-sm"
            userBubbleClassName="rounded-2xl rounded-tr-sm bg-linear-to-br from-violet-600 to-fuchsia-600 text-white!"
            className="min-h-0 flex-1 bg-muted/30 px-3"
            scrollAnchor="any"
          />

          <div className="flex shrink-0 flex-col gap-2.5 border-t p-3">
            {chat.estado === "error" && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
                <span>{chat.error?.texto}. Tus respuestas siguen aquí.</span>
                <BotonSuave onClick={reintentar} className="h-8">
                  Reintentar
                </BotonSuave>
              </div>
            )}

            {opciones.length > 0 && (
              <div
                className="flex flex-wrap gap-1.5"
                aria-label="Respuestas rápidas"
              >
                {opciones.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => enviar(o)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {chat.estado === "terminado" && borrador?.preguntas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Quedan {borrador.preguntas.length}{" "}
                {borrador.preguntas.length === 1 ? "duda" : "dudas"} sin
                aclarar: irán al presupuesto como pendientes.
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviar(texto)
              }}
              className="flex gap-2"
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={RESPUESTA_MAX}
                disabled={!puedeEscribir}
                placeholder={
                  !borrador
                    ? "Primero describe tu proyecto en el formulario"
                    : chat.estado === "esperando"
                      ? "Escribe tu respuesta…"
                      : libre
                        ? "¿Quieres añadir algo?"
                        : "Espera un momento…"
                }
                aria-label={`Escribir a ${NOMBRE_AGENTE}`}
                className={cn(CAMPO, "h-11 py-0 text-sm disabled:opacity-60")}
              />
              <button
                type="submit"
                disabled={!puedeEscribir || !texto.trim()}
                aria-label="Enviar"
                className={cn(
                  DEGRADADO_MARCA,
                  "flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-md shadow-fuchsia-500/25 transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
                )}
              >
                <ArrowUp className="size-4" />
              </button>
            </form>

            {chat.estado === "esperando" && (
              <p className="text-xs text-muted-foreground">
                {hablo ? (
                  <button
                    type="button"
                    onClick={() => actualizar(chat.mensajes)}
                    className="font-medium text-primary hover:underline"
                  >
                    Ya está: actualiza la propuesta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setChat({ estado: "terminado" })
                      cerrar()
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Prefiero elegir yo en la página
                  </button>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Lanzador: el Aura de V.E.R.A., siempre en la esquina inferior derecha */}
      <div className="relative">
        {!abierto && sinLeer > 0 && (
          <p className="pointer-events-none absolute right-20 bottom-3 hidden w-max max-w-56 rounded-2xl rounded-br-sm border bg-card px-3 py-2 text-sm shadow-lg sm:block">
            {NOMBRE_AGENTE} tiene algo que preguntarte
          </p>
        )}
        <button
          type="button"
          onClick={abierto ? cerrar : abrir}
          aria-label={
            abierto ? "Minimizar el chat" : `Hablar con ${NOMBRE_AGENTE}`
          }
          aria-expanded={abierto}
          className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#120d24] shadow-xl ring-1 shadow-fuchsia-600/30 ring-white/10 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none"
        >
          {abierto ? (
            <ChevronDown className="size-6 text-violet-100" />
          ) : (
            <AuraVera
              estado={
                pensando ? "thinking" : sinLeer > 0 ? "speaking" : "listening"
              }
              volumen={0}
              tema="dark"
              className="h-16! w-16"
            />
          )}
        </button>
        {!abierto && sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-fuchsia-500 text-[0.65rem] font-bold text-white ring-2 ring-background">
            {sinLeer}
          </span>
        )}
      </div>
    </div>,
    document.body
  )
}

// Simula que V.E.R.A. «habla»: revela el mensaje letra a letra y genera un
// volumen oscilante para el Aura mientras dura
function useHabla(mensaje) {
  const [progreso, setProgreso] = React.useState({
    id: null,
    letras: 0,
    volumen: 0,
  })
  const id = mensaje?.id ?? null
  const total = mensaje?.texto.length ?? 0

  React.useEffect(() => {
    if (!id) return
    const inicio = performance.now()
    const velocidad = 0.07 // letras por milisegundo (~70 por segundo)
    const intervalo = setInterval(() => {
      const t = performance.now() - inicio
      const letras = Math.min(total, Math.floor(t * velocidad))
      const volumen =
        letras >= total
          ? 0
          : 0.2 +
            0.35 * Math.abs(Math.sin(t / 90) * Math.sin(t / 230)) +
            0.1 * Math.random()
      setProgreso({ id, letras, volumen })
      if (letras >= total) clearInterval(intervalo)
    }, 30)
    return () => clearInterval(intervalo)
  }, [id, total])

  if (!mensaje) return { visible: "", hablando: false, volumen: 0 }
  // Los mensajes que ya estaban (p. ej. al volver a abrir) no se vuelven a «decir»
  const letras = progreso.id === id ? progreso.letras : 0
  const hablando = letras < total
  return {
    visible: mensaje.texto.slice(0, Math.max(letras, 1)),
    hablando,
    volumen: progreso.id === id ? progreso.volumen : 0,
  }
}

function Resumen({ texto, error, onCambiar }) {
  const [editando, setEditando] = React.useState(false)
  return (
    <section id="resumen" className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Encabezado
          numero="3"
          titulo="Resumen del proyecto"
          subtitulo="Redactado por la IA: aparecerá en el PDF"
          error={error}
        />
        <BotonSuave onClick={() => setEditando((e) => !e)} className="shrink-0">
          {editando ? <Check /> : <Pencil />}
          {editando ? "Listo" : "Editar"}
        </BotonSuave>
      </div>
      {editando || error ? (
        <textarea
          value={texto}
          onChange={(e) => onCambiar(e.target.value)}
          rows={4}
          maxLength={1500}
          autoFocus={editando}
          aria-label="Resumen del proyecto"
          className={cn(
            CAMPO,
            "resize-y leading-relaxed",
            error && CAMPO_ERROR
          )}
        />
      ) : (
        <p className={cn(PIEZA, "p-4 text-sm leading-relaxed")}>{texto}</p>
      )}
    </section>
  )
}

function ListaEditable({
  id,
  numero,
  titulo,
  subtitulo,
  icono: Icono,
  vacio,
  elementos,
  texto,
  onQuitar,
  onAnadir,
  placeholder,
}) {
  const [nuevo, setNuevo] = React.useState("")
  function anadir(e) {
    e.preventDefault()
    const t = nuevo.trim()
    if (!t) return
    onAnadir(t.slice(0, 400))
    setNuevo("")
  }
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <Encabezado numero={numero} titulo={titulo} subtitulo={subtitulo} />
      {elementos.length === 0 ? (
        vacio && <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {elementos.map((el, i) => (
            <li
              key={i}
              className={cn(PIEZA, "flex items-start gap-3 p-3 text-sm")}
            >
              <Icono className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="flex-1">{texto(el)}</span>
              <button
                type="button"
                onClick={() => onQuitar(i)}
                aria-label="Quitar"
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={anadir} className="flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder={placeholder}
          className={cn(CAMPO, "h-10 py-0 text-sm")}
        />
        <BotonSuave type="submit" disabled={!nuevo.trim()} aria-label="Añadir">
          <Plus />
        </BotonSuave>
      </form>
    </section>
  )
}

/* ─── Panel lateral: cálculo del servidor ────────────────────────────────── */

function PanelPresupuesto({ faltan, calculo, onVistaPrevia }) {
  const [hover, propsHover] = useHover()
  const listo = faltan.length === 0
  const d =
    calculo.estado !== "idle" && calculo.datos && calculo.estado !== "error"
      ? calculo.datos
      : null
  const actualizando = listo && !calculo.vigente

  return (
    <Panel className="overflow-hidden p-0">
      <div
        className="relative isolate flex flex-col gap-1 p-6 text-white"
        {...propsHover}
      >
        <AnimatedGradient config={DEGRADADO_TOTAL} />
        <span className="flex items-center justify-between gap-2 text-sm text-violet-100">
          <span className="flex items-center gap-2">
            <IconoAnimado
              icono={HugeiconsReceiptEuroIcon}
              activo={hover}
              size={18}
            />
            Total presupuestado
          </span>
          {actualizando && <Spinner size="sm" className="text-white" />}
        </span>
        {listo && d ? (
          <SpecialText
            key={d.total}
            speed={25}
            className={cn(
              "h-auto! text-5xl leading-tight! font-bold tracking-tight transition-opacity",
              actualizando && "opacity-60"
            )}
          >
            {formatoEuros(d.total, d.moneda)}
          </SpecialText>
        ) : (
          <p className="text-5xl leading-tight font-bold tracking-tight text-white/40">
            — €
          </p>
        )}
        <p className="text-xs text-violet-100/80">
          Sin impuestos · se recalcula en el servidor al cambiar algo
        </p>
      </div>

      {!listo ? (
        <div className="flex flex-col gap-2 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
            <TriangleAlert className="size-4" /> Para calcular, falta:
          </p>
          <ul className="flex flex-col gap-1.5">
            {faltan.map((f) => (
              <li key={f.ancla}>
                <button
                  type="button"
                  onClick={() => irA(f.ancla)}
                  className="w-full rounded-lg bg-amber-500/10 px-3 py-2 text-left text-sm transition-colors hover:bg-amber-500/20"
                >
                  {f.texto} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : calculo.estado === "error" ? (
        <ul className="flex flex-col gap-2 p-5">
          {(
            calculo.datos?.detalles ?? [
              calculo.datos?.error ?? "Error al calcular",
            ]
          ).map((t) => (
            <li
              key={t}
              className="rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : d ? (
        <ul
          className={cn(
            "flex flex-col divide-y px-6 py-2 transition-opacity",
            actualizando && "opacity-60"
          )}
        >
          {d.lineas.map((l) => (
            <li
              key={l.id}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span>
                {l.nombre}
                {l.detalle && (
                  <span className="block text-xs text-muted-foreground">
                    {l.detalle}
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums">
                {formatoEuros(l.importe, d.moneda)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <Spinner size="sm" className="text-primary" /> Calculando…
        </div>
      )}

      <div className="flex flex-col gap-3 border-t bg-primary/[0.03] p-5">
        <BotonDegradado
          onClick={onVistaPrevia}
          disabled={!calculo.vigente || calculo.estado !== "ok"}
          className="w-full"
        >
          <Eye className="size-4" /> Revisar y descargar PDF
        </BotonDegradado>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <SimboloVera /> Importes calculados por el servidor con sus tarifas
        </p>
      </div>
    </Panel>
  )
}

/* ─── Paso 3: vista previa del PDF ───────────────────────────────────────── */

function VistaPrevia({ vista, onCerrar }) {
  React.useEffect(() => {
    const alPulsar = (e) => e.key === "Escape" && onCerrar()
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
  }, [onCerrar])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del presupuesto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        className={cn(
          SUPERFICIE,
          "flex h-full max-h-[56rem] w-full max-w-4xl flex-col overflow-hidden bg-card"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <Pasos actual={3} />
            <p className="mt-2 text-xs text-muted-foreground">
              Revisa el documento. Si algo no cuadra, vuelve a editar antes de
              descargar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotonSuave onClick={onCerrar}>
              <ArrowLeft /> Volver a editar
            </BotonSuave>
            {vista.url && (
              <>
                <a
                  href={vista.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border bg-card/80 px-4 text-sm font-medium transition-all hover:border-primary/40 hover:text-primary sm:hidden"
                >
                  <ExternalLink className="size-4" /> Abrir
                </a>
                <a
                  href={vista.url}
                  download={vista.nombre}
                  className={cn(
                    DEGRADADO_MARCA,
                    "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition-all hover:-translate-y-0.5"
                  )}
                >
                  <Download className="size-4" /> Descargar PDF
                </a>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted/40">
          {vista.cargando && (
            <span className="flex items-center gap-3 text-muted-foreground">
              <Spinner size="default" className="text-primary" /> Generando el
              PDF en el servidor…
            </span>
          )}
          {vista.error && (
            <p className="max-w-md p-6 text-center text-sm text-destructive">
              {vista.error}
            </p>
          )}
          {vista.url && (
            <iframe
              src={vista.url}
              title="Presupuesto en PDF"
              className="size-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
