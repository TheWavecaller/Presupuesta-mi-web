"use client"
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
const sizeMap = {
  sm: "h-8 rounded-full gap-1.5 px-3 text-sm",
  default: "h-9 px-4 py-2 text-sm rounded-full",
  lg: "h-10 rounded-full px-6 text-sm",
}
const borderRadiusMap = {
  sm: 16,
  default: 18,
  lg: 20,
}
const FlowButton = React.forwardRef(
  (
    {
      children,
      size = "default",
      borderColor = "var(--rotating-border-color)",
      className,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef(null)
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })
    React.useImperativeHandle(ref, () => buttonRef.current)
    const Comp = asChild ? Slot : "button"
    React.useEffect(() => {
      if (buttonRef.current) {
        const { offsetWidth, offsetHeight } = buttonRef.current
        setDimensions({ width: offsetWidth, height: offsetHeight })
      }
    }, [children])
    const buttonSize = sizeMap[size]
    const radius = borderRadiusMap[size]
    const createRoundedRectPath = (w, h, r) => {
      return `M${r},0.5 H${w - r} A${r},${r} 0 0 1 ${w - 0.5},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h - 0.5} H${r} A${r},${r} 0 0 1 0.5,${h - r} V${r} A${r},${r} 0 0 1 ${r},0.5 Z`
    }
    return (
      <>
        <style>
          {`
            @keyframes dash-flow {
              to {
                stroke-dashoffset: -10;
              }
            }
          `}
        </style>
        <div className="group pointer-events-none relative inline-block">
          <div
            className="pointer-events-none absolute inset-[2px] z-10 opacity-0 transition-all duration-200 ease-out group-hover:inset-0 group-hover:opacity-100"
            style={{ borderRadius: `${radius}px` }}
          >
            <svg
              width={dimensions.width}
              height={dimensions.height}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              aria-hidden="true"
              preserveAspectRatio="none"
              className="pointer-events-none absolute top-0 left-0 h-full w-full"
            >
              <path
                d={createRoundedRectPath(
                  dimensions.width,
                  dimensions.height,
                  radius
                )}
                fill="none"
                stroke={borderColor}
                strokeWidth="1"
                strokeDasharray="6,4"
                strokeDashoffset="0"
                className="group-hover:animate-[dash-flow_1s_linear_infinite]"
              />
            </svg>
          </div>
          <Comp
            ref={buttonRef}
            className={cn(
              "pointer-events-auto relative z-0 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 bg-neutral-100 font-[550] whitespace-nowrap text-primary transition-colors hover:bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-muted/50 dark:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              buttonSize,
              className
            )}
            {...props}
          >
            {children}
          </Comp>
        </div>
      </>
    )
  }
)
FlowButton.displayName = "FlowButton"
export { FlowButton }
