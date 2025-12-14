"use client";

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
    chipBg: "bg-blue-500/20",
    chipBorder: "border-blue-500/30",
    chipText: "text-blue-100",
  },
  soft: {
    label: "Soft Skills",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    chipBg: "bg-green-500/20",
    chipBorder: "border-green-500/30",
    chipText: "text-green-100",
  },
  domain: {
    label: "Competenze di Dominio",
    icon: Briefcase,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    chipBg: "bg-purple-500/20",
    chipBorder: "border-purple-500/30",
    chipText: "text-purple-100",
  },
  tools: {
    label: "Strumenti",
    icon: Wrench,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    chipBg: "bg-amber-500/20",
    chipBorder: "border-amber-500/30",
    chipText: "text-amber-100",
  },
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

              <div className="flex flex-wrap gap-2 mb-8">
                {categorySkills.map((skill) => {
                  return (
                    <span
                      key={skill.id}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105 ${info.chipBg} ${info.chipBorder} ${info.chipText}`}
                    >
                      {skill.skill_name}
                    </span>
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
