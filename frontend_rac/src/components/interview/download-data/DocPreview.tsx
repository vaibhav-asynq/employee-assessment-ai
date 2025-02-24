import React from "react";
import { InterviewAnalysis } from "@/lib/types";

interface Props {
  docUrl: string | null;
  reportData: InterviewAnalysis | null;
}

export function DocPreview({ reportData, docUrl }: Props) {
  return (
    <>
      <div className="mt-4">
        {docUrl ? (
          <iframe
            src={docUrl}
            className="w-full h-[600px] border rounded-lg"
            title="Document Preview"
          />
        ) : (
          <div className="w-full h-[600px] border rounded-lg flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Loading document preview...</p>
          </div>
        )}
      </div>
    </>
  );
}

export default DocPreview;
