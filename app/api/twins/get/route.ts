import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug richiesto' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    
    const { data: twin, error } = await supabase
      .from('twins')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .eq('is_public', true)
      .single()

    if (error || !twin) {
      return NextResponse.json(
        { error: 'Digital Twin non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ twin })
  } catch (error) {
    console.error('Get twin error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

