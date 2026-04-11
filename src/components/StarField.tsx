import { useEffect, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

type ThemeMode = "light" | "dark" | "cyberpunk"

const THEME_CONFIG: Record<ThemeMode, {
  colors: string[]
  opacity: { min: number; max: number }
  size: { min: number; max: number }
  speed: number
  direction: string
  count: number
  links: boolean
  linkColor: string
  linkOpacity: number
}> = {
  light: {
    colors: ["#000000"],
    opacity: { min: 0.15, max: 0.45 },
    size: { min: 0.6, max: 1.6 },
    speed: 0.08,
    direction: "top",
    count: 200,
    links: false,
    linkColor: "#000",
    linkOpacity: 0,
  },
  dark: {
    colors: ["#ffffff"],
    opacity: { min: 0.1, max: 0.8 },
    size: { min: 0.5, max: 2 },
    speed: 0.15,
    direction: "none",
    count: 200,
    links: false,
    linkColor: "#fff",
    linkOpacity: 0,
  },
  cyberpunk: {
    colors: ["#00f0ff", "#ff2d95", "#f0e040", "#00f0ff", "#00f0ff"],
    opacity: { min: 0.2, max: 0.9 },
    size: { min: 0.5, max: 2.2 },
    speed: 0.3,
    direction: "none",
    count: 160,
    links: true,
    linkColor: "#00f0ff",
    linkOpacity: 0.04,
  },
}

export default function StarField() {
  const [ready, setReady] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>("dark")

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))

    const check = () => {
      const t = document.documentElement.dataset.theme as ThemeMode
      setTheme(t === "cyberpunk" ? "cyberpunk" : t === "light" ? "light" : "dark")
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  if (!ready) return null

  const cfg = THEME_CONFIG[theme]

  return (
    <Particles
      id="starfield"
      key={theme}
      options={{
        fullScreen: false,
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          number: {
            value: cfg.count,
            density: { enable: true, width: 1920, height: 1080 },
          },
          color: { value: cfg.colors },
          shape: { type: "circle" },
          opacity: {
            value: cfg.opacity,
            animation: {
              enable: true,
              speed: theme === "cyberpunk" ? 1.2 : 0.5,
              sync: false,
            },
          },
          size: {
            value: cfg.size,
          },
          move: {
            enable: true,
            speed: cfg.speed,
            direction: cfg.direction as any,
            random: true,
            straight: false,
            outModes: { default: "out" },
          },
          links: {
            enable: cfg.links,
            distance: 120,
            color: cfg.linkColor,
            opacity: cfg.linkOpacity,
            width: 0.5,
          },
        },
        detectRetina: true,
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  )
}
