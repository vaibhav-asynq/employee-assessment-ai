import { InterviewAnalysis } from "@/lib/types";

//INFO: if needed blank boxes use different object keys [no of spaces]
export const base: InterviewAnalysis = {
  name: "",
  date: new Date().toISOString(),
  strengths: {
    "": "",
    " ": "",
    "  ": "",
  },
  areas_to_target: {
    "": "",
    " ": "",
    "  ": "",
    "   ": "",
  },
  next_steps: [
    { main: "", sub_points: ["", "", ""] },
    "",
    { main: "", sub_points: ["", "", ""] },
    { main: "", sub_points: ["", "", ""] },
    { main: "", sub_points: ["", "", ""] },
  ],
};
