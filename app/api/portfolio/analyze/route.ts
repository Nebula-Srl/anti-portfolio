import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { PortfolioInfo } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Detect platform from URL
function detectPlatform(url: string): PortfolioInfo['source'] {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('linkedin.com')) return 'linkedin'
  if (lowerUrl.includes('github.com')) return 'github'
  if (lowerUrl.includes('behance.net')) return 'behance'
  return 'other'
}

// Extract username/identifier from URL
function extractIdentifier(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    // LinkedIn: /in/username
    if (url.includes('linkedin.com/in/')) {
      return pathParts[pathParts.indexOf('in') + 1] || null
    }
    
    // GitHub: /username
    if (url.includes('github.com')) {
      return pathParts[0] || null
    }
    
    // Behance: /username
    if (url.includes('behance.net')) {
      return pathParts[0] || null
    }
    
    return pathParts[0] || null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL richiesto' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL non valido' },
        { status: 400 }
      )
    }

    const platform = detectPlatform(url)
    const identifier = extractIdentifier(url)

    // Use GPT-4 to infer info from the URL
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Sei un assistente che analizza URL di portfolio professionali.
Data un URL di un profilo (LinkedIn, GitHub, Behance, etc.), estrai le informazioni che puoi dedurre o che conosci sul profilo.

IMPORTANTE: 
- Se l'URL contiene un username/identificatore, prova a dedurre info dal nome
- Se conosci informazioni pubbliche su quel profilo, includile
- NON inventare informazioni specifiche che non puoi verificare
- Indica sempre il livello di confidenza

Rispondi SOLO con JSON valido, senza markdown o altro testo.`
        },
        {
          role: 'user',
          content: `Analizza questo URL di portfolio: ${url}

Piattaforma rilevata: ${platform}
Identificatore/Username: ${identifier || 'non trovato'}

Restituisci un JSON con questa struttura:
{
  "name": "Nome se deducibile (es. da username come 'mario-rossi' → 'Mario Rossi')",
  "occupation": "Occupazione se nota o deducibile",
  "company": "Azienda se nota",
  "location": "Località se nota",
  "skills": ["skill1", "skill2"],
  "bio": "Breve descrizione se disponibile",
  "confidence": "high/medium/low"
}

Se non riesci a dedurre un campo, omettilo o metti null.`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const content = completion.choices[0]?.message?.content || '{}'
    
    let extractedInfo: Partial<PortfolioInfo>
    try {
      // Try to parse JSON, handling potential markdown code blocks
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\s*/g, '').replace(/```/g, '')
      }
      extractedInfo = JSON.parse(jsonStr)
    } catch {
      // If parsing fails, create minimal info
      extractedInfo = {
        confidence: 'low'
      }
    }

    const portfolioInfo: PortfolioInfo = {
      ...extractedInfo,
      source: platform,
      sourceUrl: url,
      confidence: extractedInfo.confidence || 'low'
    }

    return NextResponse.json({ 
      success: true,
      info: portfolioInfo
    })
  } catch (error) {
    console.error('Portfolio analysis error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'analisi del portfolio' },
      { status: 500 }
    )
  }
}

