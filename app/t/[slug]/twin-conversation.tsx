"use client";

import { useMemo, useCallback, useState } from "react";
import { VoiceAgent, type TranscriptEntry } from "@/components/voice-agent";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateTwinSystemPrompt } from "@/lib/prompts";
import { SILENCE_TIMEOUT_SECONDS } from "@/lib/constants";
import type {
  Twin,
  TwinProfile,
  DocumentRef,
  Skill,
} from "@/lib/supabase/client";
import type { Theme } from "@/lib/themes";
import { MessageSquare, Clock, FileText, Award } from "lucide-react";
import { DocumentsTab } from "./documents-tab";
import { SkillsTab } from "./skills-tab";
import { ProfileTab } from "./profile-tab";

interface TwinConversationProps {
  twin: Twin;
  skills: Skill[];
  theme: Theme;
}

export function TwinConversation({
  twin,
  skills,
  theme,
}: TwinConversationProps) {
  const [conversationEnded, setConversationEnded] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Generate system prompt for the twin (including documents if available)
  const systemPrompt = useMemo(() => {
    return generateTwinSystemPrompt(
      twin.display_name,
      twin.profile_json as TwinProfile,
      twin.transcript,
      twin.documents_text,
      twin.documents as DocumentRef[] | undefined
    );
  }, [twin]);

  // Handle silence timeout - just end the conversation gracefully
  const handleSilenceTimeout = useCallback(() => {
    setConversationEnded(true);
  }, []);

  // Handle transcript updates
  const handleTranscriptUpdate = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries);
  }, []);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setConversationEnded(false);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs Layout */}
      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Left Column: Tabs */}
        <div>
          <Tabs
            defaultValue="conversation"
            className="w-full md:w-10/12 mx-auto"
          >
            <TabsList className="w-full grid grid-cols-3 mb-6 bg-white/5 backdrop-blur-md border border-white/10">
              <TabsTrigger
                value="conversation"
                className="gap-2 data-[state=active]:bg-white/10"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Conversazione</span>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="gap-2 data-[state=active]:bg-white/10"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documenti</span>
              </TabsTrigger>
              <TabsTrigger
                value="skills"
                className="gap-2 data-[state=active]:bg-white/10"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Competenze</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-6">
              {/* Conversation Ended Message */}
              {conversationEnded && (
                <div className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-center">
                  <Clock className="w-6 h-6 text-white/70 mx-auto mb-2" />
                  <p className="text-white/80">
                    La conversazione è terminata per inattività. Clicca
                    &quot;Avvia Conversazione&quot; per ricominciare.
                  </p>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-6">
                  {/* Conversation Interface */}
                  <div className="text-center">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-4"
                      style={{
                        background: `${theme.accentColor}20`,
                        border: `1px solid ${theme.accentColor}40`,
                      }}
                    >
                      <MessageSquare
                        className="w-4 h-4"
                        style={{ color: theme.accentColor }}
                      />
                      <span className="text-sm text-white">
                        Conversazione vocale
                      </span>
                    </div>
                    <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
                      Clicca il pulsante al centro per iniziare una
                      conversazione vocale con {twin.display_name}. La
                      conversazione terminerà dopo {SILENCE_TIMEOUT_SECONDS}{" "}
                      secondi di silenzio.
                    </p>
                  </div>

                  <VoiceAgent
                    systemPrompt={systemPrompt}
                    onSilenceTimeout={handleSilenceTimeout}
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onConnectionChange={handleConnectionChange}
                    autoConnect={false}
                    showTranscript={false}
                    showStopButton={true}
                    showControls={true}
                  />
                </div>

                {/* Right Column: Live Transcript (visible on desktop during conversation) */}
                <div className="">
                  <div className="sticky top-8">
                    <Card className="bg-white/5 backdrop-blur-md border-white/10">
                      <CardContent className="px-6 py">
                        <h3 className="font-medium mb-3 text-sm text-white">
                          Domande suggerite:
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {getSuggestedQuestions().map((question, i) => (
                            <span
                              key={i}
                              className="text-xs px-3 py-1.5 rounded-full text-white/80 backdrop-blur-sm"
                              style={{
                                background: `${theme.accentColor}15`,
                                border: `1px solid ${theme.accentColor}30`,
                              }}
                            >
                              {question}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-sm font-medium mb-3 text-white flex items-center gap-2">
                          <MessageSquare
                            className="w-4 h-4"
                            style={{ color: theme.accentColor }}
                          />
                          Trascrizione in tempo reale
                        </h3>
                        <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                          {!isConnected && transcript.length === 0 ? (
                            <p className="text-sm text-white/60 italic text-center py-8">
                              La trascrizione apparirà qui durante la
                              conversazione
                            </p>
                          ) : transcript.length === 0 ? (
                            <p className="text-sm text-white/60 italic text-center py-8">
                              In attesa di conversazione...
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {transcript.map((entry, i) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-lg text-sm ${
                                    entry.role === "user"
                                      ? "bg-white/10 text-white border border-white/10"
                                      : "bg-white/5 text-white/90 border border-white/5"
                                  }`}
                                  style={
                                    entry.role === "user"
                                      ? {
                                          borderColor: `${theme.accentColor}40`,
                                        }
                                      : {}
                                  }
                                >
                                  <span
                                    className="font-medium block mb-1 text-xs uppercase tracking-wide"
                                    style={{
                                      color:
                                        entry.role === "user"
                                          ? theme.accentColor
                                          : theme.secondaryColor,
                                    }}
                                  >
                                    {entry.role === "user"
                                      ? "Tu"
                                      : twin.display_name}
                                  </span>
                                  {entry.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab documents={twin.documents as DocumentRef[]} />
            </TabsContent>

            <TabsContent value="skills">
              <SkillsTab skills={skills} />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab
                profile={twin.profile_json as TwinProfile}
                displayName={twin.display_name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function getSuggestedQuestions(): string[] {
  return [
    `Raccontami di te`,
    `Come affronti i problemi complessi?`,
    `Qual è stata la tua sfida più grande?`,
  ];
}
