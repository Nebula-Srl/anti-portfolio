import { NextResponse } from 'next/server'
import { OPENAI_REALTIME_MODEL } from '@/lib/constants'

// Rate limiting with in-memory store (for MVP - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function GET(request: Request) {
  try {
    // Basic rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra un minuto.' },
        { status: 429 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured')
      return NextResponse.json(
        { error: 'Servizio non configurato' },
        { status: 500 }
      )
    }

    // Create ephemeral token for Realtime API
    // The OpenAI Realtime API uses the main API key directly for WebRTC connections
    // In production, you might want to use session-specific tokens
    
    // For the Realtime API via WebRTC, we pass the API key directly
    // The client will use it to establish the WebRTC connection
    return NextResponse.json({
      token: apiKey,
      model: OPENAI_REALTIME_MODEL,
      expiresAt: Date.now() + 3600000 // 1 hour
    })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

