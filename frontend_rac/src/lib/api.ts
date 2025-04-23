import axios from "axios";
import { NextStep } from "./types";
import { useAuthStore } from "@/zustand/store/authStore";
import { Task } from "./types/types.filetask";

//TODO: use other specified types in the types folder
// const API_URL = "http://34.202.149.23:8000";
const API_URL = "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add request interceptor to add username to requests
api.interceptors.request.use(
  (config) => {
    const { user } = useAuthStore.getState();
    if (user && user.username) {
      config.headers.username = user.username;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export interface FeedbackEvidence {
  feedback: string;
  source: string;
  role: string;
}

export interface Category {
  evidence: FeedbackEvidence[];
}

export interface StrengthEvidences {
  leadershipQualities: {
    [key: string]: Category;
  };
}

export interface DevelopmentAreas {
  developmentAreas: {
    [key: string]: {
      evidence: FeedbackEvidence[];
      competencyAlignment: string[];
    };
  };
}

export interface Evidence {
  quote: string;
  name: string;
  position: string;
}

export interface SortedEvidence {
  heading: string;
  evidence: Evidence[];
}

// Authentication functions
export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await axios.post(`${API_URL}/api/login`, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const { user } = useAuthStore.getState();
  if (user) {
    const response = await api.get(`/api/users/me`, {
      headers: { username: user.username },
    });
    return response.data;
  }
  throw new Error("Not authenticated");
};

// -------------------------------------------
// API functions using the authenticated axios instance
export const uploadFile = async (file: File, useCache: boolean = true) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    `/api/upload_file?use_cache=${useCache}`,
    formData,
  );
  return response.data.file_id;
};

export const generateReport = async (
  fileId: string,
  useCache: boolean = true,
) => {
  const response = await api.get(
    `/api/generate_report/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const getFeedback = async (fileId: string, useCache: boolean = true) => {
  const response = await api.get(
    `/api/get_feedback/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const getAdvice = async (fileId: string, useCache: boolean = true) => {
  const response = await api.get(
    `/api/get_advice/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const getRawData = async (fileId: string, useCache: boolean = true) => {
  const response = await api.get(
    `/api/get_raw_data/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const getStrengthEvidences = async (
  fileId: string,
  numCompetencies: number,
  useCache: boolean = true,
): Promise<StrengthEvidences> => {
  const response = await api.get(`/api/get_strength_evidences/${fileId}`, {
    params: { numCompetencies, use_cache: useCache },
  });
  return response.data;
};

export const getFileTaskHistory = async (userId: string): Promise<Task[]> => {
  const response = await api.get(`/api/tasks/`, {
    params: { user_id: userId },
  });
  return response.data;
};

export const getDevelopmentAreas = async (
  fileId: string,
  numCompetencies: number,
  useCache: boolean = true,
): Promise<DevelopmentAreas> => {
  const response = await api.get(`/api/get_development_areas/${fileId}`, {
    params: { numCompetencies, use_cache: useCache },
  });
  return response.data;
};
// -------------------------------------------
export const generateWordDocument = async (data: any) => {
  const response = await api.post(`/api/dump_word`, data, {
    responseType: "blob",
  });
  return response.data;
};

export const generatePdfDocument = async (data: any) => {
  const response = await api.post(`/api/dump_pdf`, data, {
    responseType: "blob",
  });
  return response.data;
};

export const uploadUpdatedReport = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/api/upload_updated_report`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const generateStrengthContent = async (
  heading: string,
  fileId: string,
  existingContent: string,
): Promise<string> => {
  const response = await api.post(`/api/generate_strength_content`, {
    heading,
    file_id: fileId,
    existing_content: existingContent,
  });
  return response.data.content;
};

export const generateAreaContent = async (
  heading: string,
  fileId: string,
  existingContent: string,
): Promise<string> => {
  const response = await api.post(`/api/generate_area_content`, {
    heading,
    file_id: fileId,
    existing_content: existingContent,
  });
  return response.data.content;
};

export const generateNextSteps = async (
  areasToTarget: { [key: string]: string },
  fileId: string,
): Promise<NextStep[]> => {
  const response = await api.post(`/api/generate_next_steps`, {
    areas_to_target: areasToTarget,
    file_id: fileId,
  });
  return response.data.next_steps;
};

export async function sortStrengthsEvidence(
  fileId: string,
  headings: string[],
) {
  const response = await api.post(`/api/sort-strengths-evidence`, {
    file_id: fileId,
    headings,
  });

  if (!response.data) {
    throw new Error("Failed to sort strengths evidence");
  }

  return response.data;
}

export async function sortAreasEvidence(fileId: string, headings: string[]) {
  const response = await api.post(`/api/sort-areas-evidence`, {
    file_id: fileId,
    headings,
  });

  if (!response.data) {
    throw new Error("Failed to sort areas evidence");
  }

  return response.data;
}
