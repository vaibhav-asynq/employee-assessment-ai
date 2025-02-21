import React from 'react';
import { Card } from '@/components/ui/card';
import { EditableSubheading } from './shared/EditableSubheading';

interface Path2EditableContentProps {
  leadershipQualities: string[];
  developmentAreas: string[];
  onUpdateQuality: (oldTitle: string, newTitle: string) => void;
  onUpdateArea: (oldTitle: string, newTitle: string) => void;
  onDeleteQuality?: (title: string) => void;
  onDeleteArea?: (title: string) => void;
}

export function Path2EditableContent({
  leadershipQualities,
  developmentAreas,
  onUpdateQuality,
  onUpdateArea,
  onDeleteQuality = () => {},
  onDeleteArea = () => {}
}: Path2EditableContentProps) {
  return (
    <div className="h-full overflow-y-auto space-y-8">
      {/* Leadership Qualities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Leadership Qualities</h2>
        <div className="space-y-6">
          {leadershipQualities.map((quality) => (
            <Card key={quality} className="p-4">
              <div className="text-lg font-semibold mb-4">
                <EditableSubheading
                  value={quality}
                  onChange={(newTitle) => onUpdateQuality(quality, newTitle)}
                  onDelete={() => onDeleteQuality(quality)}
                />
              </div>
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-500 italic">Content will be added here...</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Development Areas Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Areas of Development</h2>
        <div className="space-y-6">
          {developmentAreas.map((area) => (
            <Card key={area} className="p-4">
              <div className="text-lg font-semibold mb-4">
                <EditableSubheading
                  value={area}
                  onChange={(newTitle) => onUpdateArea(area, newTitle)}
                  onDelete={() => onDeleteArea(area)}
                />
              </div>
              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-500 italic">Content will be added here...</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
