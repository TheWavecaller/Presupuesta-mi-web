"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { Fondo } from "@/components/fondo"
import { HugeiconsBadgeAlertIcon } from "@/components/icons/hugeicons-badge-alert"
import { HugeiconsBriefcaseBusinessIcon } from "@/components/icons/hugeicons-briefcase-business"
import { HugeiconsChevronDownIcon } from "@/components/icons/hugeicons-chevron-down"
import { HugeiconsCircleCheckIcon } from "@/components/icons/hugeicons-circle-check"
import { HugeiconsLanguagesIcon } from "@/components/icons/hugeicons-languages"
import { HugeiconsMailIcon } from "@/components/icons/hugeicons-mail"
import { HugeiconsReceiptEuroIcon } from "@/components/icons/hugeicons-receipt-euro"
import { HugeiconsRefreshCwIcon } from "@/components/icons/hugeicons-refresh-cw"
import { HugeiconsRocketIcon } from "@/components/icons/hugeicons-rocket"
import { HugeiconsServerCrashIcon } from "@/components/icons/hugeicons-server-crash"
import { HugeiconsSquarePenIcon } from "@/components/icons/hugeicons-square-pen"
import { HugeiconsTerminalIcon } from "@/components/icons/hugeicons-terminal"
import AnimatedGradient from "@/components/spell/animated-gradient"
import { BlurReveal } from "@/components/spell/blur-reveal"
import { CopyButton } from "@/components/spell/copy-button"
import { FlowButton } from "@/components/spell/flow-button"
import { GradientWaveText } from "@/components/spell/gradient-wave-text"
import { SpecialText } from "@/components/spell/special-text"
import { Spinner } from "@/components/spell/spinner"
import { TiltCard } from "@/components/spell/tilt-card"
import { WordsStagger } from "@/components/spell/words-stagger"
import { API_URL, obtenerTarifas, pedirPresupuesto } from "@/lib/api"
import { cn } from "@/lib/utils"

/* ─── Sistema visual ─────────────────────────────────────────────────────── */

// Acento de la marca: degradado violeta → fucsia
const DEGRADADO_MARCA = "bg-linear-to-br from-violet-600 to-fuchsia-600"
const TEXTO_DEGRADADO =
  "bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-300 dark:to-fuchsia-300"

// Superficies de cristal: paneles grandes y piezas interiores
const SUPERFICIE =
  "rounded-3xl border bg-card/75 shadow-xl shadow-violet-950/[0.04] backdrop-blur-xl dark:bg-card/60 dark:shadow-black/20"
const PIEZA = "rounded-2xl border bg-card/80 dark:bg-card/50"

// Tarjeta seleccionable: borde degradado cuando está marcada
const SELECCIONABLE =
  "group cursor-pointer rounded-2xl border bg-card/80 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-violet-500/10 has-checked:borde-degradado has-checked:shadow-lg has-checked:shadow-fuchsia-500/15 has-focus-visible:ring-3 has-focus-visible:ring-ring/40 dark:bg-card/50"

// Cápsula de estado (cristal con punto de color)
const CAPSULA =
  "inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-sm font-medium backdrop-blur"

// Colores de las animaciones de Spell UI
const COLORES_TITULO = ["#7c3aed", "#a855f7", "#c026d3", "#d946ef", "#8b5cf6"]
const DEGRADADO_TOTAL = {
  preset: "custom",
  color1: "#7c3aed",
  color2: "#1e1b4b",
  color3: "#c026d3",
  rotation: 0,
  proportion: 63,
  scale: 0.75,
  speed: 30,
  distortion: 5,
  swirl: 61,
  swirlIterations: 5,
  softness: 100,
  offset: -168,
  shape: "Checks",
  shapeSize: 28,
}

/* ─── Datos del formulario ───────────────────────────────────────────────── */

const INICIAL = {
  tipo: "corporativa",
  paginas: "4",
  formulario: true,
  segundoIdioma: false,
}

const TIPOS = [
  {
    id: "landing",
    nombre: "Landing",
    descripcion: "Una página para presentar un producto o campaña",
    icono: HugeiconsRocketIcon,
  },
  {
    id: "corporativa",
    nombre: "Corporativa",
    descripcion: "Web de empresa con varias secciones",
    icono: HugeiconsBriefcaseBusinessIcon,
  },
]

const EXTRAS = [
  {
    id: "formulario",
    nombre: "Formulario de contacto",
    icono: HugeiconsMailIcon,
  },
  {
    id: "segundoIdioma",
    nombre: "Segundo idioma",
    icono: HugeiconsLanguagesIcon,
  },
]

const formatoEuros = (importe, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(importe)

// Convierte el estado del formulario en el cuerpo que exige el contrato de la API.
// "paginas" se manda como número aunque sea inválido (0, 21, 2.5…): valida el servidor.
function construirSolicitud(form) {
  const texto = form.paginas.trim()
  return {
    tipo: form.tipo,
    paginas: texto === "" ? null : Number(texto),
    formulario: form.formulario,
    segundoIdioma: form.segundoIdioma,
  }
}

const comandoCurl = (cuerpoJson) =>
  `curl -i ${API_URL}/api/presupuesto -H "Content-Type: application/json" -d '${cuerpoJson}'`

/* ─── Piezas pequeñas ────────────────────────────────────────────────────── */

// Estrella de cuatro puntas con el degradado de la marca (sustituye a los separadores)
function Destello({ className }) {
  const id = React.useId()
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("inline-block size-3 shrink-0", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 0C12.7 6.4 17.6 11.3 24 12C17.6 12.7 12.7 17.6 12 24C11.3 17.6 6.4 12.7 0 12C6.4 11.3 11.3 6.4 12 0Z"
      />
    </svg>
  )
}

// Icono animado (icons-animated, colección Hugeicons) que se anima mientras `activo` es true,
// para que reaccione al pasar el ratón por todo su elemento y no solo por el icono
function IconoAnimado({ icono: Icono, activo, size = 20, className }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (activo) ref.current?.startAnimation()
    else ref.current?.stopAnimation()
  }, [activo])
  return (
    <Icono
      ref={ref}
      size={size}
      className={cn("inline-flex shrink-0", className)}
    />
  )
}

function useHover() {
  const [hover, setHover] = React.useState(false)
  return [
    hover,
    {
      onPointerEnter: () => setHover(true),
      onPointerLeave: () => setHover(false),
    },
  ]
}

// Botón principal con el mismo fondo animado que la tarjeta del total
function BotonDegradado({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "relative isolate inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-7 font-heading font-semibold text-white shadow-lg ring-1 shadow-fuchsia-500/25 ring-white/20 transition-all ring-inset hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/35 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-70",
        className
      )}
      {...props}
    >
      <AnimatedGradient config={DEGRADADO_TOTAL} />
      {children}
    </button>
  )
}

// Botón redondo del selector de páginas
function BotonRedondo({ children, ...props }) {
  return (
    <button
      type="button"
      className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95 [&_svg]:size-4"
      {...props}
    >
      {children}
    </button>
  )
}

/* ─── Página ─────────────────────────────────────────────────────────────── */

export function Presupuestador() {
  const [tarifas, setTarifas] = React.useState(null)
  const [estadoApi, setEstadoApi] = React.useState("cargando") // cargando | ok | caida
  const [form, setForm] = React.useState(INICIAL)
  const [modoJson, setModoJson] = React.useState(false)
  const [jsonTexto, setJsonTexto] = React.useState("")
  const [enviando, setEnviando] = React.useState(false)
  const [resultado, setResultado] = React.useState(null)
  const [hoverJson, propsHoverJson] = useHover()
  const [hoverDetalles, propsHoverDetalles] = useHover()

  const cargarTarifas = React.useCallback(() => {
    obtenerTarifas()
      .then((t) => {
        setTarifas(t)
        setEstadoApi("ok")
      })
      .catch(() => setEstadoApi("caida"))
  }, [])

  React.useEffect(() => {
    cargarTarifas()
  }, [cargarTarifas])

  const solicitud = construirSolicitud(form)
  const cuerpoActual = modoJson ? jsonTexto : JSON.stringify(solicitud)
  const camposConError =
    resultado?.estado === 400 ? (resultado.datos.campos ?? []) : []

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setResultado(null)
  }

  function alternarModoJson() {
    if (!modoJson) setJsonTexto(JSON.stringify(solicitud, null, 2))
    setModoJson((m) => !m)
    setResultado(null)
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    try {
      setResultado(await pedirPresupuesto(cuerpoActual))
    } catch {
      setResultado({ estado: 0 })
    } finally {
      setEnviando(false)
    }
  }

  const paginasNumero = Number(form.paginas)
  const paginasEnRango =
    Number.isInteger(paginasNumero) && paginasNumero >= 1 && paginasNumero <= 20
  const paginasSlider = paginasEnRango ? paginasNumero : 1

  return (
    <div className="relative isolate min-h-svh">
      <Fondo />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-3">
            <p
              className={cn(
                CAPSULA,
                "gap-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.2em] uppercase"
              )}
            >
              <span className={TEXTO_DEGRADADO}>Agencia</span>
              <Destello />
              <span className={TEXTO_DEGRADADO}>Presupuestos web</span>
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
              <GradientWaveText
                align="left"
                customColors={COLORES_TITULO}
                speed={0.8}
                className="justify-start [--gradient-wave-base:var(--foreground)]! dark:[--gradient-wave-base:var(--foreground)]!"
              >
                Presupuesta mi web
              </GradientWaveText>
            </h1>
            <WordsStagger
              delay={0.3}
              stagger={0.04}
              className="max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              Elige cómo quieres tu web y el servidor calculará el presupuesto
              con sus propias tarifas.
            </WordsStagger>
          </div>
          <EstadoApi
            estado={estadoApi}
            onReintentar={() => {
              setEstadoApi("cargando")
              cargarTarifas()
            }}
          />
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <form
            onSubmit={enviar}
            noValidate
            className={cn(SUPERFICIE, "flex flex-col gap-9 p-5 sm:p-8")}
          >
            {modoJson ? (
              <section className="flex flex-col gap-3">
                <Titulo numero="{ }" texto="Petición JSON" />
                <p className="text-sm text-muted-foreground">
                  Edita el cuerpo a mano para probar entradas inválidas:{" "}
                  <Codigo>&quot;paginas&quot;: 0</Codigo>,{" "}
                  <Codigo>&quot;tipo&quot;: &quot;tienda&quot;</Codigo>,{" "}
                  <Codigo>&quot;formulario&quot;: &quot;false&quot;</Codigo>…
                </p>
                <textarea
                  value={jsonTexto}
                  onChange={(e) => {
                    setJsonTexto(e.target.value)
                    setResultado(null)
                  }}
                  spellCheck={false}
                  rows={8}
                  className={cn(
                    PIEZA,
                    "w-full p-4 font-mono text-sm outline-none focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/30"
                  )}
                />
              </section>
            ) : (
              <>
                <fieldset className="flex flex-col gap-3">
                  <Titulo
                    numero="1"
                    texto="Tipo de web"
                    error={camposConError.includes("tipo")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TIPOS.map((tipo) => (
                      <TarjetaTipo
                        key={tipo.id}
                        {...tipo}
                        precio={tarifas?.[tipo.id]}
                        elegido={form.tipo === tipo.id}
                        onElegir={() => cambiar("tipo", tipo.id)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3">
                  <Titulo
                    numero="2"
                    texto="Número de páginas"
                    error={camposConError.includes("paginas")}
                  />
                  <div className={cn(PIEZA, "flex flex-col gap-5 p-5")}>
                    <div className="flex flex-wrap items-center gap-3">
                      <BotonRedondo
                        aria-label="Quitar una página"
                        onClick={() =>
                          cambiar(
                            "paginas",
                            String((paginasEnRango ? paginasNumero : 2) - 1)
                          )
                        }
                      >
                        <Minus />
                      </BotonRedondo>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        aria-label="Páginas"
                        value={form.paginas}
                        onChange={(e) => cambiar("paginas", e.target.value)}
                        className={cn(
                          "h-12 w-20 [appearance:textfield] rounded-xl border bg-background/60 text-center font-heading text-2xl font-semibold tabular-nums outline-none focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-inner-spin-button]:appearance-none",
                          camposConError.includes("paginas") &&
                            "border-destructive ring-3 ring-destructive/20"
                        )}
                      />
                      <BotonRedondo
                        aria-label="Añadir una página"
                        onClick={() =>
                          cambiar(
                            "paginas",
                            String((paginasEnRango ? paginasNumero : 0) + 1)
                          )
                        }
                      >
                        <Plus />
                      </BotonRedondo>
                      <p className="ml-auto text-right text-sm leading-relaxed text-muted-foreground">
                        La primera va incluida
                        <br />
                        Cada adicional{" "}
                        <Precio
                          importe={tarifas?.paginaAdicional}
                          prefijo="+"
                          className={TEXTO_DEGRADADO}
                        />
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        aria-label="Páginas (deslizador)"
                        value={paginasSlider}
                        onChange={(e) => cambiar("paginas", e.target.value)}
                        className="rango-degradado w-full"
                        style={{
                          "--progreso": `${((paginasSlider - 1) / 19) * 100}%`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3">
                  <Titulo
                    numero="3"
                    texto="Extras"
                    error={
                      camposConError.includes("formulario") ||
                      camposConError.includes("segundoIdioma")
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {EXTRAS.map((extra) => (
                      <TarjetaExtra
                        key={extra.id}
                        {...extra}
                        precio={tarifas?.[extra.id]}
                        activado={form[extra.id]}
                        onCambiar={(valor) => cambiar(extra.id, valor)}
                      />
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="flex flex-col-reverse gap-4 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
              <FlowButton
                type="button"
                onClick={alternarModoJson}
                borderColor="#d946ef"
                className="self-start bg-primary/10 text-primary hover:bg-transparent dark:bg-primary/15 dark:hover:bg-transparent"
                {...propsHoverJson}
              >
                <IconoAnimado
                  icono={HugeiconsSquarePenIcon}
                  activo={hoverJson}
                  size={16}
                />
                {modoJson ? "Volver al formulario" : "Editar la petición JSON"}
              </FlowButton>
              <BotonDegradado type="submit" disabled={enviando}>
                {enviando ? (
                  <Spinner size="default" />
                ) : (
                  <Destello className="size-4 [&_path]:fill-white" />
                )}
                Calcular presupuesto
              </BotonDegradado>
            </div>

            <details className={cn(PIEZA, "group -mt-3 text-sm")}>
              <summary
                className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-muted-foreground transition-colors hover:text-foreground"
                {...propsHoverDetalles}
              >
                <IconoAnimado
                  icono={HugeiconsChevronDownIcon}
                  activo={hoverDetalles}
                  size={16}
                  className="text-primary transition-transform group-open:rotate-180"
                />
                Ver lo que se envía <Codigo>POST /api/presupuesto</Codigo>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <pre className="overflow-x-auto rounded-xl bg-muted/60 p-3 font-mono text-xs">
                  {modoJson ? jsonTexto : JSON.stringify(solicitud, null, 2)}
                </pre>
                <div className="flex items-center gap-2 rounded-xl border bg-background/60 py-1 pr-1 pl-3">
                  <HugeiconsTerminalIcon
                    size={16}
                    className="inline-flex shrink-0 text-primary"
                  />
                  <code className="flex-1 truncate font-mono text-xs text-muted-foreground">
                    {comandoCurl(cuerpoActual)}
                  </code>
                  <CopyButton
                    value={comandoCurl(cuerpoActual)}
                    size="sm"
                    aria-label="Copiar comando curl"
                    className="text-primary hover:bg-primary/10 dark:text-primary"
                  />
                </div>
              </div>
            </details>
          </form>

          <aside className="lg:sticky lg:top-6">
            <Resultado
              resultado={resultado}
              enviando={enviando}
              tarifas={tarifas}
            />
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>0613 Desarrollo web en entorno servidor</span>
          <Destello />
          <span>
            Pulsa{" "}
            <kbd className="rounded-md border bg-card/80 px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground shadow-sm">
              d
            </kbd>{" "}
            para modo oscuro
          </span>
        </footer>
      </main>
    </div>
  )
}

/* ─── Formulario ─────────────────────────────────────────────────────────── */

function TarjetaTipo({
  id,
  nombre,
  descripcion,
  icono,
  precio,
  elegido,
  onElegir,
}) {
  const [hover, propsHover] = useHover()
  return (
    <TiltCard
      tiltLimit={6}
      scale={1.02}
      effect="gravitate"
      className="rounded-2xl"
    >
      <label
        {...propsHover}
        className={cn(SELECCIONABLE, "flex h-full flex-col gap-4 p-5")}
      >
        <input
          type="radio"
          name="tipo"
          value={id}
          checked={elegido}
          onChange={onElegir}
          className="sr-only"
        />
        <div className="flex items-start justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-has-checked:bg-linear-to-br group-has-checked:from-violet-600 group-has-checked:to-fuchsia-600 group-has-checked:text-white group-has-checked:shadow-md group-has-checked:shadow-fuchsia-500/30">
            <IconoAnimado icono={icono} activo={hover} size={22} />
          </span>
          <Precio
            importe={precio}
            className="font-heading text-lg group-has-checked:text-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-heading font-semibold">{nombre}</p>
          <p className="text-sm leading-snug text-muted-foreground">
            {descripcion}
          </p>
        </div>
      </label>
    </TiltCard>
  )
}

function TarjetaExtra({ nombre, icono, precio, activado, onCambiar }) {
  const [hover, propsHover] = useHover()
  return (
    <label
      {...propsHover}
      className={cn(SELECCIONABLE, "flex items-center gap-3 p-4")}
    >
      <input
        type="checkbox"
        checked={activado}
        onChange={(e) => onCambiar(e.target.checked)}
        className="sr-only"
      />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-has-checked:bg-linear-to-br group-has-checked:from-violet-600 group-has-checked:to-fuchsia-600 group-has-checked:text-white">
        <IconoAnimado icono={icono} activo={hover} size={20} />
      </span>
      <span className="flex-1">
        <span className="block font-medium">{nombre}</span>
        <Precio
          importe={precio}
          prefijo="+"
          className="text-sm font-medium text-muted-foreground"
        />
      </span>
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted ring-1 ring-border transition-colors ring-inset group-has-checked:bg-linear-to-r group-has-checked:from-violet-600 group-has-checked:to-fuchsia-600 group-has-checked:ring-0">
        <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform group-has-checked:translate-x-5" />
      </span>
    </label>
  )
}

function Titulo({ numero, texto, error }) {
  return (
    <legend className="mb-3 flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full font-heading text-xs font-semibold text-white shadow-md",
          error
            ? "bg-destructive shadow-destructive/25"
            : cn(DEGRADADO_MARCA, "shadow-fuchsia-500/25")
        )}
      >
        {numero}
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">
        {texto}
      </span>
      {error && (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          Revisar
        </span>
      )}
    </legend>
  )
}

function Precio({ importe, prefijo = "", className }) {
  if (importe === undefined)
    return <span className={cn("text-muted-foreground", className)}>— €</span>
  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {prefijo}
      {formatoEuros(importe)}
    </span>
  )
}

function Codigo({ children }) {
  return (
    <code className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[0.8em] text-primary">
      {children}
    </code>
  )
}

function EstadoApi({ estado, onReintentar }) {
  const [hover, propsHover] = useHover()

  if (estado === "caida") {
    return (
      <button
        onClick={onReintentar}
        className={cn(
          CAPSULA,
          "self-start border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 sm:self-auto"
        )}
        {...propsHover}
      >
        <IconoAnimado icono={HugeiconsRefreshCwIcon} activo={hover} size={14} />
        API desconectada, pulsa para reintentar
      </button>
    )
  }

  return (
    <span className={cn(CAPSULA, "self-start sm:self-auto")}>
      {estado === "ok" ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-fuchsia-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500" />
        </span>
      ) : (
        <Spinner size="sm" className="text-primary" />
      )}
      {estado === "ok" ? "API conectada" : "Conectando con la API…"}
    </span>
  )
}

/* ─── Resultado ──────────────────────────────────────────────────────────── */

function Resultado({ resultado, enviando, tarifas }) {
  const [hover, propsHover] = useHover()

  if (enviando) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Spinner size="lg" className="text-primary" />
          Calculando en el servidor…
        </div>
      </Panel>
    )
  }

  if (!resultado) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
          <span
            className={cn(
              "mb-1 flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-fuchsia-500/25",
              DEGRADADO_MARCA
            )}
          >
            <Destello className="size-6 [&_path]:fill-white" />
          </span>
          <p className="font-heading font-semibold text-foreground">
            Tu presupuesto aparecerá aquí
          </p>
          <p className="text-sm">
            Configura tu web y pulsa «Calcular presupuesto».
          </p>
        </div>
      </Panel>
    )
  }

  if (resultado.estado === 0) {
    return (
      <Panel>
        <div className="flex flex-col gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <IconoAnimado icono={HugeiconsServerCrashIcon} activo size={26} />
          </span>
          <p className="font-heading font-semibold">
            No se pudo conectar con la API
          </p>
          <p className="text-sm text-muted-foreground">
            Comprueba que está arrancada en <Codigo>{API_URL}</Codigo> con{" "}
            <Codigo>cd server &amp;&amp; npm start</Codigo>.
          </p>
        </div>
      </Panel>
    )
  }

  if (resultado.estado !== 200) {
    const { error, detalles = [] } = resultado.datos
    return (
      <Panel className="border-destructive/25">
        <div className="flex flex-col gap-4">
          <EstadoHttp codigo={resultado.estado} />
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <IconoAnimado icono={HugeiconsBadgeAlertIcon} activo size={20} />
            </span>
            <div>
              <BlurReveal
                as="p"
                speedReveal={3}
                className="font-heading font-semibold"
              >
                {error}
              </BlurReveal>
              <p className="text-sm text-muted-foreground">
                El servidor ha rechazado la solicitud y no ha calculado nada.
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {detalles.map((d) => (
              <li
                key={d}
                className="rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    )
  }

  const p = resultado.datos
  const lineas = [
    { concepto: "Precio base", importe: p.base },
    {
      concepto: "Páginas adicionales",
      detalle: tarifas
        ? `${p.paginasAdicionales / tarifas.paginaAdicional} × ${formatoEuros(tarifas.paginaAdicional)}`
        : null,
      importe: p.paginasAdicionales,
    },
    { concepto: "Formulario de contacto", importe: p.formulario },
    { concepto: "Segundo idioma", importe: p.segundoIdioma },
  ]

  return (
    <TiltCard tiltLimit={4} scale={1.01} className="rounded-3xl">
      <div {...propsHover}>
        <Panel className="overflow-hidden p-0">
          <div className="relative isolate flex flex-col gap-1 p-6 text-white">
            <AnimatedGradient config={DEGRADADO_TOTAL} />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-violet-100">
                <IconoAnimado
                  icono={HugeiconsReceiptEuroIcon}
                  activo={hover}
                  size={18}
                />
                Total presupuestado
              </span>
              <EstadoHttp codigo={200} sobreDegradado />
            </div>
            <SpecialText
              key={p.total}
              speed={25}
              className="h-auto! text-5xl leading-tight! font-bold tracking-tight"
            >
              {formatoEuros(p.total, p.moneda)}
            </SpecialText>
            <p className="flex items-center gap-2 text-xs text-violet-100/80">
              Sin impuestos
              <Destello className="size-2.5 [&_path]:fill-white/70" />
              {p.moneda}
            </p>
          </div>
          <ul className="flex flex-col divide-y px-6 py-2">
            {lineas.map(({ concepto, detalle, importe }) => (
              <li
                key={concepto}
                className={cn(
                  "flex items-baseline justify-between gap-4 py-3",
                  importe === 0 && "text-muted-foreground/70"
                )}
              >
                <span>
                  <span className="flex items-center gap-2">
                    {importe > 0 ? (
                      <HugeiconsCircleCheckIcon
                        size={16}
                        className="inline-flex text-primary"
                      />
                    ) : (
                      <Minus className="size-4" />
                    )}
                    {concepto}
                  </span>
                  {detalle && importe > 0 && (
                    <span className="ml-6 block text-xs text-muted-foreground">
                      {detalle}
                    </span>
                  )}
                </span>
                <span className="font-medium tabular-nums">
                  {formatoEuros(importe, p.moneda)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 border-t bg-primary/[0.03] px-6 py-4 text-xs text-muted-foreground">
            <Destello />
            Calculado por el servidor con sus tarifas
          </p>
        </Panel>
      </div>
    </TiltCard>
  )
}

function EstadoHttp({ codigo, sobreDegradado }) {
  const textos = {
    200: "OK",
    400: "Bad Request",
    404: "Not Found",
    500: "Internal Server Error",
  }
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[0.7rem] font-medium",
        sobreDegradado
          ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur ring-inset"
          : codigo === 200
            ? "bg-primary/10 text-primary"
            : "bg-destructive/10 text-destructive"
      )}
    >
      HTTP {codigo} {textos[codigo] ?? ""}
    </span>
  )
}

function Panel({ children, className }) {
  return <div className={cn(SUPERFICIE, "p-6", className)}>{children}</div>
}
