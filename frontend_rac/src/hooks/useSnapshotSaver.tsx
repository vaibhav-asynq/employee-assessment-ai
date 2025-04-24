import { useMutation } from "@tanstack/react-query";
import { saveSnapshotToDB } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types";

export const useSnapshotSaver = () => {
  const { fileId, manual_report, ai_competencies } = useInterviewDataStore();
  const { templates } = useAnalysisStore();

  const mutation = useMutation({
    mutationFn: async () => {
      const snapshotPayload = {
        fileId,
        manual_report: {
          editable: templates[templatesIds.base],
        },
        full_report: {
          editable: templates[templatesIds.fullReport],
        },
        ai_Competencies: ai_competencies,
      };
      return await saveSnapshotToDB(snapshotPayload);
    },
  });

  return {
    saveSnapshot: mutation.mutate,
    saveSnapshotAsync: mutation.mutateAsync,
    isSaving: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
};
