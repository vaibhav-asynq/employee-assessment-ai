import axios from 'axios';
import { NextStep } from './types';

const API_URL = 'http://localhost:8000';

export interface Evidence {
  feedback: string;
  source: string;
  role: string;
}

export interface Category {
  evidence: Evidence[];
}

export interface StrengthEvidences {
  leadershipQualities: {
    [key: string]: Category;
  };
}

export interface DevelopmentAreas {
  developmentAreas: {
    [key: string]: Category;
  };
}

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/api/upload_file`, formData);
  return response.data.file_id;
};

export const generateReport = async (fileId: string) => {
  const response = await axios.get(`${API_URL}/api/generate_report/${fileId}`);
  return response.data;
};

export const getFeedback = async () => {
  const response = await axios.get(`${API_URL}/api/get_feedback`);
  return response.data;
};

export const getRawData = async (fileId: string) => {
  const response = await axios.get(`${API_URL}/api/get_raw_data/${fileId}`);
  return response.data;
};

export const getStrengthEvidences = async (): Promise<StrengthEvidences> => {
  const response = await axios.get(`${API_URL}/api/get_strength_evidences`);
  return response.data;
};

export const getDevelopmentAreas = async (): Promise<DevelopmentAreas> => {
  const response = await axios.get(`${API_URL}/api/get_development_areas`);
  return response.data;
};

export const generateWordDocument = async (data: any) => {
  const response = await axios.post(`${API_URL}/api/dump_word`, data, {
    responseType: 'blob'
  });
  return response.data;
};

export const generateStrengthContent = async (heading: string, fileId: string): Promise<string> => {
  const response = await axios.post(`${API_URL}/api/generate_strength_content`, { heading, file_id: fileId });
  return response.data.content;
};

export const generateAreaContent = async (heading: string, fileId: string): Promise<string> => {
  const response = await axios.post(`${API_URL}/api/generate_area_content`, { heading, file_id: fileId });
  return response.data.content;
};

export const generateNextSteps = async (areasToTarget: { [key: string]: string }, fileId: string): Promise<NextStep[]> => {
  const response = await axios.post(`${API_URL}/api/generate_next_steps`, {
    areas_to_target: areasToTarget,
    file_id: fileId
  });
  return response.data.next_steps;
};

export interface SortedEvidence {
  heading: string;
  evidence: string[];
}

export async function sortStrengthsEvidence(fileId: string, headings: string[]) {
  const response = await axios.post(`${API_URL}/api/sort-strengths-evidence`, {
    file_id: fileId,
    headings
  });

  if (!response.data) {
    throw new Error('Failed to sort strengths evidence');
  }

  return response.data;
}

export async function sortAreasEvidence(fileId: string, headings: string[]) {
  const response = await axios.post(`${API_URL}/api/sort-areas-evidence`, {
    file_id: fileId,
    headings
  });

  if (!response.data) {
    throw new Error('Failed to sort areas evidence');
  }

  return response.data;
}
