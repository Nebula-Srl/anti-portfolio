'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoUploadProps {
  currentPhotoUrl?: string
  onPhotoUpload: (file: File) => Promise<string>
  onPhotoRemove?: () => Promise<void>
}

export function PhotoUpload({ 
  currentPhotoUrl, 
  onPhotoUpload,
  onPhotoRemove 
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Formato non valido. Usa JPG o PNG.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File troppo grande. Massimo 5MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const photoUrl = await onPhotoUpload(file)
      setPreview(photoUrl)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
      setPreview(currentPhotoUrl || null)
    } finally {
      setUploading(false)
    }
  }, [onPhotoUpload, currentPhotoUrl])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }, [handleFileSelect])

  const handleRemove = useCallback(async () => {
    if (onPhotoRemove) {
      setUploading(true)
      try {
        await onPhotoRemove()
        setPreview(null)
      } catch (err) {
        setError('Errore nella rimozione')
      } finally {
        setUploading(false)
      }
    } else {
      setPreview(null)
    }
  }, [onPhotoRemove])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Foto Profilo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Carica una foto profilo (JPG o PNG, max 5MB)
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Preview */}
        <div className="relative">
          <div 
            className={`
              w-32 h-32 rounded-full overflow-hidden border-4 border-white/20
              ${!preview ? 'bg-white/10' : ''}
            `}
          >
            {preview ? (
              <img 
                src={preview} 
                alt="Foto profilo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-white/40" />
              </div>
            )}
          </div>

          {/* Remove button */}
          {preview && !uploading && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
              title="Rimuovi foto"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            w-full max-w-md border-2 border-dashed rounded-lg p-6
            transition-colors cursor-pointer
            ${dragActive ? 'border-white bg-white/10' : 'border-white/30 hover:border-white/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="w-8 h-8 text-white/60" />
            <p className="text-sm text-white/80">
              Trascina un'immagine qui o clicca per selezionare
            </p>
            <p className="text-xs text-white/50">
              JPG, PNG • Max 5MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Error message */}
        {error && (
          <div className="w-full max-w-md bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

