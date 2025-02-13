import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

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
          className="h-32 flex flex-col items-center justify-center space-y-2 text-lg hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(1)}
        >
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border-2 border-green-200">
              1
            </div>
            <FileText className="h-6 w-6" />
          </div>
          <span>Generate Full Report</span>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-32 flex flex-col items-center justify-center space-y-2 text-lg hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(2)}
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl border-2 border-blue-200">
            2
          </div>
          <span>Path 2</span>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-32 flex flex-col items-center justify-center space-y-2 text-lg hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(3)}
        >
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl border-2 border-purple-200">
            3
          </div>
          <span>Path 3</span>
        </Button>

        <Button 
          variant="outline" 
          size="lg"
          className="h-32 flex flex-col items-center justify-center space-y-2 text-lg hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-all shadow-sm hover:shadow-md"
          onClick={() => onSelectPath(4)}
        >
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl border-2 border-orange-200">
            4
          </div>
          <span>Path 4</span>
        </Button>
      </div>
    </div>
  );
}
