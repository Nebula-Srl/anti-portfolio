'use client'

import { useMemo } from 'react'
import { VoiceAgent } from '@/components/voice-agent'
import { Card, CardContent } from '@/components/ui/card'
import { generateTwinSystemPrompt } from '@/lib/prompts'
import type { Twin, TwinProfile } from '@/lib/supabase/client'
import { MessageSquare, User } from 'lucide-react'

interface TwinConversationProps {
  twin: Twin
}

export function TwinConversation({ twin }: TwinConversationProps) {
  // Generate system prompt for the twin
  const systemPrompt = useMemo(() => {
    return generateTwinSystemPrompt(
      twin.display_name,
      twin.profile_json as TwinProfile,
      twin.transcript
    )
  }, [twin])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Twin Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold mb-1">{twin.display_name}</h2>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {(twin.profile_json as TwinProfile).identity_summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Interface */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-4">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Conversazione vocale</span>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Premi il pulsante per iniziare una conversazione vocale con {twin.display_name}. 
          Puoi fare domande sulla sua esperienza, competenze e modo di lavorare.
        </p>
      </div>

      <VoiceAgent
        systemPrompt={systemPrompt}
        autoConnect={false}
      />

      {/* Suggestions */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3 text-sm">Domande suggerite:</h3>
          <div className="flex flex-wrap gap-2">
            {getSuggestedQuestions().map((question, i) => (
              <span 
                key={i}
                className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground"
              >
                {question}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getSuggestedQuestions(): string[] {
  return [
    `Raccontami di te`,
    `Come affronti i problemi complessi?`,
    `Qual è stata la tua sfida più grande?`,
    `Cosa ti rende unico/a?`,
    `Come lavori in team?`
  ]
}

