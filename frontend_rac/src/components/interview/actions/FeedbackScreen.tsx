"use client";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface AdviceInfo {
  role: string;
  advice: string[];
}

interface AdviceData {
  [key: string]: AdviceInfo;
}
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { isBlankJson, useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { useStepper } from "@/components/ui/stepper";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";
import { FeedbackDisplay } from "../analysis/FeedbackDisplay";
import { saveSnapshot } from "@/lib/api";

export function FeedbackScreen() {
  const error = useInterviewDataStore((state) => state.error);
  const loading = useInterviewDataStore((state) => state.loading);
  const fileId = useInterviewDataStore((state) => state.fileId);
  const feedbackData = useInterviewDataStore((state) => state.feedbackData);
  const adviceData = useInterviewDataStore((state) => state.adviceData);
  const fetchFeedbackData = useInterviewDataStore(
    (state) => state.fetchFeedbackData,
  );
  const { loadSnapshot } = useSnapshotLoader(null, true);
  const { saveSnapshotToDb } = useSnapshotSaver();
  const { nextStep } = useStepper();

  const [useCache, setUseCache] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (fileId && (!feedbackData || isBlankJson(feedbackData))) {
        console.log("===> calling useEffect");
        try {
          const data = await loadSnapshot();
          // const data = feedbackData;
          if (
            !data ||
            isBlankJson(
              data.manual_report.sorted_by?.stakeholders?.adviceData ?? {},
            ) ||
            isBlankJson(
              data.manual_report.sorted_by?.stakeholders?.feedbackData ?? {},
            )
          ) {
            console.log("NO SNAPSHOT DATA, FETCHING FEEDBACK DIRECTLY");
            await fetchFeedbackData(useCache);
          } else {
            console.log("LOADED DATA FROM SNAPSHOT");
            nextStep();
          }
        } catch (error) {
          console.error("Error loading data:", error);
          await fetchFeedbackData(useCache);
        }
      }
    };

    fetch();
    // This effect should only run when fileId changes or when feedbackData is null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  if (loading && !feedbackData) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center animate-spin">
          <Loader2 />
        </div>
      </ActionWrapper>
    );
  }
  if (fileId && !feedbackData) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center animate-spin">
          <Loader2 />
        </div>
      </ActionWrapper>
    );
  }
  if (!loading && error && !feedbackData) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <p className="text-xl font-semibold text-red-600">
              Error Loading Data
            </p>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => fetchFeedbackData(useCache)}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </ActionWrapper>
    );
  }
  if (!loading && !feedbackData) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <p className="text-xl font-semibold text-amber-600">
              No Feedback Data Available
            </p>
            <p className="text-gray-600">
              {fileId
                ? "There was a problem retrieving feedback data for this task."
                : "Please select a task from the sidebar or upload a new file."}
            </p>
            {fileId && (
              <Button
                onClick={() => fetchFeedbackData(useCache)}
                className="mt-4"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </ActionWrapper>
    );
  }
  if (!feedbackData) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center space-y-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="use-cache-feedback"
              checked={useCache}
              onChange={(e) => setUseCache(e.target.checked)}
              className="mr-2 h-4 w-4"
            />
            <label
              htmlFor="use-cache-feedback"
              className="text-sm text-gray-700"
            >
              Use cached results if available
            </label>
          </div>
          <Button
            onClick={async (e) => {
              e.preventDefault();
              await fetchFeedbackData(useCache);
            }}
          >
            Get Feedback Data
          </Button>
        </div>
      </ActionWrapper>
    );
  }

  return (
    <ActionWrapper>
      <div className="pr-4 max-h-[80vh] overflow-y-auto">
        <div className="space-y-16 pb-8">
          <FeedbackDisplay data={feedbackData} />
          {/* Strengths */}
          {/* <div className="space-y-6"> */}
          {/*   <h2 className="text-2xl font-bold mb-6 text-green-700 sticky top-0 bg-white py-4"> */}
          {/*     Strengths */}
          {/*   </h2> */}
          {/*   <div className="space-y-8"> */}
          {/*     {Object.entries(feedbackData.strengths).map(([name, info]) => ( */}
          {/*       <div key={name} className="border-b pb-6"> */}
          {/*         <h3 className="text-xl font-semibold"> */}
          {/*           {name.replace(/_/g, " ")} */}
          {/*         </h3> */}
          {/*         <p className="text-gray-600 italic mb-3">{info.role}</p> */}
          {/*         <ul className="list-disc pl-5 space-y-2"> */}
          {/*           {info.feedback.map((point, index) => ( */}
          {/*             <li key={index} className="text-gray-800"> */}
          {/*               {/* {point} */}
          {/*             </li> */}
          {/*           ))} */}
          {/*         </ul> */}
          {/*       </div> */}
          {/*     ))} */}
          {/*   </div> */}
          {/* </div> */}

          {/* Areas to Target */}
          {/* <div className="space-y-6 border-t pt-8"> */}
          {/*   <h2 className="text-2xl font-bold mb-6 text-red-700 sticky top-0 bg-white py-4"> */}
          {/*     Areas to Target */}
          {/*   </h2> */}
          {/*   <div className="space-y-8"> */}
          {/*     {Object.entries(feedbackData.areas_to_target).map( */}
          {/*       ([name, info]) => ( */}
          {/*         <div key={name} className="border-b pb-6"> */}
          {/*           <h3 className="text-xl font-semibold"> */}
          {/*             {name.replace(/_/g, " ")} */}
          {/*           </h3> */}
          {/*           <p className="text-gray-600 italic mb-3">{info.role}</p> */}
          {/*           <ul className="list-disc pl-5 space-y-2"> */}
          {/*             {info.feedback.map((point, index) => ( */}
          {/*               <li key={index} className="text-gray-800"> */}
          {/*                 {/* {point} */}
          {/*               </li> */}
          {/*             ))} */}
          {/*           </ul> */}
          {/*         </div> */}
          {/*       ), */}
          {/*     )} */}
          {/*   </div> */}
          {/* </div> */}

          {/* Advice */}
          {/* <div className="space-y-6 border-t pt-8"> */}
          {/*   <h2 className="text-2xl font-bold mb-6 text-indigo-700 sticky top-0 bg-white py-4"> */}
          {/*     Advice */}
          {/*   </h2> */}
          {/*   <div className="space-y-8"> */}
          {/*     {adviceData && */}
          {/*       Object.entries(adviceData as AdviceData).map(([name, info]) => ( */}
          {/*         <div key={name} className="border-b pb-6"> */}
          {/*           <h3 className="text-xl font-semibold"> */}
          {/*             {name.replace(/_/g, " ")} */}
          {/*           </h3> */}
          {/*           <p className="text-gray-600 italic mb-3">{info.role}</p> */}
          {/*           <ul className="list-disc pl-5 space-y-2"> */}
          {/*             {info.advice.map((point: string, index: number) => ( */}
          {/*               <li key={index} className="text-gray-800"> */}
          {/*                 {point} */}
          {/*               </li> */}
          {/*             ))} */}
          {/*           </ul> */}
          {/*         </div> */}
          {/*       ))} */}
          {/*   </div> */}
          {/* </div> */}
        </div>
      </div>
    </ActionWrapper>
  );
}
