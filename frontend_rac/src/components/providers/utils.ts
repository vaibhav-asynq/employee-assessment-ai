import { v4 as uuidv4 } from "uuid"; // For generating unique IDs
import { InterviewAnalysis, OrderedInterviewAnalysis } from "@/lib/types";

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
