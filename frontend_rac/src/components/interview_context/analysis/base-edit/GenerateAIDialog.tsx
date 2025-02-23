import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface GenerateAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  onGenerate: (suggestion: string) => Promise<void>;
}

export function GenerateAIDialog({
  open,
  onOpenChange,
  heading,
  onGenerate,
}: GenerateAIDialogProps) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(suggestion);
      onOpenChange(false);
      setSuggestion("");
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{heading}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Enter your content suggestion here..."
            className="min-h-[200px] resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate with AI"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
