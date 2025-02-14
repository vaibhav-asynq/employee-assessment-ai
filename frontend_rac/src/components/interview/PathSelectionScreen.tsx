import React from 'react';
import { Button } from '@/components/ui/button';

interface PathSelectionScreenProps {
  onSelectPath: (path: number) => void;
}

export function PathSelectionScreen({ onSelectPath }: PathSelectionScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <h2 className="text-3xl font-bold text-center">Select Analysis Path</h2>
      
      <div className="grid grid-cols-2 gap-8 w-full max-w-3xl">
        <Button 
          variant="outline" 
          size="lg"
          className="h-40 flex flex-col items-center justify-center gap-2 px-4 hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(1)}
        >
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border-2 border-green-200">
            1
          </div>
          <div className="text-sm text-center w-full">Generate Full Report</div>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-40 flex flex-col items-center justify-center gap-2 px-4 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(2)}
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl border-2 border-blue-200">
            2
          </div>
          <div className="text-sm text-center w-full whitespace-normal">Have AI generate the competencies and coach writes the underlying paragraphs</div>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-40 flex flex-col items-center justify-center gap-2 px-4 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(3)}
        >
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl border-2 border-purple-200">
            3
          </div>
          <div className="text-sm text-center w-full whitespace-normal">Coach writes the competencies AI writes the underlying paragraphs</div>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-40 flex flex-col items-center justify-center gap-2 px-4 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(4)}
        >
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl border-2 border-orange-200">
            4
          </div>
          <div className="text-sm text-center w-full whitespace-normal">Coach writes competencies and Paragraphs AI writes Next steps and potential actions Tips</div>
        </Button>
      </div>
    </div>
  );
}
