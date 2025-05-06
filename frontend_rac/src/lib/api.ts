//TODO: use other specified types in the types folder
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { NextStep } from "./types";
import { useAuthStore } from "@/zustand/store/authStore";
import { Task } from "./types/types.filetask";
import { AdviceData, FeedbackData } from "./types/types.interview-data";
import { Snapshot } from "./types/types.snapshot";

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("❌ Missing required env: NEXT_PUBLIC_API_BASE_URL");
}

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Flag to prevent infinite retry loops
let isRefreshing = false;
// Store for requests that should be retried after token refresh
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}[] = [];

// Process the queue of failed requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token && request.config.headers) {
      request.config.headers.Authorization = `Bearer ${token}`;
      request.resolve(api(request.config));
    }
  });

  failedQueue = [];
};

// Add request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          headers: { Authorization: `Bearer ${token.substring(0, 10)}...` },
        },
      );
    } else {
      console.warn(
        `API Request without token: ${config.method?.toUpperCase()} ${config.url}`,
      );
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
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

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Received 401 error, attempting to refresh token...");

      if (isRefreshing) {
        // If we're already refreshing, add this request to the queue
        console.log(
          "Token refresh already in progress, adding request to queue",
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        // This will trigger the Clerk token refresh
        const { refreshToken } = useAuthStore.getState();

        if (refreshToken) {
          console.log("Calling refreshToken function");
          const newToken = await refreshToken();

          if (newToken && originalRequest.headers) {
            console.log("Token refreshed successfully, retrying request");
            // Update the Authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Process any queued requests with the new token
            processQueue(null, newToken);

            // Retry the original request with the new token
            return api(originalRequest);
          } else {
            console.error("Failed to get new token after refresh");
          }
        } else {
          console.error("No refreshToken function available");
        }

        // If we couldn't refresh the token, process the queue with an error
        processQueue(new Error("Failed to refresh token"));
        return Promise.reject(error);
      } catch (refreshError) {
        console.error("Error during token refresh:", refreshError);
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export interface FeedbackEvidence {
  feedback: string | { text: string; is_strong?: boolean };
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

export const getFeedback = async (
  fileId: string,
  useCache: boolean = true,
): Promise<FeedbackData> => {
  const response = await api.get(
    `/api/get_feedback/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const getAdvice = async (
  fileId: string,
  useCache: boolean = true,
): Promise<AdviceData> => {
  const response = await api.get(
    `/api/get_advice/${fileId}?use_cache=${useCache}`,
  );
  return response.data;
};

export const manualReportStakeholderData = async (
  fileId: string,
  useCache: boolean = true,
): Promise<{
  feedbackData: FeedbackData;
  adviceData: AdviceData;
}> => {
  try {
    const [feedbackData, adviceData] = await Promise.all([
      getFeedback(fileId, useCache),
      getAdvice(fileId, useCache),
    ]);

    if (!feedbackData) {
      console.error("No feedback data received from API");
    }
    if (!adviceData) {
      console.error("No adviceData data received from API");
    }
    const data = { feedbackData, adviceData };
    return data;
  } catch (err) {
    console.log("can not fetch manualReportStakeholderData");
    throw err;
  }
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

// Snapshot API functions
export const saveSnapshot = async (
  snapshotData: import("./types/types.snapshot").SnapshotCreateRequest,
  user_id: string,
  make_current: boolean = false,
) => {
  try {
    const response = await api.post(
      `/api/snapshots/create?user_id=${user_id}&make_current=${make_current}`,
      snapshotData,
    );
    return response.data;
  } catch (error) {
    console.error("Error saving snapshot:", error);
    throw error;
  }
};

export const getLatestSnapshot = async (
  fileId: string,
  userId: string,
): Promise<Snapshot> => {
  try {
    const response = await api.get(
      `/api/snapshots/latest/${fileId}?user_id=${userId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching latest snapshot:", error);
    throw error;
  }
};

export const getCurrentSnapshot = async (fileId: string) => {
  try {
    const response = await api.get(`/api/snapshots/current/${fileId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current snapshot:", error);
    throw error;
  }
};

export const getSnapshotByIdOld = async (
  snapshotId: number,
  userId: string,
) => {
  try {
    const response = await api.get(
      `/api/snapshots/${snapshotId}?user_id=${userId}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching snapshot with ID ${snapshotId}:`, error);
    throw error;
  }
};

export const getSnapshotById = async (snapshotId: number) => {
  try {
    const response = await api.get(`/api/snapshots/${snapshotId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching snapshot with ID ${snapshotId}:`, error);
    throw error;
  }
};

export const getSnapshotHistory = async (
  fileId: string,
  limit?: number,
  offset?: number,
) => {
  try {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", limit.toString());
    if (offset !== undefined) params.append("offset", offset.toString());

    const response = await api.get(
      `/api/snapshots/history/${fileId}?${params.toString()}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching snapshot history:", error);
    throw error;
  }
};

export const setCurrentSnapshot = async (
  fileId: string,
  snapshotId: number,
) => {
  try {
    const response = await api.post(
      `/api/snapshots/set-current/${fileId}/${snapshotId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error setting current snapshot:", error);
    throw error;
  }
};
