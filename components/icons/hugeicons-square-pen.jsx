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
const PEN_VARIANTS = {
  normal: {
    rotate: 0,
    x: 0,
    y: 0,
  },
  animate: {
    rotate: [-0.5, 0.5, -0.5],
    x: [0, -1, 1.5, 0],
    y: [0, 1.5, -1, 0],
  },
}
const HugeiconsSquarePenIcon = forwardRef(
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
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
          style={{ overflow: "visible" }}
        >
          <path
            d="M18.9921 13.5C18.9921 16.7875 18.9921 18.4312 18.0842 19.5376C17.918 19.7401 17.7322 19.9258 17.5297 20.092C16.4234 21 14.7796 21 11.4921 21H10.9922C7.22095 21 5.33535 21 4.16378 19.8284C2.99222 18.6569 2.99219 16.7712 2.99219 13V12.5C2.99219 9.21252 2.99219 7.56879 3.90013 6.46244C4.06636 6.2599 4.25208 6.07417 4.45463 5.90794C5.56098 5 7.20471 5 10.4922 5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <motion.path
            d="M7.99219 16L8.71615 13.1041C8.89023 12.4078 9.25026 11.772 9.75776 11.2644L16.4171 4.60509L17.4071 3.6151C18.2272 2.79497 19.557 2.79497 20.3771 3.6151C21.1972 4.43524 21.1972 5.76493 20.3771 6.58507L19.3871 7.57506L12.7277 14.2344C12.2202 14.7419 11.5843 15.102 10.888 15.276L7.99219 16Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
            animate={reduceDefinition(controls)}
            variants={PEN_VARIANTS}
          />
        </svg>
      </div>
    )
  }
)
HugeiconsSquarePenIcon.displayName = "HugeiconsSquarePenIcon"
export { HugeiconsSquarePenIcon }
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
