import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink, Download } from "lucide-react";
import type { DocumentRef } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface DocumentsTabProps {
  documents: DocumentRef[];
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-white mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-white mb-2">
          Nessun documento caricato
        </h3>
        <p className="text-sm text-white max-w-md">
          Questo twin non ha documenti allegati al suo profilo.
        </p>
      </div>
    );
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get file type icon color
  const getFileTypeColor = (type: string): string => {
    if (type.includes("pdf")) return "text-red-500";
    if (type.includes("image")) return "text-blue-500";
    if (type.includes("word") || type.includes("document"))
      return "text-blue-600";
    if (type.includes("text")) return "text-green-500";
    return "text-white";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Documenti</h2>
          <p className="text-white text-sm">
            {documents.length} documento{documents.length !== 1 ? "i" : ""}{" "}
            caricato{documents.length !== 1 ? "i" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {documents.map((doc, index) => (
          <Card
            key={index}
            className="hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 ${getFileTypeColor(
                    doc.type
                  )}`}
                >
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {doc.name}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-white mb-3">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                    {doc.type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">
                          {doc.type.split("/")[1] || "File"}
                        </span>
                      </>
                    )}
                  </div>

                  {doc.extractedText && (
                    <div className="text-xs text-white bg-muted/50 rounded px-2 py-1 inline-block">
                      Testo estratto disponibile
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.url, "_blank")}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apri
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = doc.url;
                      link.download = doc.name;
                      link.target = "_blank";
                      link.rel = "noopener noreferrer";
                      link.click();
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
