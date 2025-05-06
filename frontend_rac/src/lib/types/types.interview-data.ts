// individual data
export type Role = string;
export type Source = string;
export type Feedback = string | { text: string; is_strong?: boolean };

export type CompetenciesAlignment = string[];

// feedback data
type StregthsFeedback = Record<string, { role: string; feedback: Feedback[] }>;
type AreasToTargetFeedback = Record<
  string,
  { role: string; feedback: Feedback[] }
>;
export interface FeedbackData {
  strengths: StregthsFeedback;
  areas_to_target: AreasToTargetFeedback;
}

// advice data
export type Advice = string | { text: string; is_strong?: boolean };
export interface AdviceInfo {
  advice: Advice[];
  role: Role;
}
export interface AdviceData {
  [key: string]: AdviceInfo;
}

// combined
export interface EvidenceOfFeedback {
  feedback: Feedback;
  source: Source;
  role: Role;
  is_strong?: boolean;
}

interface DevelopmentAreas {
  [key: string]: {
    evidence: EvidenceOfFeedback[];
    competencyAlignment: CompetenciesAlignment;
  };
}

interface LeadershipQualities {
  [key: string]: {
    evidence: EvidenceOfFeedback[];
  };
}

export interface DevelopmentData {
  developmentAreas: DevelopmentAreas;
}

export interface StrengthData {
  leadershipQualities: LeadershipQualities;
}

//TODO: WTF is this used?
export interface Evidence {
  quote: string;
  name: string;
  position: string;
}

export interface SortedEvidence {
  heading: string;
  evidence: Evidence[];
}
