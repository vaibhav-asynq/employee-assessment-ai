import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { ActionWrapper } from "./ActionWrapper";
import { useStepper } from "@/components/ui/stepper";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";

export function UploadScreen() {
  const queryClient = useQueryClient();
  const handleSelectPdf = useInterviewDataStore(
    (state) => state.handleSelectPdf,
  );
  const error = useInterviewDataStore((state) => state.error);
  const loading = useInterviewDataStore((state) => state.loading);
  const { file, fileId } = useInterviewDataStore();
  const uploadProgress = useInterviewDataStore((state) => state.uploadProgress);
  const { setFeedbackData, setAdviceData } = useInterviewDataStore();
  const { templates, removeTemplate } = useAnalysisStore();
  const { nextStep } = useStepper();

  const [useCache, setUseCache] = useState(true);

  const handleUpload = async (e) => {
    try {
      setFeedbackData(null);
      setAdviceData(null);
      // removeTemplate(templatesIds.base);
      // removeTemplate(templatesIds.fullReport);
      // removeTemplate(templatesIds.aiCompetencies);
      await handleSelectPdf(e, () => {}, useCache);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      queryClient.invalidateQueries(queryKeys.tasks.all);
    } catch {}
  };

  useEffect(() => {
    if (fileId) {
      nextStep();
    }
  }, [fileId, nextStep]);

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
              await handleUpload(e);
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

        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            id="use-cache"
            checked={useCache}
            onChange={(e) => setUseCache(e.target.checked)}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="use-cache" className="text-sm text-gray-700">
            Use cached results if available
          </label>
        </div>
      </div>
    </ActionWrapper>
  );
}
