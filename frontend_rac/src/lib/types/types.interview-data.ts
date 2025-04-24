// individual data
export type Role = string;
export type Source = string;
export type Feedback = string;

export type CompetenciesAlignment = string[];

// combined
export interface EvidenceOfFeedback {
  feedback: Feedback;
  source: Source;
  role: Role;
  strong?: "yes" | "no";
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

export type Advice = string;
export interface AdviceData {
  [key: string]: {
    advice: Advice[];
    role: Role;
  };
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
