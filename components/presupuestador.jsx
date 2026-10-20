"use client"

import * as React from "react"
import {
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Code,
  Languages,
  LoaderCircle,
  Mail,
  Minus,
  Plus,
  Rocket,
  ServerCrash,
  TriangleAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { API_URL, obtenerTarifas, pedirPresupuesto } from "@/lib/api"
import { cn } from "@/lib/utils"

const INICIAL = { tipo: "corporativa", paginas: "4", formulario: true, segundoIdioma: false }

const TIPOS = [
  { id: "landing", nombre: "Landing", descripcion: "Una página para presentar un producto o campaña", Icono: Rocket },
  { id: "corporativa", nombre: "Corporativa", descripcion: "Web de empresa con varias secciones", Icono: Building2 },
]

const EXTRAS = [
  { id: "formulario", nombre: "Formulario de contacto", Icono: Mail },
  { id: "segundoIdioma", nombre: "Segundo idioma", Icono: Languages },
]

const formatoEuros = (importe, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(importe)

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

export function Presupuestador() {
  const [tarifas, setTarifas] = React.useState(null)
  const [estadoApi, setEstadoApi] = React.useState("cargando") // cargando | ok | caida
  const [form, setForm] = React.useState(INICIAL)
  const [modoJson, setModoJson] = React.useState(false)
  const [jsonTexto, setJsonTexto] = React.useState("")
  const [enviando, setEnviando] = React.useState(false)
  const [resultado, setResultado] = React.useState(null)

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
  const camposConError = resultado?.estado === 400 ? resultado.datos.campos ?? [] : []

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
      const cuerpo = modoJson ? jsonTexto : JSON.stringify(solicitud)
      setResultado(await pedirPresupuesto(cuerpo))
    } catch {
      setResultado({ estado: 0 })
    } finally {
      setEnviando(false)
    }
  }

  const paginasNumero = Number(form.paginas)
  const paginasEnRango = Number.isInteger(paginasNumero) && paginasNumero >= 1 && paginasNumero <= 20

  return (
    <div className="min-h-svh bg-linear-to-b from-violet-500/10 via-transparent to-transparent">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase dark:text-violet-400">
              Agencia · Presupuestos web
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Presupuesta mi web</h1>
            <p className="max-w-xl text-muted-foreground">
              Elige cómo quieres tu web y el servidor calculará el presupuesto con sus propias tarifas.
            </p>
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
            className="flex flex-col gap-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-8"
          >
            {modoJson ? (
              <section className="flex flex-col gap-3">
                <Titulo numero="{ }" texto="Petición JSON" />
                <p className="text-sm text-muted-foreground">
                  Edita el cuerpo a mano para probar entradas inválidas: <code>&quot;paginas&quot;: 0</code>,{" "}
                  <code>&quot;tipo&quot;: &quot;tienda&quot;</code>, <code>&quot;formulario&quot;: &quot;false&quot;</code>…
                </p>
                <textarea
                  value={jsonTexto}
                  onChange={(e) => {
                    setJsonTexto(e.target.value)
                    setResultado(null)
                  }}
                  spellCheck={false}
                  rows={8}
                  className="w-full rounded-xl border bg-muted/40 p-4 font-mono text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </section>
            ) : (
              <>
                <fieldset className="flex flex-col gap-3">
                  <Titulo numero="1" texto="Tipo de web" error={camposConError.includes("tipo")} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TIPOS.map(({ id, nombre, descripcion, Icono }) => (
                      <label
                        key={id}
                        className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-colors hover:bg-muted/50 has-checked:border-violet-500 has-checked:bg-violet-500/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                      >
                        <input
                          type="radio"
                          name="tipo"
                          value={id}
                          checked={form.tipo === id}
                          onChange={() => cambiar("tipo", id)}
                          className="peer sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground group-has-checked:bg-violet-500 group-has-checked:text-white">
                            <Icono className="size-5" />
                          </span>
                          <Precio importe={tarifas?.[id]} />
                        </div>
                        <div>
                          <p className="font-semibold">{nombre}</p>
                          <p className="text-sm text-muted-foreground">{descripcion}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3">
                  <Titulo numero="2" texto="Número de páginas" error={camposConError.includes("paginas")} />
                  <div className="flex flex-col gap-4 rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label="Quitar una página"
                        onClick={() => cambiar("paginas", String((paginasEnRango ? paginasNumero : 2) - 1))}
                      >
                        <Minus />
                      </Button>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        aria-label="Páginas"
                        value={form.paginas}
                        onChange={(e) => cambiar("paginas", e.target.value)}
                        className={cn(
                          "h-12 w-24 rounded-lg border bg-background text-center text-2xl font-bold tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
                          camposConError.includes("paginas") && "border-destructive ring-3 ring-destructive/20"
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label="Añadir una página"
                        onClick={() => cambiar("paginas", String((paginasEnRango ? paginasNumero : 0) + 1))}
                      >
                        <Plus />
                      </Button>
                      <p className="ml-auto text-right text-sm text-muted-foreground">
                        La primera va incluida.
                        <br />
                        Cada adicional: <Precio importe={tarifas?.paginaAdicional} prefijo="+" />
                      </p>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      aria-label="Páginas (deslizador)"
                      value={paginasEnRango ? paginasNumero : 1}
                      onChange={(e) => cambiar("paginas", e.target.value)}
                      className="w-full accent-violet-500"
                    />
                    <div className="-mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>20</span>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3">
                  <Titulo
                    numero="3"
                    texto="Extras"
                    error={camposConError.includes("formulario") || camposConError.includes("segundoIdioma")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {EXTRAS.map(({ id, nombre, Icono }) => (
                      <label
                        key={id}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors hover:bg-muted/50 has-checked:border-violet-500 has-checked:bg-violet-500/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                      >
                        <input
                          type="checkbox"
                          checked={form[id]}
                          onChange={(e) => cambiar(id, e.target.checked)}
                          className="sr-only"
                        />
                        <Icono className="size-5 shrink-0 text-muted-foreground group-has-checked:text-violet-500" />
                        <span className="flex-1">
                          <span className="block font-medium">{nombre}</span>
                          <Precio importe={tarifas?.[id]} prefijo="+" className="text-sm text-muted-foreground" />
                        </span>
                        <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted transition-colors group-has-checked:bg-violet-500">
                          <span className="absolute top-1 left-1 size-4 rounded-full bg-background shadow transition-transform group-has-checked:translate-x-5" />
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={alternarModoJson}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Code className="size-4" />
                {modoJson ? "Volver al formulario" : "Editar la petición JSON"}
              </button>
              <Button
                type="submit"
                disabled={enviando}
                className="h-12 bg-violet-600 px-6 text-base text-white hover:bg-violet-700"
              >
                {enviando ? <LoaderCircle className="animate-spin" /> : <Calculator />}
                Calcular presupuesto
              </Button>
            </div>

            {!modoJson && (
              <details className="group -mt-4 rounded-xl bg-muted/40 text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-muted-foreground">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  Ver lo que se envía: <code>POST {API_URL}/api/presupuesto</code>
                </summary>
                <pre className="overflow-x-auto px-4 pb-4 font-mono text-xs">{JSON.stringify(solicitud, null, 2)}</pre>
              </details>
            )}
          </form>

          <aside className="lg:sticky lg:top-6">
            <Resultado resultado={resultado} enviando={enviando} tarifas={tarifas} />
          </aside>
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          0613 · Desarrollo web en entorno servidor · Pulsa <kbd>d</kbd> para modo oscuro
        </footer>
      </main>
    </div>
  )
}

function Titulo({ numero, texto, error }) {
  return (
    <legend className="mb-3 flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background",
          error && "bg-destructive text-white"
        )}
      >
        {numero}
      </span>
      <span className="text-lg font-semibold">{texto}</span>
      {error && <TriangleAlert className="size-4 text-destructive" />}
    </legend>
  )
}

function Precio({ importe, prefijo = "", className }) {
  if (importe === undefined) return <span className={cn("text-muted-foreground", className)}>— €</span>
  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {prefijo}
      {formatoEuros(importe)}
    </span>
  )
}

function EstadoApi({ estado, onReintentar }) {
  if (estado === "caida") {
    return (
      <button
        onClick={onReintentar}
        className="inline-flex items-center gap-2 self-start rounded-full bg-destructive/10 px-3 py-1.5 text-sm text-destructive sm:self-auto"
      >
        <span className="size-2 rounded-full bg-destructive" />
        API desconectada · reintentar
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm text-muted-foreground sm:self-auto">
      <span
        className={cn("size-2 rounded-full", estado === "ok" ? "bg-emerald-500" : "animate-pulse bg-amber-500")}
      />
      {estado === "ok" ? "API conectada" : "Conectando con la API…"}
    </span>
  )
}

function Resultado({ resultado, enviando, tarifas }) {
  if (enviando) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <LoaderCircle className="size-8 animate-spin" />
          Calculando en el servidor…
        </div>
      </Panel>
    )
  }

  if (!resultado) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Calculator className="size-6" />
          </span>
          <p className="font-medium text-foreground">Tu presupuesto aparecerá aquí</p>
          <p className="text-sm">Configura tu web y pulsa «Calcular presupuesto».</p>
        </div>
      </Panel>
    )
  }

  if (resultado.estado === 0) {
    return (
      <Panel>
        <div className="flex flex-col gap-3">
          <ServerCrash className="size-8 text-destructive" />
          <p className="font-semibold">No se pudo conectar con la API</p>
          <p className="text-sm text-muted-foreground">
            Comprueba que está arrancada en <code>{API_URL}</code> con <code>cd server &amp;&amp; npm start</code>.
          </p>
        </div>
      </Panel>
    )
  }

  if (resultado.estado !== 200) {
    const { error, detalles = [] } = resultado.datos
    return (
      <Panel className="border-destructive/40">
        <div className="flex flex-col gap-4">
          <EstadoHttp codigo={resultado.estado} />
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-sm text-muted-foreground">El servidor ha rechazado la solicitud y no ha calculado nada.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {detalles.map((d) => (
              <li key={d} className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
      detalle: tarifas ? `${p.paginasAdicionales / tarifas.paginaAdicional} × ${formatoEuros(tarifas.paginaAdicional)}` : null,
      importe: p.paginasAdicionales,
    },
    { concepto: "Formulario de contacto", importe: p.formulario },
    { concepto: "Segundo idioma", importe: p.segundoIdioma },
  ]

  return (
    <Panel className="overflow-hidden p-0 sm:p-0">
      <div className="flex flex-col gap-1 bg-violet-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm text-violet-100">Total presupuestado</span>
          <EstadoHttp codigo={200} claro />
        </div>
        <p className="text-5xl font-bold tracking-tight tabular-nums">{formatoEuros(p.total, p.moneda)}</p>
        <p className="text-xs text-violet-200">Sin impuestos · {p.moneda}</p>
      </div>
      <ul className="flex flex-col divide-y px-6 py-2">
        {lineas.map(({ concepto, detalle, importe }) => (
          <li key={concepto} className={cn("flex items-baseline justify-between gap-4 py-3", importe === 0 && "text-muted-foreground")}>
            <span>
              <span className="flex items-center gap-2">
                {importe > 0 ? <Check className="size-4 text-emerald-500" /> : <Minus className="size-4" />}
                {concepto}
              </span>
              {detalle && importe > 0 && <span className="ml-6 block text-xs text-muted-foreground">{detalle}</span>}
            </span>
            <span className="font-medium tabular-nums">{formatoEuros(importe, p.moneda)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 border-t px-6 py-4 text-xs text-muted-foreground">
        <Calculator className="size-3.5" />
        Calculado por el servidor con sus tarifas
      </p>
    </Panel>
  )
}

function EstadoHttp({ codigo, claro }) {
  const textos = { 200: "OK", 400: "Bad Request", 404: "Not Found", 500: "Internal Server Error" }
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs font-semibold",
        claro ? "bg-white/15 text-white" : codigo === 200 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
      )}
    >
      HTTP {codigo} {textos[codigo] ?? ""}
    </span>
  )
}

function Panel({ children, className }) {
  return <div className={cn("rounded-2xl border bg-card p-6 shadow-sm", className)}>{children}</div>
}
