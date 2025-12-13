'use client'

import { Progress } from '@/components/ui/progress'
import { TOTAL_FIXED_QUESTIONS, MAX_TOTAL_QUESTIONS } from '@/lib/constants'

interface InterviewProgressProps {
  currentQuestion: number
  isDeepening: boolean
}

export function InterviewProgress({ 
  currentQuestion, 
  isDeepening 
}: InterviewProgressProps) {
  // Progress is based on total max questions (10)
  const progressPercentage = Math.min((currentQuestion / MAX_TOTAL_QUESTIONS) * 100, 100)

  const getStatusText = () => {
    if (currentQuestion <= TOTAL_FIXED_QUESTIONS) {
      return `Domanda ${currentQuestion} / ${TOTAL_FIXED_QUESTIONS}`
    }
    if (isDeepening) {
      const followUpNum = currentQuestion - TOTAL_FIXED_QUESTIONS
      return `Approfondimento ${followUpNum} / ${MAX_TOTAL_QUESTIONS - TOTAL_FIXED_QUESTIONS}`
    }
    return 'Completamento...'
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className="h-2"
      />
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {currentQuestion <= TOTAL_FIXED_QUESTIONS 
          ? 'Domande base' 
          : 'Domande di approfondimento'}
      </p>
    </div>
  )
}
