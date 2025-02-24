import {
  Advice,
  AdviceData,
  CompetenciesAlignment,
  EvidenceOfFeedback,
  Role,
} from "./types.interview-data";

//INFO: mention expected templates
export const templatesIds = {
  base: "base",
  //TODO: remove that, has no reference/use
  fullReport: "full-report",
  aiCompetencies: "ai-competencies",
  aiPargraph: "ai-paragraph",
};
export type TemplateId =
  | (typeof templatesIds)[keyof typeof templatesIds]
  | string;

type StregthsAnalysis = Record<string, string>;
type AreasToTargetAnalysis = Record<string, string>;

export interface InterviewAnalysis {
  name: string;
  date: string;
  strengths: StregthsAnalysis;
  areas_to_target: AreasToTargetAnalysis;
  next_steps: NextStep[];
}

// template
interface NextStepPoint {
  main: string;
  sub_points: string[];
}
type NextStep = string | NextStepPoint;

interface AreasToTargetItem {
  id: string;
  heading: string;
  content: string;
  evidence: EvidenceOfFeedback[];
  competencyAlignment: CompetenciesAlignment;
}
export interface AreasToTarget {
  order: string[];
  items: Record<string, AreasToTargetItem>;
}

interface StrengthItem {
  id: string;
  heading: string;
  content: string;
  evidence: EvidenceOfFeedback[];
}
export interface Strengths {
  order: string[];
  items: Record<string, StrengthItem>;
}

export type OrderedAdvice = {
  name: string;
  advice: Advice[];
  role: Role;
}[];

export interface TemplatedData {
  name: string;
  date: string;
  strengths: Strengths;
  areas_to_target: AreasToTarget;
  next_steps: NextStep[];
  advices: OrderedAdvice;
}
