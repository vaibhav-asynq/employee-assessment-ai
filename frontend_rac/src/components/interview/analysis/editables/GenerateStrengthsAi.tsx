import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { TemplateId } from "@/lib/types/types.analysis";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { generateStrengthContent } from "@/lib/api";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";

interface GenerateStrengthsAi {
  templateId: TemplateId;
  strenghtItemId: string;
  btnText?: string;
}

export function GenerateStrengthsAi({
  templateId,
  strenghtItemId,
  btnText = "Prompt with AI",
}: GenerateStrengthsAi) {
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const { handleStrengthContentChange } = useEditAnalysis(handleAnalysisUpdate);

  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const content = templates[templateId];
  if (!content) {
    //TODO: handle no content scenario
    return null;
  }

  const heading = content.strengths.items[strenghtItemId].heading;

  const generateAiResponse = async (suggestion: string) => {
    if (!fileId) throw Error("fileId is required");
    if (!content) throw Error("Content is required");

    try {
      const response = await generateStrengthContent(
        heading,
        fileId,
        suggestion,
      );
      handleStrengthContentChange(strenghtItemId, response);
    } catch (error) {
      console.error("Error generating content:", error);
      throw Error(
        error instanceof Error ? error.message : "Can not generate content",
      );
    }
  };
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      await generateAiResponse(suggestion);
      setSuggestion("");
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-500 whitespace-nowrap flex items-center"
          disabled={!heading.trim()}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {btnText}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseCross={false}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (generating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{heading}</DialogTitle>
        </DialogHeader>
        <div className="pb-4 flex flex-col gap-3">
          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}
          <Textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Enter your content suggestion here..."
            className="min-h-[200px] resize-none"
          />
        </div>
        <DialogFooter>
          <div className="flex items-center gap-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={handleGenerate}
              disabled={generating || !heading.trim()}
              className="w-auto sm:w-[180px]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate with AI
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
