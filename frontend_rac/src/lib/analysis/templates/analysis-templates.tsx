import { InterviewAnalysis } from "@/lib/types";

export const coachCompetenciesTemplate: InterviewAnalysis = {
  name: "",
  date: new Date().toISOString(),
  strengths: {
    "Strength 1": "",
    "Strength 2": "",
    "Strength 3": "",
  },
  areas_to_target: {
    "Development Area 1": "",
    "Development Area 2": "",
    "Development Area 3": "",
    "Development Area 4": "",
  },
  next_steps: [
    { main: "Next Step 1", sub_points: ["", "", ""] },
    "",
    { main: "Next Step 3", sub_points: ["", "", ""] },
    { main: "Next Step 4", sub_points: ["", "", ""] },
    { main: "Next Step 5", sub_points: ["", "", ""] },
  ],
};
