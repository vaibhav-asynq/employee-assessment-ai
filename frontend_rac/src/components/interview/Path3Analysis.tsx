import React, { useState, useCallback } from 'react';
import { Path3EditableAnalysis } from './Path3EditableAnalysis';
import { FeedbackDisplay } from './FeedbackDisplay';
import { SortedEvidenceView } from './SortedEvidenceView';
import { InterviewAnalysis } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortStrengthsEvidence, sortAreasEvidence } from '@/lib/api';

interface Path3AnalysisProps {
  feedbackData: any;
  loading: boolean;
  onUpdate: (data: Partial<InterviewAnalysis>) => void;
  fileId: string | null;
}

interface SortedEvidence {
  heading: string;
  evidence: string[];
}

interface EditableContent {
  strengths: { [key: string]: { title: string; content: string } };
  areas_to_target: { [key: string]: { title: string; content: string } };
  next_steps: Array<string | { main: string; sub_points: string[] }>;
}

export function Path3Analysis({ feedbackData, loading, onUpdate, fileId }: Path3AnalysisProps) {
  const [activeTab, setActiveTab] = useState("edit");
  const [strengthsComplete, setStrengthsComplete] = useState(false);
  const [areasComplete, setAreasComplete] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'strengths' | 'areas' | null>(null);
  const [sortedStrengths, setSortedStrengths] = useState<SortedEvidence[] | undefined>();
  const [sortedAreas, setSortedAreas] = useState<SortedEvidence[] | undefined>();
  const [sortingLoading, setSortingLoading] = useState(false);
  const [strengthsSorted, setStrengthsSorted] = useState(false);
  const [areasSorted, setAreasSorted] = useState(false);
  
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

  const handleSortEvidence = useCallback(async (section: 'strengths' | 'areas') => {
    if (!fileId) return;
    
    try {
      setSortingLoading(true);
      
      if (section === 'strengths') {
        const headings = Object.values(editableContent.strengths).map(s => s.title);
        const sortedData = await sortStrengthsEvidence(fileId, headings);
        setSortedStrengths(sortedData);
        setStrengthsSorted(true);
      } else {
        const headings = Object.values(editableContent.areas_to_target).map(a => a.title);
        const sortedData = await sortAreasEvidence(fileId, headings);
        setSortedAreas(sortedData);
        setAreasSorted(true);
      }
      
      setSelectedSection(section);
      setActiveTab('sorted');
    } catch (error) {
      console.error('Error sorting evidence:', error);
      // You might want to show an error message to the user here
    } finally {
      setSortingLoading(false);
    }
  }, [fileId, editableContent]);

  const handleSortAllEvidence = useCallback(async () => {
    if (!fileId) return;
    
    try {
      setSortingLoading(true);
      
      const strengthsHeadings = Object.values(editableContent.strengths).map(s => s.title);
      const areasHeadings = Object.values(editableContent.areas_to_target).map(a => a.title);
      
      const [strengthsData, areasData] = await Promise.all([
        sortStrengthsEvidence(fileId, strengthsHeadings),
        sortAreasEvidence(fileId, areasHeadings)
      ]);
      
      setSortedStrengths(strengthsData);
      setSortedAreas(areasData);
      setStrengthsSorted(true);
      setAreasSorted(true);
      setSelectedSection(null); // Show both sections
      setActiveTab('sorted');
    } catch (error) {
      console.error('Error sorting evidence:', error);
    } finally {
      setSortingLoading(false);
    }
  }, [fileId, editableContent]);

  return (
    <div className="flex">
      {/* Left Sidebar */}
      <div className="w-64 min-h-screen bg-gray-100 p-4 border-r fixed left-0 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Evidence Sorting</h3>
          <Card className="p-3 bg-white/50 backdrop-blur-sm">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-start text-sm font-medium",
                  strengthsSorted && "text-green-600"
                )}
                onClick={() => handleSortEvidence('strengths')}
                disabled={!strengthsComplete || sortingLoading}
              >
                {sortingLoading && selectedSection === 'strengths' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : strengthsSorted ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                )}
                Sort Strengths
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-start text-sm font-medium",
                  areasSorted && "text-green-600"
                )}
                onClick={() => handleSortEvidence('areas')}
                disabled={!areasComplete || sortingLoading}
              >
                {sortingLoading && selectedSection === 'areas' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : areasSorted ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                )}
                Sort Areas
              </Button>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm font-medium",
                    strengthsSorted && areasSorted && "text-blue-600"
                  )}
                  onClick={handleSortAllEvidence}
                  disabled={!strengthsComplete || !areasComplete || sortingLoading}
                >
                  {sortingLoading && !selectedSection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (strengthsSorted && areasSorted) ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                  )}
                  Sort All Evidence
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center mb-6">
            <TabsList>
              <TabsTrigger value="edit">Edit Analysis</TabsTrigger>
              <TabsTrigger value="sorted" disabled={!sortedStrengths && !sortedAreas}>
                Sorted Evidence
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit">
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
                  onStrengthsComplete={setStrengthsComplete}
                  onAreasComplete={setAreasComplete}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sorted">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Sorted Evidence</h2>
                </div>
                <SortedEvidenceView
                  strengthsEvidence={sortedStrengths}
                  areasEvidence={sortedAreas}
                  selectedSection={selectedSection}
                />
              </div>
              <div className="border-l pl-8">
                <Path3EditableAnalysis 
                  data={analysisData}
                  onUpdate={handleUpdate}
                  fileId={fileId}
                  onStrengthsComplete={setStrengthsComplete}
                  onAreasComplete={setAreasComplete}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
