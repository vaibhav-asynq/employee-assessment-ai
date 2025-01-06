// src/lib/api.ts
import { InterviewAnalysis } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload_file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data.file_id;
}

export async function generateReport(fileId: string): Promise<InterviewAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/generate_report/${fileId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return response.json();
}

export async function generateWordDocument(data: InterviewAnalysis): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/dump_word`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate Word document');
  }

  return response.blob();
}