import { useRef, useEffect } from 'react'

export function StaticGrid() {
  const cvs = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = cvs.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const COLS = 24, ROWS = 16
    const cw = canvas.width, ch = canvas.height
    const cW = cw / COLS, cH = ch / ROWS

    ctx.clearRect(0, 0, cw, ch)

    // Horizontal
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      for (let c = 0; c <= COLS; c++) {
        ctx.strokeStyle = 'rgba(80,80,80,0.25)'
        ctx.lineWidth = 0.6
        const x = c * cW, y = r * cH
        c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Vertical
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      for (let r = 0; r <= ROWS; r++) {
        ctx.strokeStyle = 'rgba(70,70,70,0.2)'
        ctx.lineWidth = 0.5
        const x = c * cW, y = r * cH
        r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    return () => window.removeEventListener('resize', resize)
  }, [])

  return <canvas ref={cvs} className="wavy-grid-canvas" style={{ opacity: 0.4 }} />
}
