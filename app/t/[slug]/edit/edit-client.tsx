"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTheme } from "@/lib/themes";
import type { ThemeName } from "@/lib/themes";
import { Sparkles, Save, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import type { Twin, Skill, TwinProfile } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { ProfileTab } from "../profile-tab";
import { ThemePicker } from "@/components/theme-picker";
import { ProfileAIQuestions } from "@/components/profile-ai-questions";

interface EditTwinPageClientProps {
  twin: Twin;
  skills: Skill[];
  editToken: string;
}

export function EditTwinPageClient({
  twin,
  skills: initialSkills,
  editToken,
}: EditTwinPageClientProps) {
  const router = useRouter();

  // Safely get profile data
  const profileJson = (twin.profile_json as TwinProfile) || {};

  // State for editable fields
  const [displayName, setDisplayName] = useState(twin.display_name);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    twin.profile_photo_url || ""
  );
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(
    twin.profile_photo_url || ""
  );
  const [identitySummary, setIdentitySummary] = useState(
    profileJson.identity_summary || ""
  );
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(
    (twin.theme as ThemeName) || "cosmic"
  );

  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Dynamic theme - updates in real-time
  const theme = getTheme(selectedTheme);

  // Update body background in real-time
  useEffect(() => {
    document.body.style.background = theme.gradient;
    return () => {
      document.body.style.background = "";
    };
  }, [theme.gradient]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Per favore seleziona un file immagine");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 5MB");
      return;
    }

    setProfilePhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!profilePhotoFile) return profilePhotoUrl;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", profilePhotoFile);

    try {
      const response = await fetch("/api/twins/edit/upload-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${editToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.photoUrl) {
        return data.photoUrl;
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Errore nel caricamento della foto");
      return profilePhotoUrl;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Upload photo if changed
      let finalPhotoUrl = profilePhotoUrl;
      if (profilePhotoFile) {
        toast.info("📷 Caricamento foto...");
        finalPhotoUrl = await uploadPhoto();
      }

      // Save profile
      const response = await fetch("/api/twins/edit/save-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${editToken}`,
        },
        body: JSON.stringify({
          displayName,
          profilePhotoUrl: finalPhotoUrl,
          identitySummary,
          theme: selectedTheme,
          skills,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("🎉 Profilo aggiornato con successo!");
        // Redirect back to twin page
        router.push(`/t/${twin.slug}`);
        router.refresh();
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Errore nel salvataggio del profilo");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/t/${twin.slug}`);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: `temp-${Date.now()}`,
      twin_id: twin.id,
      category: "technical",
      skill_name: "Nuova Skill",
      proficiency_level: "intermediate",
      source: "interview",
      created_at: new Date().toISOString(),
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (
    index: number,
    field: keyof Skill,
    value: string | number
  ) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setSkills(updatedSkills);
  };

  const deleteSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme.gradient,
      }}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl animate-float opacity-30"
          style={{ backgroundColor: theme.accentColor }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float opacity-20"
          style={{
            backgroundColor: theme.secondaryColor,
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Enhanced Header - Editable */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <Sparkles
              className="w-4 h-4"
              style={{ color: theme.accentColor }}
            />
            <span className="text-sm text-white/80">Digital Twin</span>
          </div>

          {/* Profile Photo - Editable */}
          <div className="mb-6 relative inline-block">
            <img
              src={profilePhotoPreview || "/placeholder-avatar.png"}
              alt={displayName}
              className="w-32 h-32 rounded-full mx-auto border-4 border-white/20 object-cover"
            />
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 p-2 rounded-full border-2 border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              style={{ backgroundColor: theme.accentColor }}
            >
              <Upload className="w-4 h-4 text-white" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={saving}
              />
            </label>
          </div>

          {/* Display Name - Editable */}
          <div className="max-w-md mx-auto mb-4">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-4xl font-bold text-center bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm"
              placeholder="Nome Visualizzato"
              disabled={saving}
            />
          </div>

          {/* Identity Summary - Editable */}
          <div className="max-w-2xl mx-auto mb-6">
            <textarea
              value={identitySummary}
              onChange={(e) => setIdentitySummary(e.target.value)}
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm resize-none"
              placeholder="Sommario identità (descrizione breve)"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Theme Selector */}
          <div className="max-w-4xl mx-auto mb-6">
            <label className="block text-white/80 text-sm mb-3 font-medium">
              🎨 Tema Visivo (Preview Live)
            </label>
            <ThemePicker
              selectedTheme={selectedTheme}
              onChange={setSelectedTheme}
              disabled={saving}
            />
          </div>
        </div>

        {/* Tabs - Read-only for now, editable in future */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="profile">Profilo</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="documents">Documenti</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
              {/* AI Questions Component */}
              <ProfileAIQuestions
                sectionKey="identity_summary"
                sectionLabel="Chi Sono"
                currentValue={identitySummary}
                onUpdate={setIdentitySummary}
                editToken={editToken}
              />

              {/* Current Profile Display */}
              <div className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Profilo Attuale
                </h3>
                <ProfileTab profile={profileJson} displayName={displayName} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Modifica Skills
                </h3>
                <Button
                  onClick={addSkill}
                  size="sm"
                  style={{ backgroundColor: theme.accentColor }}
                  className="text-white"
                  disabled={saving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Skill
                </Button>
              </div>

              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input
                        value={skill.category}
                        onChange={(e) =>
                          updateSkill(index, "category", e.target.value)
                        }
                        placeholder="Categoria"
                        className="bg-white/10 border-white/20 text-white"
                        disabled={saving}
                      />
                      <Input
                        value={skill.skill_name}
                        onChange={(e) =>
                          updateSkill(index, "skill_name", e.target.value)
                        }
                        placeholder="Nome Skill"
                        className="bg-white/10 border-white/20 text-white"
                        disabled={saving}
                      />
                      <div className="flex gap-2">
                        <select
                          value={skill.proficiency_level}
                          onChange={(e) =>
                            updateSkill(
                              index,
                              "proficiency_level",
                              e.target.value
                            )
                          }
                          className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                          disabled={saving}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                        <Button
                          onClick={() => deleteSkill(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {skills.length === 0 && (
                  <p className="text-center text-white/60 py-8">
                    Nessuna skill aggiunta. Clicca &quot;Aggiungi Skill&quot;
                    per iniziare.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm p-6">
              <div className="text-center text-white/60 py-8">
                <p className="text-lg mb-2">📄 Documenti</p>
                <p className="text-sm">
                  La gestione documenti sarà disponibile a breve in modalità
                  edit.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/50 backdrop-blur-lg">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-white/60 text-sm">
              {profilePhotoFile && "📷 Foto modificata • "}
              {displayName !== twin.display_name && "✏️ Nome modificato • "}
              {selectedTheme !== twin.theme && "🎨 Tema modificato • "}
              {skills.length !== initialSkills.length &&
                `🔧 ${skills.length} skills • `}
              Salva per applicare le modifiche
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="ghost"
                disabled={saving}
                className="text-white hover:bg-white/10"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || uploadingPhoto}
                style={{ backgroundColor: theme.accentColor }}
                className="text-white hover:opacity-90"
              >
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
