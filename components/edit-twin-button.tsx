'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EditTwinDialog } from '@/components/edit-twin-dialog'
import { OtpVerification } from '@/components/otp-verification'
import type { Twin } from '@/lib/supabase/client'
import { Edit } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'

interface EditTwinButtonProps {
  twin: Twin
}

type EditStep = 'initial' | 'otp'

export function EditTwinButton({ twin }: EditTwinButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<EditStep>('initial')
  const [showDialog, setShowDialog] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Check if coming from magic link
  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (editParam === 'true') {
      // Check if we have magic link data
      const magicLinkOtp = sessionStorage.getItem('magic_link_otp')
      const magicLinkSlug = sessionStorage.getItem('magic_link_slug')
      const magicLinkToken = sessionStorage.getItem('magic_link_token')
      const magicLinkTimestamp = sessionStorage.getItem('magic_link_timestamp')

      if (magicLinkOtp && magicLinkSlug === twin.slug && magicLinkToken) {
        // Check if not expired (15 minutes)
        const timestamp = parseInt(magicLinkTimestamp || '0')
        const now = Date.now()
        const fifteenMinutes = 15 * 60 * 1000

        if (now - timestamp < fifteenMinutes) {
          // Auto-verify with magic link
          handleMagicLinkAuth(magicLinkOtp, magicLinkToken)
        } else {
          // Expired, show normal OTP flow
          toast.warning('Link scaduto. Richiedi un nuovo codice OTP.')
          setShowDialog(true)
        }

        // Clean up
        sessionStorage.removeItem('magic_link_otp')
        sessionStorage.removeItem('magic_link_slug')
        sessionStorage.removeItem('magic_link_token')
        sessionStorage.removeItem('magic_link_timestamp')

        // Remove ?edit=true from URL
        router.replace(`/t/${twin.slug}`, { scroll: false })
      }
    }
  }, [searchParams, twin.slug, router])

  const handleMagicLinkAuth = async (otp: string, token: string) => {
    try {
      toast.info('🔐 Verifica automatica in corso...')
      
      // Create a temporary session ID (we'll verify using the OTP)
      const tempSessionId = crypto.randomUUID()
      
      // Verify OTP automatically
      const response = await fetch('/api/twins/edit/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: tempSessionId, 
          otp: otp,
          magicLink: true,
          twinId: twin.id 
        }),
      })

      const data = await response.json()

      if (data.success && data.editToken) {
        toast.success('✅ Accesso verificato! Reindirizzamento...')
        // Redirect to edit page with token
        router.push(`/t/${twin.slug}/edit?token=${data.editToken}`)
      } else {
        // Fallback to manual OTP entry
        toast.error('Verifica fallita. Inserisci il codice manualmente.')
        setShowDialog(true)
      }
    } catch (error) {
      console.error('Magic link auth error:', error)
      // Fallback to manual OTP entry
      toast.error('Errore nella verifica. Richiedi un nuovo codice.')
      setShowDialog(true)
    }
  }

  const handleOpenEdit = () => {
    if (!twin.email) {
      toast.error('Questo profilo non ha un\'email associata')
      return
    }
    setStep('initial')
    setShowDialog(true)
  }

  const handleOtpSent = (sid: string) => {
    setSessionId(sid)
    setStep('otp')
  }

  const handleOtpVerified = (token: string, verifiedTwin: Twin) => {
    toast.success('✅ Codice verificato! Reindirizzamento...')
    setShowDialog(false)
    // Redirect to edit page with token
    router.push(`/t/${twin.slug}/edit?token=${token}`)
  }

  const handleResendOtp = async () => {
    try {
      toast.info('📧 Richiesta nuovo codice OTP...')
      
      // Request new OTP
      const response = await fetch('/api/twins/edit/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: twin.slug }),
      })

      const data = await response.json()

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId)
        toast.success('✅ Nuovo codice inviato! Controlla la tua email.')
      } else {
        toast.error(data.error || 'Errore nel reinvio del codice')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('Errore di connessione durante il reinvio')
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenEdit}
        variant="outline"
        size="sm"
        className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 text-white"
      >
        <Edit className="w-4 h-4 mr-2" />
        Modifica Profilo
      </Button>

      {step === 'initial' && (
        <EditTwinDialog
          open={showDialog && step === 'initial'}
          onOpenChange={setShowDialog}
          twinSlug={twin.slug}
          twinEmail={twin.email}
          onOtpSent={handleOtpSent}
        />
      )}

      {step === 'otp' && sessionId && (
        <OtpVerification
          open={showDialog && step === 'otp'}
          onOpenChange={setShowDialog}
          sessionId={sessionId}
          onVerified={handleOtpVerified}
          onResendOtp={handleResendOtp}
        />
      )}
    </>
  )
}


