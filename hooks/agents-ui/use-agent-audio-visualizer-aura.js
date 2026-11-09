import { useEffect, useRef, useState, useCallback } from "react"
import { animate, useMotionValue, useMotionValueEvent } from "motion/react"

// Adaptado para este proyecto: el agente solo escribe, así que no hay pista de
// audio de LiveKit. Se ha quitado useTrackVolume (@livekit/components-react): el
// volumen (0-1) llega por parámetro, simulado mientras el agente «habla».
// La velocidad se deriva del estado en vez de guardarse con useState en un efecto.

const DEFAULT_SPEED = 10
const DEFAULT_AMPLITUDE = 2
const DEFAULT_FREQUENCY = 0.5
const DEFAULT_SCALE = 0.2
const DEFAULT_BRIGHTNESS = 1.5
const DEFAULT_TRANSITION = { duration: 0.5, ease: "easeOut" }
const DEFAULT_PULSE_TRANSITION = {
  duration: 0.35,
  ease: "easeOut",
  repeat: Infinity,
  repeatType: "mirror",
}

function useAnimatedValue(initialValue) {
  const [value, setValue] = useState(initialValue)
  const motionValue = useMotionValue(initialValue)
  const controlsRef = useRef(null)
  useMotionValueEvent(motionValue, "change", (value) => setValue(value))

  const animateFn = useCallback(
    (targetValue, transition) => {
      controlsRef.current = animate(motionValue, targetValue, transition)
    },
    [motionValue]
  )

  return { value, motionValue, controls: controlsRef, animate: animateFn }
}

function velocidadPara(state) {
  switch (state) {
    case "listening":
    case "pre-connect-buffering":
      return 20
    case "thinking":
    case "connecting":
    case "initializing":
      return 30
    case "speaking":
      return 70
    default:
      return DEFAULT_SPEED
  }
}

export function useAgentAudioVisualizerAura(state, volume = 0) {
  const speed = velocidadPara(state)
  const {
    value: scale,
    animate: animateScale,
    motionValue: scaleMotionValue,
  } = useAnimatedValue(DEFAULT_SCALE)
  const { value: amplitude, animate: animateAmplitude } =
    useAnimatedValue(DEFAULT_AMPLITUDE)
  const { value: frequency, animate: animateFrequency } =
    useAnimatedValue(DEFAULT_FREQUENCY)
  const { value: brightness, animate: animateBrightness } =
    useAnimatedValue(DEFAULT_BRIGHTNESS)

  useEffect(() => {
    switch (state) {
      case "idle":
      case "failed":
      case "disconnected":
        animateScale(0.2, DEFAULT_TRANSITION)
        animateAmplitude(1.2, DEFAULT_TRANSITION)
        animateFrequency(0.4, DEFAULT_TRANSITION)
        animateBrightness(1.0, DEFAULT_TRANSITION)
        return
      case "listening":
      case "pre-connect-buffering":
        animateScale(0.3, { type: "spring", duration: 1.0, bounce: 0.35 })
        animateAmplitude(1.0, DEFAULT_TRANSITION)
        animateFrequency(0.7, DEFAULT_TRANSITION)
        animateBrightness([1.5, 2.0], DEFAULT_PULSE_TRANSITION)
        return
      case "thinking":
      case "connecting":
      case "initializing":
        animateScale(0.3, DEFAULT_TRANSITION)
        animateAmplitude(0.5, DEFAULT_TRANSITION)
        animateFrequency(1, DEFAULT_TRANSITION)
        animateBrightness([0.5, 2.5], DEFAULT_PULSE_TRANSITION)
        return
      case "speaking":
        animateScale(0.3, DEFAULT_TRANSITION)
        animateAmplitude(0.75, DEFAULT_TRANSITION)
        animateFrequency(1.25, DEFAULT_TRANSITION)
        animateBrightness(1.5, DEFAULT_TRANSITION)
        return
    }
  }, [
    state,
    animateScale,
    animateAmplitude,
    animateFrequency,
    animateBrightness,
  ])

  useEffect(() => {
    if (state === "speaking" && volume > 0 && !scaleMotionValue.isAnimating()) {
      animateScale(0.2 + 0.2 * volume, { duration: 0 })
    }
  }, [
    state,
    volume,
    scaleMotionValue,
    animateScale,
    animateAmplitude,
    animateFrequency,
    animateBrightness,
  ])

  return {
    speed,
    scale,
    amplitude,
    frequency,
    brightness,
  }
}
