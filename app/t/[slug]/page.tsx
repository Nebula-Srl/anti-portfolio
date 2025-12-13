import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TwinConversation } from './twin-conversation'
import type { Twin } from '@/lib/supabase/client'

interface TwinPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getTwin(slug: string): Promise<Twin | null> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('twins')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_public', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as Twin
}

export default async function TwinPage({ params }: TwinPageProps) {
  const { slug } = await params
  const twin = await getTwin(slug)

  if (!twin) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-radial-gradient">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {twin.display_name}
          </h1>
          <p className="text-muted-foreground">
            Digital Twin
          </p>
        </div>

        {/* Twin Conversation Component */}
        <TwinConversation twin={twin} />
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: TwinPageProps) {
  const { slug } = await params
  const twin = await getTwin(slug)

  if (!twin) {
    return {
      title: 'Twin non trovato',
    }
  }

  return {
    title: `${twin.display_name} - Digital Twin`,
    description: `Parla con il Digital Twin di ${twin.display_name}`,
  }
}

