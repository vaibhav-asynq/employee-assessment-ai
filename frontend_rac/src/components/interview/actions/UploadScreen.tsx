import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle, FileText } from "lucide-react";
import { ActionWrapper } from "./ActionWrapper";
import { useStepper } from "@/components/ui/stepper";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { useDropzone } from "react-dropzone";
import ErrorDisplay from "@/components/common/ErrorDisplay";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadScreen() {
  const queryClient = useQueryClient();
  const { file, fileId, loading, error, uploadProgress, handleSelectPdf } =
    useInterviewDataStore();
  const { nextStep } = useStepper();

  const handleUpload = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];
      try {
        await handleSelectPdf(selectedFile, () => {});
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        queryClient.invalidateQueries(queryKeys.tasks.all);
      } catch {}
    },
    [handleSelectPdf, queryClient],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleUpload(acceptedFiles);
    },
    [handleUpload],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  useEffect(() => {
    if (fileId) {
      nextStep();
    }
  }, [fileId, nextStep]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <ActionWrapper>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Upload Interview Transcript</h2>

        {error && <ErrorDisplay error={error} />}

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 transition-colors duration-200 cursor-pointer
            flex flex-col items-center justify-center space-y-4
            ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
            ${isDragReject ? "border-red-400 bg-red-50" : ""}
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} disabled={loading} />

          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>

          <div className="text-center">
            <p className="text-base font-medium">
              {isDragActive
                ? "Drop the PDF here..."
                : "Drag & drop your file here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PDF files only, maximum size {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>

          <Button variant="outline" disabled={loading} className="mt-2">
            <Upload className="mr-2 h-4 w-4" />
            Select File
          </Button>
        </div>

        {fileRejections.length > 0 && (
          <div className="text-sm text-red-600 mt-2">
            {fileRejections.map(({ file, errors }) => (
              <div key={file.name}>
                {errors.map((e) => (
                  <p key={e.code}>{e.message}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        {file && !loading && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
            <FileText className="h-5 w-5" />
            <p className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> (
              {formatFileSize(file.size)})
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">
              {uploadProgress === "uploading"
                ? "Uploading file..."
                : "Processing document..."}
            </p>
          </div>
        )}
      </div>
    </ActionWrapper>
  );
}
