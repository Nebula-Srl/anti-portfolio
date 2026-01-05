"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/theme-selector";
import { PhotoUpload } from "@/components/photo-upload";
import { EditProfileVoice } from "@/components/edit-profile-voice";
import type { Twin, TwinProfile } from "@/lib/supabase/client";
import type { ProfileSection } from "@/lib/types";
import type { ThemeName } from "@/lib/themes";
import { Loader2, Mic, Sparkles, Save } from "lucide-react";

interface EditProfileFormProps {
  twin: Twin;
  editToken: string;
  onSaveComplete: (updatedTwin: Twin) => void;
  onCancel: () => void;
}

const PROFILE_SECTIONS: {
  key: ProfileSection;
  label: string;
  description: string;
}[] = [
  {
    key: "identity_summary",
    label: "Identità",
    description: "Chi sei e cosa fai",
  },
  {
    key: "thinking_patterns",
    label: "Pensiero",
    description: "Come ragioni e affronti i problemi",
  },
  {
    key: "methodology",
    label: "Metodologia",
    description: "Come lavori e quali strumenti usi",
  },
  {
    key: "constraints",
    label: "Limiti",
    description: "I tuoi principi e vincoli",
  },
  {
    key: "proof_metrics",
    label: "Risultati",
    description: "I tuoi successi e progetti",
  },
  { key: "style_tone", label: "Stile", description: "Come comunichi" },
];

export function EditProfileForm({
  twin,
  editToken,
  onSaveComplete,
  onCancel,
}: EditProfileFormProps) {
  const [profile, setProfile] = useState<TwinProfile>(
    twin.profile_json as TwinProfile
  );
  const [theme, setTheme] = useState<string>(twin.theme || "cosmic");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    twin.profile_photo_url
  );
  const [displayName, setDisplayName] = useState(twin.display_name);

  const [activeSection, setActiveSection] =
    useState<ProfileSection>("identity_summary");
  const [editMode, setEditMode] = useState<"form" | "voice">("form");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSectionChange = (value: string) => {
    setActiveSection(value as ProfileSection);
    setEditMode("form");
    setQuestions([]);
    setAnswers({});
  };

  const handleProfileChange = (section: ProfileSection, value: string) => {
    setProfile((prev) => ({ ...prev, [section]: value }));
  };

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);

    try {
      const response = await fetch("/api/twins/edit/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: activeSection,
          currentValue: profile[activeSection],
          displayName: twin.display_name,
        }),
      });

      const data = await response.json();

      if (data.success && data.questions) {
        setQuestions(data.questions);
      } else {
        setError(data.error || "Errore nella generazione delle domande");
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handlePhotoUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("editToken", editToken);
    formData.append("twinId", twin.id);
    formData.append("photo", file);

    const response = await fetch("/api/twins/edit/upload-photo", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.photoUrl) {
      setPhotoUrl(data.photoUrl);
      return data.photoUrl;
    } else {
      throw new Error(data.error || "Errore nel caricamento");
    }
  };

  const handleVoiceUpdate = (updatedProfile: Partial<TwinProfile>) => {
    setProfile((prev) => ({ ...prev, ...updatedProfile }));
    setEditMode("form");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/twins/edit/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken,
          twinId: twin.id,
          updates: {
            profile_json: profile,
            theme,
            display_name: displayName,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.twin) {
        onSaveComplete(data.twin);
      } else {
        setError(data.error || "Errore nel salvataggio");
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Modifica Profilo</h2>
        <p className="text-muted-foreground">
          Personalizza il tuo Digital Twin modificando le sezioni del profilo,
          il tema e la foto
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Theme Selector */}
      <ThemeSelector
        currentTheme={theme as ThemeName}
        onThemeSelect={(t) => setTheme(t)}
      />

      {/* Photo Upload */}
      <PhotoUpload
        currentPhotoUrl={photoUrl}
        onPhotoUpload={handlePhotoUpload}
      />

      {/* Profile Sections */}
      <div className="border border-white/20 rounded-lg p-6 bg-white/5">
        <h3 className="text-lg font-semibold mb-4">Sezioni del Profilo</h3>

        <Tabs value={activeSection} onValueChange={handleSectionChange}>
          <TabsList className="w-full flex-wrap h-auto">
            {PROFILE_SECTIONS.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROFILE_SECTIONS.map((section) => (
            <TabsContent
              key={section.key}
              value={section.key}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>

              {editMode === "form" ? (
                <>
                  {/* Textarea */}
                  <textarea
                    value={profile[section.key] as string}
                    onChange={(e) =>
                      handleProfileChange(section.key, e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder={`Scrivi qui la tua ${section.label.toLowerCase()}...`}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateQuestions}
                      disabled={loadingQuestions}
                      variant="outline"
                      size="sm"
                    >
                      {loadingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Genera Domande
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setEditMode("voice")}
                      variant="outline"
                      size="sm"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Modifica con Voce
                    </Button>
                  </div>

                  {/* Generated Questions */}
                  {questions.length > 0 && (
                    <div className="space-y-4 bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="font-semibold text-sm">
                        Domande per approfondire:
                      </h4>
                      {questions.map((question, idx) => (
                        <div key={idx} className="space-y-2">
                          <p className="text-sm font-medium">
                            {idx + 1}. {question}
                          </p>
                          <input
                            type="text"
                            placeholder="La tua risposta..."
                            value={answers[`${section.key}-${idx}`] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [`${section.key}-${idx}`]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <EditProfileVoice
                  displayName={twin.display_name}
                  section={section.key}
                  currentValue={profile[section.key] as string}
                  fullProfile={profile}
                  onUpdateExtracted={handleVoiceUpdate}
                  onCancel={() => setEditMode("form")}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Save Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/20">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salva Modifiche
            </>
          )}
        </Button>
        <Button onClick={onCancel} variant="ghost" disabled={saving}>
          Annulla
        </Button>
      </div>
    </div>
  );
}
