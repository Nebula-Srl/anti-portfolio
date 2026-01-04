"use client";

import { getTheme, type ThemeName } from "@/lib/themes";

interface ThemePickerProps {
  selectedTheme: ThemeName;
  onChange: (theme: ThemeName) => void;
  disabled?: boolean;
}

const themes: { name: ThemeName; label: string }[] = [
  { name: "cosmic", label: "Cosmic" },
  { name: "ocean", label: "Ocean" },
  { name: "sunset", label: "Sunset" },
  { name: "forest", label: "Forest" },
  { name: "aurora", label: "Aurora" },
  { name: "galaxy", label: "Galaxy" },
  { name: "neon", label: "Neon" },
  { name: "lavender", label: "Lavender" },
  { name: "ember", label: "Ember" },
  { name: "midnight", label: "Midnight" },
];

export function ThemePicker({
  selectedTheme,
  onChange,
  disabled,
}: ThemePickerProps) {
  return (
    <>
      {/* Desktop: Visual Grid */}
      <div className="hidden md:grid grid-cols-6 gap-3">
        {themes.map((theme) => {
          const config = getTheme(theme.name);
          const isSelected = selectedTheme === theme.name;

          return (
            <button
              key={theme.name}
              onClick={() => onChange(theme.name)}
              disabled={disabled}
              className={`
                relative group rounded-xl overflow-hidden transition-all duration-300 min-w-24 min-h-24
                ${
                  isSelected
                    ? "ring-4 ring-white scale-105"
                    : "ring-2 ring-white/20 hover:ring-white/50 hover:scale-102"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={{
                background: config.gradient,
                height: "80px",
              }}
            >
              {/* Accent indicator */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: config.accentColor }}
              />

              {/* Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {theme.label}
                </span>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </button>
          );
        })}
      </div>

      {/* Mobile: Select Dropdown */}
      <div className="md:hidden">
        <select
          value={selectedTheme}
          onChange={(e) => onChange(e.target.value as ThemeName)}
          disabled={disabled}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm"
        >
          {themes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
