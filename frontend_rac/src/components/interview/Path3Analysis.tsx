import React, { useState } from 'react';
import { Path3EditableAnalysis } from './Path3EditableAnalysis';
import { FeedbackDisplay } from './FeedbackDisplay';
import { InterviewAnalysis } from '@/lib/types';

interface Path3AnalysisProps {
  feedbackData: any;
  loading: boolean;
  onUpdate: (data: Partial<InterviewAnalysis>) => void;
  fileId: string | null;
}

interface EditableContent {
  strengths: { [key: string]: { title: string; content: string } };
  areas_to_target: { [key: string]: { title: string; content: string } };
  next_steps: Array<string | { main: string; sub_points: string[] }>;
}

export function Path3Analysis({ feedbackData, loading, onUpdate, fileId }: Path3AnalysisProps) {
  // Initialize with placeholder text for each section
  const [editableContent, setEditableContent] = useState<EditableContent>({
    strengths: {
      "box1": { title: "Strength 1", content: "" },
      "box2": { title: "Strength 2", content: "" },
      "box3": { title: "Strength 3", content: "" }

    },
    areas_to_target: {
      "box1": { title: "Development Area 1", content: "" },
      "box2": { title: "Development Area 2", content: "" },
      "box3": { title: "Development Area 3", content: "" },
      "box4": { title: "Development Area 4", content: "" }
    },
    next_steps: [
      { main: "Next Step 1", sub_points: ["", "", ""] },
      "",
      { main: "Next Step 3", sub_points: ["", "", ""] },
      { main: "Next Step 4", sub_points: ["", "", ""] },
      { main: "Next Step 5", sub_points: ["", "", ""] }
    ]
  });

  const handleUpdate = (updatedData: InterviewAnalysis) => {
    // Convert the updated data back to editable content format
    const newEditableContent = {
      strengths: Object.fromEntries(
        Object.entries(updatedData.strengths).map(([key, value], index) => [
          `box${index + 1}`,
          { title: key, content: value }
        ])
      ),
      areas_to_target: Object.fromEntries(
        Object.entries(updatedData.areas_to_target).map(([key, value], index) => [
          `box${index + 1}`,
          { title: key, content: value }
        ])
      ),
      next_steps: updatedData.next_steps
    };

    setEditableContent(newEditableContent);

    // Convert editable content to analysis data format for parent update
    const analysisData: InterviewAnalysis = {
      name: updatedData.name,
      date: updatedData.date,
      strengths: Object.fromEntries(
        Object.values(newEditableContent.strengths).map(item => [item.title || "", item.content || ""])
      ),
      areas_to_target: Object.fromEntries(
        Object.values(newEditableContent.areas_to_target).map(item => [item.title || "", item.content || ""])
      ),
      next_steps: newEditableContent.next_steps
    };

    onUpdate(analysisData);
  };

  // Convert editable content to analysis data format for EditableAnalysis
  const analysisData: InterviewAnalysis = {
    name: '',
    date: new Date().toISOString(),
    strengths: Object.fromEntries(
      Object.values(editableContent.strengths).map(item => [item.title || "", item.content || ""])
    ),
    areas_to_target: Object.fromEntries(
      Object.values(editableContent.areas_to_target).map(item => [item.title || "", item.content || ""])
    ),
    next_steps: editableContent.next_steps
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Interview Feedback</h2>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading feedback data...</p>
          </div>
        ) : feedbackData ? (
          <FeedbackDisplay data={feedbackData} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No feedback data available</p>
          </div>
        )}
      </div>
      <div className="border-l pl-8">
        <Path3EditableAnalysis 
          data={analysisData}
          onUpdate={handleUpdate}
          fileId={fileId}
        />
      </div>
    </div>
  );
}
