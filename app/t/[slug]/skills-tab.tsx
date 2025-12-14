"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Code, Users, Briefcase, Wrench, Loader2 } from "lucide-react";
import type { Skill } from "@/lib/supabase/client";

interface SkillsTabProps {
  skills: Skill[];
}

// Category metadata
const categoryInfo = {
  technical: {
    label: "Competenze Tecniche",
    icon: Code,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  soft: {
    label: "Soft Skills",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  domain: {
    label: "Competenze di Dominio",
    icon: Briefcase,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  tools: {
    label: "Strumenti",
    icon: Wrench,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
} as const;

// Proficiency level badges
const proficiencyColors = {
  beginner: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  intermediate: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  advanced: "bg-green-500/10 text-green-600 border-green-500/20",
  expert: "bg-purple-500/10 text-purple-600 border-purple-500/20",
} as const;

const proficiencyLabels = {
  beginner: "Base",
  intermediate: "Intermedio",
  advanced: "Avanzato",
  expert: "Esperto",
} as const;

export function SkillsTab({ skills }: SkillsTabProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin opacity-50" />
        <h3 className="text-lg font-medium text-white mb-2">
          Analisi competenze in corso...
        </h3>
        <p className="text-sm text-white max-w-md">
          Stiamo analizzando il profilo per estrarre automaticamente le
          competenze. Ricarica la pagina tra qualche istante.
        </p>
      </div>
    );
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Competenze</h2>
        <p className="text-white text-sm">
          {skills.length} competenza{skills.length !== 1 ? "e" : ""} estratta
          {skills.length !== 1 ? "e" : ""} dal profilo
        </p>
      </div>

      {(Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>).map(
        (category) => {
          const categorySkills = skillsByCategory[category];
          if (!categorySkills || categorySkills.length === 0) return null;

          const info = categoryInfo[category];
          const Icon = info.icon;

          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg ${info.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${info.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{info.label}</h3>
                  <p className="text-sm text-white">
                    {categorySkills.length} competenza
                    {categorySkills.length !== 1 ? "e" : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 mb-8">
                {categorySkills.map((skill) => {
                  return (
                    <Card
                      key={skill.id}
                      className={`${info.borderColor} hover:border-primary/50 transition-colors`}
                    >
                      <CardContent className="px-4 py-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-base">
                                {skill.skill_name}
                              </h4>
                              {skill.proficiency_level && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border ${
                                    proficiencyColors[skill.proficiency_level]
                                  }`}
                                >
                                  {proficiencyLabels[skill.proficiency_level]}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-white">
                              <span className="capitalize">{skill.source}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
