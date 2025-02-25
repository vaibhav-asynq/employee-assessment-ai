import { NextSteps } from "@/lib/types/types.analysis";

export function initializeNextSteps(): NextSteps {
  return [
    { main: "", sub_points: ["", "", ""] },  // First point with 3 sub-points
    "",                                      // Text box
    { main: "", sub_points: ["", "", ""] },  // Second point with 3 sub-points
    { main: "", sub_points: ["", "", ""] },  // Third point with 3 sub-points
    { main: "", sub_points: ["", "", ""] },  // Fourth point with 3 sub-points
  ];
}
