'use client'

import { THEMES, type ThemeName } from '@/lib/themes'
import { Check } from 'lucide-react'

interface ThemeSelectorProps {
  currentTheme: ThemeName
  onThemeSelect: (theme: ThemeName) => void
}

export function ThemeSelector({ currentTheme, onThemeSelect }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Seleziona Tema</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Scegli lo sfondo e i colori per la tua pagina profilo
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.values(THEMES).map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeSelect(theme.name)}
            className={`
              relative group rounded-lg overflow-hidden border-2 transition-all
              ${
                currentTheme === theme.name
                  ? 'border-white shadow-lg scale-105'
                  : 'border-white/20 hover:border-white/40 hover:scale-102'
              }
            `}
            style={{
              background: theme.gradient,
            }}
          >
            {/* Preview */}
            <div className="aspect-square p-4 flex flex-col items-center justify-center">
              {/* Accent color indicator */}
              <div
                className="w-12 h-12 rounded-full mb-2 opacity-60"
                style={{ backgroundColor: theme.accentColor }}
              />
              
              {/* Theme name */}
              <span className="text-white text-sm font-medium">
                {theme.displayName}
              </span>

              {/* Selected indicator */}
              {currentTheme === theme.name && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

