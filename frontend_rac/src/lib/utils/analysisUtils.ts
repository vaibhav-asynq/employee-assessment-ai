import { v4 as uuidv4 } from "uuid";
import { OrderedInterviewAnalysis, InterviewAnalysis } from "@/lib/types";
import { OrderedAdvice, TemplatedData } from "../types/types.analysis";
import { AdviceData } from "../types/types.interview-data";

//--------------------------------------------------------------------------
//TODO: remove it after completing Download Screen
// Convert regular analysis to ordered analysis
export const convertToOrderedAnalysis = (
  data: InterviewAnalysis,
): OrderedInterviewAnalysis => {
  const strengthsEntries = Object.entries(data.strengths).map(
    ([heading, content]) => {
      const id = uuidv4();
      return [id, { id, heading, content }];
    },
  );
  const areasToTargetEntries = Object.entries(data.areas_to_target).map(
    ([heading, content]) => {
      const id = uuidv4();
      return [id, { id, heading, content }];
    },
  );

  return {
    ...data,
    strengths: {
      order: strengthsEntries.map(([id]) => id as string),
      items: Object.fromEntries(strengthsEntries),
    },
    areas_to_target: {
      order: areasToTargetEntries.map(([id]) => id as string),
      items: Object.fromEntries(areasToTargetEntries),
    },
  };
};

// Convert ordered analysis back to regular analysis
export const convertFromOrderedAnalysis = (
  data: OrderedInterviewAnalysis,
): InterviewAnalysis => ({
  ...data,
  strengths: Object.fromEntries(
    data.strengths.order.map((id) => [
      data.strengths.items[id].heading,
      data.strengths.items[id].content,
    ]),
  ),
  areas_to_target: Object.fromEntries(
    data.areas_to_target.order.map((id) => [
      data.areas_to_target.items[id].heading,
      data.areas_to_target.items[id].content,
    ]),
  ),
});

//--------------------------------------------------------------------------

export const mapEntriesWithUniqueId = (
  data: Record<string, string>,
): [string, { id: string; heading: string; content: string }][] => {
  return Object.entries(data).map(([heading, content]) => {
    const id = uuidv4();
    return [id, { id, heading, content }];
  });
};

export const convertInterviewAnalysisDataToTemplatedData = (
  data: InterviewAnalysis,
): TemplatedData => {
  const strengthsEntries = Object.entries(data.strengths).map(
    ([heading, content]) => {
      const id = uuidv4();
      return [id, { id, heading, content, evidance: [] }];
    },
  );
  const areasToTargetEntries = Object.entries(data.areas_to_target).map(
    ([heading, content]) => {
      const id = uuidv4();
      return [
        id,
        { id, heading, content, evidance: [], competencyAlignment: [] },
      ];
    },
  );

  return {
    ...data,
    strengths: {
      order: strengthsEntries.map(([id]) => id as string),
      items: Object.fromEntries(strengthsEntries),
    },
    areas_to_target: {
      order: areasToTargetEntries.map(([id]) => id as string),
      items: Object.fromEntries(areasToTargetEntries),
    },
    advices: [],
  };
};

export const convertFromTemplatedData = (
  data: TemplatedData,
  to: "interview-analysis",
): InterviewAnalysis | null => {
  if (to === "interview-analysis") {
    return {
      ...data,
      strengths: Object.fromEntries(
        data.strengths.order.map((id) => [
          data.strengths.items[id].heading,
          data.strengths.items[id].content,
        ]),
      ),
      areas_to_target: Object.fromEntries(
        data.areas_to_target.order.map((id) => [
          data.areas_to_target.items[id].heading,
          data.areas_to_target.items[id].content,
        ]),
      ),
    };
  }
  return null;
};

export const convertAdviceToOrderedAdvice = (
  adviceData: AdviceData,
): OrderedAdvice => {
  if (!adviceData) {
    console.warn("adviceData is undefined. Returning an empty array.");
    return [];
  }
  return Object.entries(adviceData).map(([name, { role, advice }]) => ({
    name,
    role,
    advice,
  }));
};
