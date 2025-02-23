import { type Step, Stepper } from "../ui/stepper";
import { UploadSection } from "./actions/UploadSection";
import { FeedbackScreen } from "./actions/FeedbackScreen";
import { DownloadDataScreen } from "./actions/DownloadDataScreen";
import DataAnalysis from "./actions/DataAnalysis";

function InterviewAnalysisContent() {
  const _steps: Step[] = [
    {
      title: "Upload pdf",
      content: <UploadSection />,
    },
    {
      title: "Feedback",
      content: <FeedbackScreen />,
    },
    {
      title: "Select Path",
      content: <DataAnalysis />,
    },
    {
      title: "Download Data",
      content: <DownloadDataScreen />,
    },
  ];

  return (
    <>
      <Stepper
        steps={_steps}
        showNavigationButtons={false}
        showTitles={false}
        classNameContents="mt-8"
      />
    </>
  );
}

export default InterviewAnalysisContent;
