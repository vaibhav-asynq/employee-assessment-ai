import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RawInterviewDataProps {
  data: any;
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
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold tracking-tight">Raw Interview Data</h2>
      
      {/* Strengths Evidence Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">STRENGTHS EVIDENCE</h3>
        <p className="text-gray-600">Below are grouped quotes that directly support each strength.</p>
        
        <div className="space-y-8">
          {Object.entries(data.strengths).map(([category, quotes]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">{category}</h4>
              <ul className="space-y-4">
                {quotes.map((quote: any, index: number) => (
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
          ))}
        </div>
      </section>

      {/* Areas to Target Evidence Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">AREAS TO TARGET EVIDENCE</h3>
        <p className="text-gray-600">Below are grouped quotes that illustrate developmental opportunities.</p>
        
        <div className="space-y-8">
          {Object.entries(data.areas_to_target).map(([category, quotes]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">{category}</h4>
              <ul className="space-y-4">
                {quotes.map((quote: any, index: number) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}