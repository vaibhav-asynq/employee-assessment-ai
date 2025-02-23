// src/components/interview/UploadSection.tsx
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface UploadSectionProps {
  loading: boolean;
  file: File | null;
  uploadProgress: 'uploading' | 'processing' | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadScreen({ loading, file, uploadProgress, onFileUpload }: UploadSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Interview Transcript</h2>
      <div className="flex items-center gap-4">
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          variant="outline"
          disabled={loading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Select PDF
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          className="hidden"
        />
        {loading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">
              {uploadProgress === 'uploading' ? 'Uploading file...' : 'Processing document...'}
            </span>
          </div>
        )}
      </div>
      {file && (
        <p className="text-sm text-gray-500">
          Selected file: {file.name}
        </p>
      )}
    </div>
  );
}
