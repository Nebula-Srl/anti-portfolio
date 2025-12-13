'use client'

import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  isActive: boolean
  isSpeaking: boolean
  size?: number
}

export function AudioVisualizer({ 
  isActive, 
  isSpeaking, 
  size = 150 
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const baseRadius = size * 0.3

    function draw() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, size, size)

      if (!isActive) {
        // Inactive state - static circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
        ctx.fill()
        return
      }

      phaseRef.current += 0.05

      // Draw multiple layers of circles with wave effect
      const layers = isSpeaking ? 4 : 2
      const intensity = isSpeaking ? 1 : 0.5

      for (let layer = layers; layer >= 0; layer--) {
        const layerOffset = layer * 0.3
        const waveAmplitude = (isSpeaking ? 15 : 5) * intensity
        const points = 64

        ctx.beginPath()

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2
          const wave = Math.sin(angle * 3 + phaseRef.current + layerOffset) * waveAmplitude
          const wave2 = Math.cos(angle * 5 + phaseRef.current * 1.5) * (waveAmplitude * 0.5)
          const r = baseRadius + wave + wave2 + (layer * 8)

          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()

        // Gradient based on state
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, baseRadius + 50
        )

        if (isSpeaking) {
          // Active speaking - cyan/blue gradient
          const alpha = 0.3 - (layer * 0.06)
          gradient.addColorStop(0, `rgba(34, 211, 238, ${alpha})`)
          gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.8})`)
          gradient.addColorStop(1, `rgba(139, 92, 246, ${alpha * 0.4})`)
        } else {
          // Listening - subtle green pulse
          const alpha = 0.2 - (layer * 0.04)
          gradient.addColorStop(0, `rgba(74, 222, 128, ${alpha})`)
          gradient.addColorStop(1, `rgba(34, 197, 94, ${alpha * 0.5})`)
        }

        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Center glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 0.8
      )
      
      if (isSpeaking) {
        glowGradient.addColorStop(0, 'rgba(34, 211, 238, 0.6)')
        glowGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)')
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
      } else {
        glowGradient.addColorStop(0, 'rgba(74, 222, 128, 0.4)')
        glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
      }

      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = glowGradient
      ctx.fill()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isSpeaking, size])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
      />
      {/* Outer ring */}
      <div 
        className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 ${
          !isActive 
            ? 'border-muted' 
            : isSpeaking 
              ? 'border-cyan-500/50' 
              : 'border-green-500/50'
        }`}
        style={{ width: size, height: size }}
      />
    </div>
  )
}

