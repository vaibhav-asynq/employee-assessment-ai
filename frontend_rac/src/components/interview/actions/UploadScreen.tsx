import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { ActionWrapper } from "./ActionWrapper";
import { useStepper } from "@/components/ui/stepper";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

export function UploadScreen() {
  const handleSelectPdf = useInterviewDataStore(
    (state) => state.handleSelectPdf,
  );
  const error = useInterviewDataStore((state) => state.error);
  const loading = useInterviewDataStore((state) => state.loading);
  const file = useInterviewDataStore((state) => state.file);
  const uploadProgress = useInterviewDataStore((state) => state.uploadProgress);

  const { nextStep } = useStepper();

  return (
    <ActionWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upload Interview Transcript</h2>
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            variant="outline"
            disabled={loading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select PDF
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={async (e) => {
              handleSelectPdf(e, nextStep);
            }}
            className="hidden"
          />
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">
                {uploadProgress === "uploading"
                  ? "Uploading file..."
                  : "Processing document..."}
              </span>
            </div>
          )}
        </div>
        {file && (
          <p className="text-sm text-gray-500">Selected file: {file.name}</p>
        )}
      </div>
    </ActionWrapper>
  );
}
