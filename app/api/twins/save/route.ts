import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SLUG_REGEX } from '@/lib/constants'
import type { TwinProfile } from '@/lib/supabase/client'

interface SaveTwinRequest {
  slug: string
  displayName: string
  profile: TwinProfile
  transcript: string
}

export async function POST(request: Request) {
  try {
    const body: SaveTwinRequest = await request.json()
    const { slug, displayName, profile, transcript } = body

    // Validate required fields
    if (!slug || !displayName || !profile || !transcript) {
      return NextResponse.json(
        { error: 'Tutti i campi sono richiesti' },
        { status: 400 }
      )
    }

    // Validate slug format
    const normalizedSlug = slug.toLowerCase().trim()
    if (!SLUG_REGEX.test(normalizedSlug)) {
      return NextResponse.json(
        { error: 'Formato slug non valido' },
        { status: 400 }
      )
    }

    // Validate profile structure
    const requiredProfileFields = [
      'identity_summary',
      'thinking_patterns', 
      'methodology',
      'constraints',
      'proof_metrics',
      'style_tone',
      'do_not_say'
    ]

    for (const field of requiredProfileFields) {
      if (!(field in profile)) {
        return NextResponse.json(
          { error: `Campo profilo mancante: ${field}` },
          { status: 400 }
        )
      }
    }

    // Save to database
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('twins')
      .insert({
        slug: normalizedSlug,
        display_name: displayName,
        profile_json: profile,
        transcript: transcript,
        is_public: true
      })
      .select('id, slug')
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Questo slug è già in uso' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Errore nel salvataggio. Riprova.' },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return NextResponse.json({
      success: true,
      twin: {
        id: data.id,
        slug: data.slug,
        url: `${appUrl}/t/${data.slug}`
      }
    })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

