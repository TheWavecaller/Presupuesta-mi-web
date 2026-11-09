"use client"

import * as React from "react"

import AnimatedGradient from "@/components/spell/animated-gradient"
import { ANILLOS_VERA } from "@/lib/simbolo-vera"
import { cn } from "@/lib/utils"

/* ─── Sistema visual compartido (calculadora y asistente) ────────────────── */

// Acento de la marca: degradado violeta → fucsia
export const DEGRADADO_MARCA = "bg-linear-to-br from-violet-600 to-fuchsia-600"
export const TEXTO_DEGRADADO =
  "bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-300 dark:to-fuchsia-300"

// Superficies de cristal: paneles grandes y piezas interiores
export const SUPERFICIE =
  "rounded-3xl border bg-card/75 shadow-xl shadow-violet-950/[0.04] backdrop-blur-xl dark:bg-card/60 dark:shadow-black/20"
export const PIEZA = "rounded-2xl border bg-card/80 dark:bg-card/50"

// Tarjeta seleccionable: borde degradado cuando está marcada
export const SELECCIONABLE =
  "group cursor-pointer rounded-2xl border bg-card/80 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-violet-500/10 has-checked:borde-degradado has-checked:shadow-lg has-checked:shadow-fuchsia-500/15 has-focus-visible:ring-3 has-focus-visible:ring-ring/40 dark:bg-card/50"

// Cápsula de estado (cristal con punto de color)
export const CAPSULA =
  "inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-sm font-medium backdrop-blur"

// Campos de texto
export const CAMPO =
  "w-full rounded-xl border bg-background/60 px-4 py-3 outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/30"
export const CAMPO_ERROR = "border-destructive ring-3 ring-destructive/20"

// Colores de las animaciones de Spell UI
export const COLORES_TITULO = [
  "#7c3aed",
  "#a855f7",
  "#c026d3",
  "#d946ef",
  "#8b5cf6",
]
export const DEGRADADO_TOTAL = {
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

export const formatoEuros = (importe, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(importe)

/* ─── Piezas ─────────────────────────────────────────────────────────────── */

// Símbolo de la marca: el anillo de V.E.R.A. con el degradado violeta → fucsia.
// Son trazos rellenos (fill), así que [&_path]:fill-white lo vuelve blanco.
export function SimboloVera({ className }) {
  const id = React.useId()
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("inline-block size-3.5 shrink-0", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      {ANILLOS_VERA.map(({ d, opacidad }) => (
        <path
          key={opacidad}
          fillRule="evenodd"
          fill={`url(#${id})`}
          opacity={opacidad}
          d={d}
        />
      ))}
    </svg>
  )
}

// Icono animado (icons-animated, colección Hugeicons) que se anima mientras `activo` es true,
// para que reaccione al pasar el ratón por todo su elemento y no solo por el icono
export function IconoAnimado({ icono: Icono, activo, size = 20, className }) {
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

export function useHover() {
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
export function BotonDegradado({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "relative isolate inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-7 font-heading font-semibold whitespace-nowrap text-white shadow-lg ring-1 shadow-fuchsia-500/25 ring-white/20 transition-all ring-inset hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/35 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      {...props}
    >
      <AnimatedGradient config={DEGRADADO_TOTAL} />
      {children}
    </button>
  )
}

// Botón secundario discreto
export function BotonSuave({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full border bg-card/80 px-4 text-sm font-medium transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Panel({ children, className }) {
  return <div className={cn(SUPERFICIE, "p-6", className)}>{children}</div>
}

export function Codigo({ children }) {
  return (
    <code className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[0.8em] text-primary">
      {children}
    </code>
  )
}

// Encabezado numerado de cada paso o bloque
export function Titulo({ numero, texto, error, as: Etiqueta = "legend" }) {
  return (
    <Etiqueta className="mb-3 flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold text-white shadow-md",
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
    </Etiqueta>
  )
}
