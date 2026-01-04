'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Loader2, MessageCircle, Send } from 'lucide-react'
import { toast } from 'react-toastify'
import type { TwinProfile } from '@/lib/supabase/client'

interface ProfileAIQuestionsProps {
  sectionKey: keyof TwinProfile
  sectionLabel: string
  currentValue: string
  onUpdate: (value: string) => void
  editToken: string
}

const sectionDescriptions: Record<string, string> = {
  identity_summary: "chi sei, cosa fai, il tuo background",
  thinking_patterns: "come ragioni, il tuo approccio mentale ai problemi",
  methodology: "come lavori, i tuoi processi e metodologie",
  constraints: "i tuoi limiti, cosa non fai o non sai fare",
  proof_metrics: "i tuoi risultati misurabili, numeri, achievements",
  communication_style: "come comunichi, il tuo stile di interazione",
}

export function ProfileAIQuestions({
  sectionKey,
  sectionLabel,
  currentValue,
  onUpdate,
  editToken,
}: ProfileAIQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  const generateQuestions = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/twins/edit/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${editToken}`,
        },
        body: JSON.stringify({
          section: sectionKey,
          sectionLabel,
          currentValue,
        }),
      })

      const data = await response.json()

      if (data.success && data.questions) {
        setQuestions(data.questions)
        setAnswers(new Array(data.questions.length).fill(''))
        setCurrentQuestionIndex(0)
        setShowQuestions(true)
        toast.success(`✨ ${data.questions.length} domande generate!`)
      } else {
        throw new Error(data.error || 'Errore nella generazione')
      }
    } catch (error) {
      console.error('Generate questions error:', error)
      toast.error('Errore nella generazione delle domande')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) {
      toast.warning('Inserisci una risposta prima di continuare')
      return
    }

    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = currentAnswer
    setAnswers(newAnswers)
    setCurrentAnswer('')

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      toast.success('✅ Risposta salvata!')
    } else {
      // All questions answered, generate final text
      generateFinalText(newAnswers)
    }
  }

  const generateFinalText = async (allAnswers: string[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/twins/edit/synthesize-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${editToken}`,
        },
        body: JSON.stringify({
          section: sectionKey,
          sectionLabel,
          questions,
          answers: allAnswers,
          currentValue,
        }),
      })

      const data = await response.json()

      if (data.success && data.synthesizedText) {
        onUpdate(data.synthesizedText)
        setShowQuestions(false)
        setQuestions([])
        setAnswers([])
        setCurrentQuestionIndex(0)
        toast.success('🎉 Profilo aggiornato con le tue risposte!')
      } else {
        throw new Error(data.error || 'Errore nella sintesi')
      }
    } catch (error) {
      console.error('Synthesize answers error:', error)
      toast.error('Errore nella creazione del testo finale')
    } finally {
      setLoading(false)
    }
  }

  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
    }
  }

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setCurrentAnswer(answers[currentQuestionIndex - 1] || '')
    }
  }

  if (!showQuestions) {
    return (
      <div className="p-6 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/20">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">
              Compila con l&apos;AI
            </h4>
            <p className="text-white/70 text-sm mb-4">
              Rispondi a {sectionKey === 'identity_summary' ? '3' : '5'} domande
              guidate sull&apos;AI su {sectionDescriptions[sectionKey]} e
              genereremo automaticamente il testo per questa sezione.
            </p>
            <Button
              onClick={generateQuestions}
              disabled={generating}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generazione domande...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Inizia Intervista AI
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-lg border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80 text-sm">
            Domanda {currentQuestionIndex + 1} di {questions.length}
          </span>
          <span className="text-white/60 text-xs">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20 mt-1">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-white text-lg flex-1">
            {questions[currentQuestionIndex]}
          </p>
        </div>

        {/* Answer Input */}
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Scrivi la tua risposta qui..."
          className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 resize-none"
          rows={4}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleAnswerSubmit()
            }
          }}
        />
        <p className="text-white/50 text-xs mt-2">
          Premi Ctrl+Enter per inviare rapidamente
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={goBack}
          disabled={currentQuestionIndex === 0 || loading}
          variant="outline"
          size="sm"
          className="text-white border-white/20 hover:bg-white/10"
        >
          ← Indietro
        </Button>
        <Button
          onClick={skipQuestion}
          disabled={currentQuestionIndex === questions.length - 1 || loading}
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          Salta
        </Button>
        <div className="flex-1" />
        <Button
          onClick={handleAnswerSubmit}
          disabled={!currentAnswer.trim() || loading}
          className="bg-purple-500 hover:bg-purple-600 text-white"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Elaborazione...
            </>
          ) : currentQuestionIndex === questions.length - 1 ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Termina e Genera
            </>
          ) : (
            <>
              Avanti
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Answers Summary */}
      {answers.some((a) => a) && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/60 text-sm mb-3">Risposte salvate:</p>
          <div className="space-y-2">
            {answers.map(
              (answer, index) =>
                answer && (
                  <div
                    key={index}
                    className="text-xs text-white/50 bg-white/5 p-2 rounded"
                  >
                    <span className="font-semibold">Q{index + 1}:</span>{' '}
                    {answer.substring(0, 100)}
                    {answer.length > 100 && '...'}
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

