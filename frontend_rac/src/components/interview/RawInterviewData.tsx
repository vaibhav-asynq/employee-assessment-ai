import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Quote {
  name: string;
  role: string;
  quotes: string[];
}

interface RawData {
  strengths: {
    [key: string]: Quote[];
  };
  areas_to_target: {
    [key: string]: Quote[];
  };
}

interface RawInterviewDataProps {
  data: RawData | null;
  loading: boolean;
  error: string;
}

export function RawInterviewData({ data, loading, error }: RawInterviewDataProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Generating raw interview data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight mb-8">Raw Interview Data</h2>
      
      {/* Strengths Evidence Section */}
      <section className="mb-8">
        <div className="sticky top-0 bg-white z-10 pb-6">
          <h3 className="text-xl font-semibold text-gray-900 py-2">STRENGTHS</h3>
          <p className="text-gray-600 h-[24px]">Below are grouped quotes that directly support each strength.</p>
        </div>
        
        <div>
          {Object.entries(data.strengths).map(([category, quotes]: [string, Quote[]]) => (
            <div key={category} className="mb-8">
              <div className="h-[40px] flex items-center">
                <h4 className="text-lg font-semibold text-gray-800">{category}</h4>
              </div>
              <div className="mt-2">
                <ul className="space-y-4">
                  {quotes.map((quote: Quote, index: number) => (
                    <li key={index} className="space-y-2">
                      <p className="font-medium">{quote.name} ({quote.role}):</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {quote.quotes.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Areas to Target Evidence Section */}
      <section className="mb-8">
        <div className="sticky top-0 bg-white z-10 pb-6">
          <h3 className="text-xl font-semibold text-gray-900 py-2">AREAS TO TARGET</h3>
          <p className="text-gray-600 h-[24px]">Below are grouped quotes that illustrate developmental opportunities.</p>
        </div>
        
        <div>
          {Object.entries(data.areas_to_target).map(([category, quotes]: [string, Quote[]]) => (
            <div key={category} className="mb-8">
              <div className="h-[40px] flex items-center">
                <h4 className="text-lg font-semibold text-gray-800">{category}</h4>
              </div>
              <div className="mt-2">
                <ul className="space-y-4">
                  {quotes.map((quote: Quote, index: number) => (
                    <li key={index} className="space-y-2">
                      <p className="font-medium">{quote.name} ({quote.role}):</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {quote.quotes.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
