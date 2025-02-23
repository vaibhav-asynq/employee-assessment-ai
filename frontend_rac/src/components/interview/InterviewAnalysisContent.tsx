import { type Step, Stepper } from "../ui/stepper";
import { UploadScreen } from "./actions/UploadScreen";
import { FeedbackScreen } from "./actions/FeedbackScreen";
import { DownloadDataScreen } from "./actions/DownloadDataScreen";
import DataAnalysis from "./actions/DataAnalysis";

function InterviewAnalysisContent() {
  const _steps: Step[] = [
    {
      title: "Upload pdf",
      content: <UploadScreen />,
    },
    {
      title: "Feedback",
      content: <FeedbackScreen />,
    },
    {
      title: "Select Path",
      content: <DataAnalysis />,
    },
    // {
    //   title: "Download Data",
    //   content: <DownloadDataScreen />,
    // },
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
