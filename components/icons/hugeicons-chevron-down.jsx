"use client"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { getDefaultValueType, setTarget, visualElementStore } from "motion"
import { motion, useAnimation } from "motion/react"
import { cn } from "@/lib/utils"
const DEFAULT_TRANSITION = {
  times: [0, 0.4, 1],
  duration: 0.5,
}
const HugeiconsChevronDownIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)
    const {
      rootRef: iconRootRef,
      reduceDefinition,
      ...iconAccessibility
    } = useIconAccessibility(ref, () => {
      isControlledRef.current = ref != null
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      }
    }, [controls])
    const handleMouseEnter = useCallback(
      (e) => {
        if (isControlledRef.current) {
          void e
        } else {
          controls.start("animate")
        }
      },
      [controls]
    )
    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlledRef.current) {
          void e
        } else {
          controls.start("normal")
        }
      },
      [controls]
    )
    return (
      <div
        className={cn(className)}
        {...props}
        ref={iconRootRef}
        onMouseEnter={(event) => {
          if (!iconAccessibility.controlled && !iconAccessibility.reduced) {
            handleMouseEnter(event)
          }
          onMouseEnter?.(event)
        }}
        onMouseLeave={(event) => {
          if (!iconAccessibility.controlled) {
            handleMouseLeave(event)
          }
          onMouseLeave?.(event)
        }}
        onFocus={(event) => {
          if (!iconAccessibility.controlled && !iconAccessibility.reduced) {
            iconAccessibility.startAnimation()
          }
          props.onFocus?.(event)
        }}
        onBlur={(event) => {
          if (!iconAccessibility.controlled) {
            iconAccessibility.stopAnimation()
          }
          props.onBlur?.(event)
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M6 9L12 15L18 9"
            animate={reduceDefinition(controls)}
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { y: 0 },
              animate: { y: [0, 2, 0] },
            }}
          />
        </svg>
      </div>
    )
  }
)
HugeiconsChevronDownIcon.displayName = "HugeiconsChevronDownIcon"
export { HugeiconsChevronDownIcon }
function useIconAccessibility(ref, createHandle, controllers) {
  const rawHandle = createHandle()
  const raw = useRef(rawHandle)
  useEffect(() => {
    raw.current = rawHandle
  }, [rawHandle])
  const controls = useRef(controllers)
  const rootRef = useRef(null)
  const preference = useRef(false)
  const mounted = useRef(true)
  const [reduced, setReduced] = useState(false)
  const api = useMemo(
    () => ({
      startAnimation() {
        if (
          mounted.current &&
          !preference.current &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          void raw.current.startAnimation()
        }
      },
      stopAnimation() {
        if (mounted.current) void raw.current.stopAnimation()
      },
    }),
    []
  )
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => {
    mounted.current = true
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const snapshots = []
    rootRef.current?.querySelectorAll("svg, svg *").forEach((element) => {
      const visual = visualElementStore.get(element)
      if (visual)
        snapshots.push({
          visual,
          values: { ...visual.latestValues },
          attributes: Object.fromEntries(
            [...element.attributes].map((attribute) => [
              attribute.name,
              attribute.value,
            ])
          ),
        })
    })
    const restore = () => {
      for (const snapshot of snapshots) {
        const { visual, values, attributes } = snapshot
        visual.values.forEach((value) => value.stop())
        const props = visual.getProps()
        const reset = {}
        visual.values.forEach((_motionValue, key) => {
          const attribute = key.replace(
            /[A-Z]/g,
            (letter) => "-" + letter.toLowerCase()
          )
          const defaults = {
            opacity: 1,
            pathLength: 1,
            pathSpacing: 1,
            pathOffset: 0,
            strokeDashoffset: 0,
          }
          const value =
            values[key] ??
            props.style?.[key] ??
            props[key] ??
            getDefaultValueType(key)?.default ??
            defaults[key] ??
            attributes[attribute]
          if (typeof value === "number" || typeof value === "string")
            reset[key] = value
        })
        setTarget(visual, reset)
        visual.render()
      }
    }
    const activeControls = controls.current
    const originals = activeControls.map((control) => {
      const original = control.start
      control.start = (definition, transition) => {
        if (!mounted.current) return new Promise(() => {})
        if (preference.current) {
          control.set(definition)
          return Promise.resolve()
        }
        return original(definition, transition)
      }
      return original
    })
    const change = () => {
      preference.current = media.matches
      setReduced(media.matches)
      if (media.matches) {
        void raw.current.stopAnimation()
        activeControls.forEach((control) => control.stop())
        restore()
      }
    }
    change()
    media.addEventListener("change", change)
    return () => {
      mounted.current = false
      media.removeEventListener("change", change)
      activeControls.forEach((control, index) => {
        control.stop()
        control.start = originals[index]
      })
    }
  }, [])
  return {
    ...api,
    rootRef,
    controlled: ref != null,
    reduced,
    reduceDefinition(definition) {
      if (
        reduced &&
        definition &&
        typeof definition === "object" &&
        !Array.isArray(definition) &&
        !("start" in definition)
      ) {
        return {
          ...definition,
          transition: { type: false, duration: 0, delay: 0, repeat: 0 },
        }
      }
      return definition
    },
  }
}
