"use client"

import * as React from "react"

import { Asistente } from "@/components/asistente"
import { Fondo } from "@/components/fondo"
import {
  CAPSULA,
  COLORES_TITULO,
  SimboloVera,
  TEXTO_DEGRADADO,
} from "@/components/marca"
import { Presupuestador } from "@/components/presupuestador"
import { GradientWaveText } from "@/components/spell/gradient-wave-text"
import { WordsStagger } from "@/components/spell/words-stagger"
import { cn } from "@/lib/utils"

const PESTANAS = [
  {
    id: "asistente",
    nombre: "Asistente con IA",
    lema: "Cuéntanos qué necesitas: la IA propone los servicios y el servidor calcula el presupuesto.",
  },
  {
    id: "calculadora",
    nombre: "Calculadora",
    lema: "Elige cómo quieres tu web y el servidor calculará el presupuesto con sus propias tarifas.",
  },
]

export function Inicio() {
  const [pestana, setPestana] = React.useState("asistente")
  const actual = PESTANAS.find((p) => p.id === pestana)

  return (
    <div className="relative isolate min-h-svh">
      <Fondo />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-3">
            <p
              className={cn(
                CAPSULA,
                "gap-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.2em] uppercase"
              )}
            >
              <span className={TEXTO_DEGRADADO}>Agencia</span>
              <SimboloVera />
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
              key={pestana}
              delay={0.1}
              stagger={0.03}
              className="max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              {actual.lema}
            </WordsStagger>
          </div>

          <div
            role="tablist"
            aria-label="Modo"
            className="inline-flex self-start rounded-full border bg-card/70 p-1 backdrop-blur"
          >
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={pestana === p.id}
                onClick={() => setPestana(p.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  pestana === p.id
                    ? "bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </header>

        {/* Ambas se mantienen montadas para no perder lo escrito al cambiar de pestaña */}
        <div hidden={pestana !== "asistente"}>
          <Asistente />
        </div>
        <div hidden={pestana !== "calculadora"}>
          <Presupuestador />
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>0613 Desarrollo web en entorno servidor</span>
          <SimboloVera />
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
