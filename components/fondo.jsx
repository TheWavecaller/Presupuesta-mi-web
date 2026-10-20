import { cn } from "@/lib/utils"

// Estrellas de cuatro puntas repartidas por el fondo: posición, tamaño y retardo del destello
const ESTRELLAS = [
  { top: "9%", left: "8%", size: 18, delay: "0s" },
  { top: "16%", left: "88%", size: 26, delay: "1.2s" },
  { top: "34%", left: "4%", size: 12, delay: "2.4s" },
  { top: "27%", left: "62%", size: 10, delay: "0.6s" },
  { top: "52%", left: "95%", size: 14, delay: "3s" },
  { top: "68%", left: "11%", size: 22, delay: "1.8s" },
  { top: "82%", left: "78%", size: 16, delay: "0.9s" },
  { top: "92%", left: "40%", size: 10, delay: "2.1s" },
  { top: "6%", left: "46%", size: 12, delay: "3.6s" },
]

const PUNTA = "M12 0C12.7 6.4 17.6 11.3 24 12C17.6 12.7 12.7 17.6 12 24C11.3 17.6 6.4 12.7 0 12C6.4 11.3 11.3 6.4 12 0Z"

// Textura de grano (SVG con ruido) para dar profundidad a los degradados
const GRANO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Fondo() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Auroras que se desplazan lentamente */}
      <div className="animate-deriva-1 absolute -top-[30%] left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 rounded-full bg-linear-to-r from-violet-600/35 via-fuchsia-500/30 to-purple-600/35 blur-[120px] dark:from-violet-600/30 dark:via-fuchsia-600/25 dark:to-indigo-600/30" />
      <div className="animate-deriva-2 absolute top-[30%] -right-[15%] h-[55vh] w-[45vw] rounded-full bg-fuchsia-500/25 blur-[110px] dark:bg-fuchsia-600/20" />
      <div className="animate-deriva-3 absolute -bottom-[15%] -left-[15%] h-[60vh] w-[50vw] rounded-full bg-violet-600/25 blur-[120px] dark:bg-violet-700/25" />
      <div className="animate-deriva-2 absolute top-[55%] left-[30%] h-[35vh] w-[30vw] rounded-full bg-indigo-500/15 blur-[100px] [animation-delay:-8s]" />

      {/* Rejilla de puntos que se desvanece hacia abajo */}
      <div
        className="absolute inset-0 text-violet-500/25 dark:text-violet-300/15"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%)",
        }}
      />

      {/* Estrellas que titilan */}
      {ESTRELLAS.map(({ top, left, size, delay }) => (
        <svg
          key={`${top}-${left}`}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className="animate-titilar absolute drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]"
          style={{ top, left, animationDelay: delay }}
        >
          <defs>
            <linearGradient id={`estrella-${top}-${left}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
          </defs>
          <path d={PUNTA} fill={`url(#estrella-${top}-${left})`} />
        </svg>
      ))}

      {/* Grano sutil */}
      <div
        className={cn("absolute inset-0 opacity-[0.06] mix-blend-overlay dark:opacity-[0.08]")}
        style={{ backgroundImage: GRANO }}
      />
    </div>
  )
}
