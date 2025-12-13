import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Brain,
  Wrench,
  Shield,
  TrendingUp,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import type { TwinProfile } from "@/lib/supabase/client";

interface ProfileTabProps {
  profile: TwinProfile;
  displayName: string;
}

const profileSections = [
  {
    key: "identity_summary" as keyof TwinProfile,
    label: "Chi sono",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "thinking_patterns" as keyof TwinProfile,
    label: "Come ragiono",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    key: "methodology" as keyof TwinProfile,
    label: "Come lavoro",
    icon: Wrench,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    key: "constraints" as keyof TwinProfile,
    label: "I miei limiti",
    icon: Shield,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "proof_metrics" as keyof TwinProfile,
    label: "I miei risultati",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "style_tone" as keyof TwinProfile,
    label: "Il mio stile",
    icon: MessageCircle,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
] as const;

export function ProfileTab({ profile, displayName }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Profilo di {displayName}</h2>
        <p className="text-white text-sm">
          Caratteristiche e personalità del Digital Twin
        </p>
      </div>

      <div className="grid gap-4">
        {profileSections.map((section) => {
          const Icon = section.icon;
          const value = profile[section.key];
          const isEmpty = !value || value === "-";

          return (
            <Card key={section.key} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${section.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2">
                      {section.label}
                    </h3>
                    {isEmpty ? (
                      <p className="text-white italic text-sm">
                        Informazione non disponibile
                      </p>
                    ) : (
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Do Not Say Section */}
        {profile.do_not_say && profile.do_not_say.length > 0 && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-3">
                    Da non dire/inventare
                  </h3>
                  <ul className="space-y-2">
                    {profile.do_not_say.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

