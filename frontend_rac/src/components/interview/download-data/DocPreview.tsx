import React, { useState } from "react";
import { EditableWordViewer } from "./EditableWordViewer";
import { InterviewAnalysis } from "@/lib/types";

interface Props {
  docUrl: string | null;
  previewError: boolean;
  reportData: InterviewAnalysis | null;
}

export function DocPreview({ reportData, docUrl, previewError }: Props) {
  const [editedContent, setEditedContent] = useState<string | null>(null);

  return (
    <>
      {/* Document Preview */}
      {docUrl && !previewError && (
        <div className="mt-4">
          <EditableWordViewer
            documentUrl={docUrl}
            onContentChange={(content) => setEditedContent(content)}
            analysis={reportData}
          />
        </div>
      )}

      {previewError && (
        <div className="mt-4 p-4 text-red-600 bg-red-50 rounded-lg">
          <p>Failed to load document preview.</p>
          <p className="mt-2">
            You can still{" "}
            {docUrl && (
              <>
                <a
                  href={docUrl}
                  className="underline hover:text-red-800"
                  download
                >
                  download the document
                </a>{" "}
                or{" "}
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-800"
                >
                  open it in a new tab
                </a>
              </>
            )}
            .
          </p>
        </div>
      )}
    </>
  );
}

export default DocPreview;
