import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SLUG_REGEX } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const { slug } = await request.json()

    // Validate format
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Slug richiesto' },
        { status: 400 }
      )
    }

    const normalizedSlug = slug.toLowerCase().trim()

    // Check format
    if (!SLUG_REGEX.test(normalizedSlug)) {
      return NextResponse.json({
        valid: false,
        error: 'Lo slug deve contenere solo lettere minuscole, numeri e trattini (3-30 caratteri)'
      })
    }

    // Check reserved slugs
    const reservedSlugs = ['admin', 'api', 'create', 'login', 'signup', 'settings', 'help', 'about']
    if (reservedSlugs.includes(normalizedSlug)) {
      return NextResponse.json({
        valid: false,
        error: 'Questo nome è riservato. Scegline un altro.'
      })
    }

    // Check database uniqueness
    const supabase = createServerSupabaseClient()
    const { data: existing, error } = await supabase
      .from('twins')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { valid: false, error: 'Errore di verifica. Riprova.' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json({
        valid: false,
        error: 'Questo nome è già in uso. Scegline un altro.'
      })
    }

    return NextResponse.json({
      valid: true,
      slug: normalizedSlug
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Errore di validazione' },
      { status: 500 }
    )
  }
}

