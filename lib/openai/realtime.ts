/**
 * OpenAI Realtime API Client
 * 
 * Handles WebRTC connection to OpenAI's speech-to-speech API
 * Based on: https://platform.openai.com/docs/guides/voice-agents
 */

export interface RealtimeConfig {
  token: string
  model: string
  voice: string
  systemPrompt: string
  onTranscript?: (text: string, role: 'user' | 'assistant') => void
  onAudioStart?: () => void
  onAudioEnd?: () => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

export interface RealtimeClient {
  connect: () => Promise<void>
  disconnect: () => void
  isConnected: () => boolean
}

export function createRealtimeClient(config: RealtimeConfig): RealtimeClient {
  let peerConnection: RTCPeerConnection | null = null
  let dataChannel: RTCDataChannel | null = null
  let audioElement: HTMLAudioElement | null = null
  let mediaStream: MediaStream | null = null
  let connected = false
  let connecting = false

  async function connect() {
    // Prevent multiple connections
    if (connecting || connected) {
      console.log('Already connecting or connected, skipping')
      return
    }

    connecting = true

    try {
      // Create peer connection
      peerConnection = new RTCPeerConnection()

      // Set up audio playback - create element and add to DOM
      audioElement = document.createElement('audio')
      audioElement.autoplay = true
      audioElement.id = 'realtime-audio-' + Date.now()
      // Add to body to ensure it plays
      document.body.appendChild(audioElement)
      
      peerConnection.ontrack = (event) => {
        if (audioElement && event.streams[0]) {
          audioElement.srcObject = event.streams[0]
        }
      }

      // Get user microphone
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Add audio track to peer connection
      mediaStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, mediaStream!)
      })

      // Create data channel for events
      dataChannel = peerConnection.createDataChannel('oai-events')
      
      dataChannel.onopen = () => {
        // Send session configuration
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: config.systemPrompt,
            voice: config.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }
        dataChannel?.send(JSON.stringify(sessionConfig))
      }

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleRealtimeMessage(message)
        } catch (e) {
          console.error('Error parsing realtime message:', e)
        }
      }

      // Create and set local description
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send offer to OpenAI
      const response = await fetch(
        `https://api.openai.com/v1/realtime?model=${config.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/sdp'
          },
          body: offer.sdp
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status}`)
      }

      const answerSdp = await response.text()
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      })

      connected = true
      connecting = false
      config.onConnectionChange?.(true)
    } catch (error) {
      connecting = false
      config.onError?.(error as Error)
      disconnect()
    }
  }

  function handleRealtimeMessage(message: Record<string, unknown>) {
    const type = message.type as string

    switch (type) {
      case 'conversation.item.input_audio_transcription.completed':
        config.onTranscript?.(message.transcript as string, 'user')
        break

      case 'response.audio_transcript.done':
        config.onTranscript?.(message.transcript as string, 'assistant')
        break

      case 'response.audio.started':
        config.onAudioStart?.()
        break

      case 'response.audio.done':
        config.onAudioEnd?.()
        break

      case 'error':
        config.onError?.(new Error((message.error as Record<string, string>)?.message || 'Unknown error'))
        break
    }
  }

  function disconnect() {
    // Stop all microphone tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop()
      })
      mediaStream = null
    }

    if (dataChannel) {
      dataChannel.close()
      dataChannel = null
    }
    
    if (peerConnection) {
      peerConnection.close()
      peerConnection = null
    }

    // Remove audio element from DOM and clean up
    if (audioElement) {
      audioElement.pause()
      audioElement.srcObject = null
      if (audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement)
      }
      audioElement = null
    }

    connected = false
    connecting = false
    config.onConnectionChange?.(false)
  }

  function isConnected() {
    return connected
  }

  return {
    connect,
    disconnect,
    isConnected
  }
}
