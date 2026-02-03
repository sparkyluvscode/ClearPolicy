"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";

/**
 * UN/International Policy Documents - Input Page
 * 
 * This page allows users to submit UN/international documents for analysis.
 * Supports three input methods: URL, file upload, and text paste.
 * 
 * @module app/un/page
 */

type InputMethod = "url" | "upload" | "text";
type ProcessingState = "idle" | "processing" | "error";

export default function UNDocsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inputMethod, setInputMethod] = useState<InputMethod>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".pdf") && !selectedFile.name.endsWith(".docx") && !selectedFile.name.endsWith(".txt")) {
        setError("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing("processing");

    try {
      const formData = new FormData();
      formData.append("inputMethod", inputMethod);

      if (inputMethod === "url") {
        if (!url.trim()) {
          throw new Error("Please enter a URL.");
        }
        // Basic URL validation
        try {
          new URL(url);
        } catch {
          throw new Error("Please enter a valid URL.");
        }
        formData.append("url", url.trim());
      } else if (inputMethod === "upload") {
        if (!file) {
          throw new Error("Please select a file to upload.");
        }
        formData.append("file", file);
      } else if (inputMethod === "text") {
        if (!text.trim() || text.trim().length < 100) {
          throw new Error("Please enter at least 100 characters of text.");
        }
        formData.append("text", text.trim());
      }

      const res = await fetch("/api/un/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      // Store analysis in sessionStorage and redirect to results
      sessionStorage.setItem("un_analysis", JSON.stringify(data.analysis));
      router.push("/un/results");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setProcessing("error");
    }
  };

  const isSubmitDisabled = processing === "processing" || (
    (inputMethod === "url" && !url.trim()) ||
    (inputMethod === "upload" && !file) ||
    (inputMethod === "text" && text.trim().length < 100)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-accent/10 p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--cp-text)]">UN & International Documents</h1>
            <p className="text-sm text-[var(--cp-muted)]">Simplify complex UN resolutions, treaties, and policy documents</p>
          </div>
        </div>
        <p className="text-sm text-[var(--cp-muted)]">
          Upload or paste a UN document to get a clear, neutral summary at different reading levels. 
          Perfect for youth delegates, students, and anyone trying to understand international policy.
        </p>
      </Card>

      {/* Input Method Selector */}
      <Card className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--cp-text)] mb-3">How would you like to provide the document?</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "url" as const, label: "URL", icon: "🔗", desc: "Paste a link to a UN document" },
              { id: "upload" as const, label: "Upload", icon: "📄", desc: "Upload a PDF or DOCX file" },
              { id: "text" as const, label: "Paste Text", icon: "📝", desc: "Copy-paste document text" },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setInputMethod(method.id);
                  setError(null);
                }}
                className={`flex-1 min-w-[120px] rounded-xl border p-4 text-left transition-colors ${
                  inputMethod === method.id
                    ? "border-accent bg-accent/5"
                    : "border-[var(--cp-border)] hover:border-[var(--cp-muted)]"
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <div className="font-medium text-[var(--cp-text)]">{method.label}</div>
                <div className="text-xs text-[var(--cp-muted)]">{method.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {inputMethod === "url" && (
            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-[var(--cp-text)] mb-2">
                Document URL
              </label>
              <Input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://undocs.org/..."
                className="w-full"
              />
              <p className="mt-2 text-xs text-[var(--cp-muted)]">
                Works best with text-based pages from undocs.org, un.org, and similar official sites.
              </p>
            </div>
          )}

          {inputMethod === "upload" && (
            <div>
              <label className="block text-sm font-medium text-[var(--cp-text)] mb-2">
                Upload Document
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file ? "border-accent bg-accent/5" : "border-[var(--cp-border)] hover:border-[var(--cp-muted)]"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    const fakeEvent = { target: { files: [droppedFile] } } as any;
                    handleFileSelect(fakeEvent);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <div className="text-3xl">✅</div>
                    <div className="font-medium text-[var(--cp-text)]">{file.name}</div>
                    <div className="text-xs text-[var(--cp-muted)]">{(file.size / 1024).toFixed(1)} KB</div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl">📤</div>
                    <div className="font-medium text-[var(--cp-text)]">Drop a file here or click to browse</div>
                    <div className="text-xs text-[var(--cp-muted)]">PDF, DOCX, or TXT (max 10MB)</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {inputMethod === "text" && (
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-[var(--cp-text)] mb-2">
                Paste Document Text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the document text here..."
                rows={12}
                className="w-full rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-3 text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
              <p className="mt-2 text-xs text-[var(--cp-muted)]">
                {text.length.toLocaleString()} characters {text.length < 100 && text.length > 0 && "(need at least 100)"}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isSubmitDisabled}
          >
            {processing === "processing" ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyzing document...
              </span>
            ) : (
              "Analyze Document"
            )}
          </Button>
        </form>
      </Card>

      {/* Tips */}
      <Card variant="subtle" className="space-y-3">
        <h3 className="font-medium text-[var(--cp-text)]">Tips for best results</h3>
        <ul className="space-y-2 text-sm text-[var(--cp-muted)]">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>UN resolutions, treaties, and outcome documents work best</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>For PDFs that do not parse well, try copy-pasting the text instead</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Longer documents may take a bit more time to analyze</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Results include a glossary of UN acronyms and jargon</span>
          </li>
        </ul>
      </Card>

      {/* Example Documents */}
      <Card variant="subtle" className="space-y-3">
        <h3 className="font-medium text-[var(--cp-text)]">Example documents to try</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { name: "BBNJ Treaty", desc: "High Seas Biodiversity Agreement", url: "https://www.un.org/bbnj/" },
            { name: "Paris Agreement", desc: "Climate Change Framework", url: "https://unfccc.int/process-and-meetings/the-paris-agreement" },
            { name: "SDG Progress", desc: "Sustainable Development Goals", url: "https://sdgs.un.org/goals" },
          ].map((example) => (
            <button
              key={example.name}
              type="button"
              onClick={() => {
                setInputMethod("url");
                setUrl(example.url);
              }}
              className="rounded-lg border border-[var(--cp-border)] p-3 text-left hover:border-accent hover:bg-accent/5 transition-colors"
            >
              <div className="font-medium text-sm text-[var(--cp-text)]">{example.name}</div>
              <div className="text-xs text-[var(--cp-muted)]">{example.desc}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
