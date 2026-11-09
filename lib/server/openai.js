import "server-only"

import OpenAI from "openai"

import { ErrorIA } from "@/server/src/propuesta"

// Modelo configurable sin tocar el código (OPENAI_MODEL en .env.local o en Vercel)
const MODELO = process.env.OPENAI_MODEL || "gpt-5.4-mini"

let cliente = null

function obtenerCliente() {
  // La clave solo existe en el servidor: nunca lleva el prefijo NEXT_PUBLIC_
  if (!process.env.OPENAI_API_KEY) {
    throw new ErrorIA(
      "configuracion",
      "Falta la variable de entorno OPENAI_API_KEY en el servidor"
    )
  }
  cliente ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30_000, // ms: si OpenAI no responde, se informa al usuario
    maxRetries: 1,
  })
  return cliente
}

/**
 * Llama a la Responses API de OpenAI con salida estructurada (JSON Schema
 * estricto) y devuelve el texto JSON generado.
 */
export async function pedirAOpenAI({
  instrucciones,
  entrada,
  esquema,
  nombre = "propuesta_servicios",
  // 0.2 por defecto: elegir servicios es una clasificación, no un texto creativo
  temperatura = 0.2,
}) {
  const respuesta = await obtenerCliente().responses.create({
    model: MODELO,
    instructions: instrucciones,
    input: entrada,
    temperature: temperatura,
    max_output_tokens: 1500,
    store: false, // no guardar la conversación en OpenAI
    text: {
      format: {
        type: "json_schema",
        name: nombre,
        schema: esquema,
        strict: true,
      },
    },
  })

  if (respuesta.status === "incomplete") {
    throw new ErrorIA(
      "respuesta_invalida",
      `La IA no terminó la respuesta (${respuesta.incomplete_details?.reason ?? "motivo desconocido"})`
    )
  }
  const rechazo = respuesta.output
    ?.flatMap((item) => item.content ?? [])
    .find((c) => c.type === "refusal")
  if (rechazo) {
    throw new ErrorIA("respuesta_invalida", "La IA rechazó la solicitud")
  }
  return respuesta.output_text
}
