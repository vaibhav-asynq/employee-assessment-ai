import axios from 'axios';

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
