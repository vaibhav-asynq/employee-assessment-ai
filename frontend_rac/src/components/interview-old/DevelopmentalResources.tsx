import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Spinner } from "../ui/spinner";
import * as XLSX from 'xlsx';
import { getExcelFile } from '@/lib/api';

interface SheetData {
  name: string;
  data: any[][];
}

export function DevelopmentalResources() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');

  const handleDownload = () => {
    window.open('http://localhost:8000/api/excel', '_blank');
  };

  useEffect(() => {
    async function loadExcel() {
      try {
        const buffer = await getExcelFile();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const loadedSheets = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })
        }));

        setSheets(loadedSheets);
        if (loadedSheets.length > 0) {
          setActiveSheet(loadedSheets[0].name);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading Excel:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Excel file');
        setLoading(false);
      }
    }

    loadExcel();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Excel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Developmental Resources</h2>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Excel
        </Button>
      </div>
      <Tabs value={activeSheet} onValueChange={setActiveSheet}>
        <TabsList>
          {sheets.map(sheet => (
            <TabsTrigger key={sheet.name} value={sheet.name}>
              {sheet.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {sheets.map(sheet => (
          <TabsContent key={sheet.name} value={sheet.name}>
            <div className="border rounded-lg" style={{ height: '500px', overflowY: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {sheet.data[0]?.map((header: any, index: number) => (
                      <TableHead 
                        key={index} 
                        className="font-bold bg-white border p-2 whitespace-nowrap"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheet.data.slice(1).map((row: any[], rowIndex: number) => {
                    const isGray = rowIndex % 2 === 0;
                    const bgColor = isGray ? 'bg-gray-100' : 'bg-blue-50';

                    return (
                      <TableRow key={rowIndex} className={bgColor}>
                        {row.map((cell: any, cellIndex: number) => (
                          <TableCell 
                            key={cellIndex} 
                            className="border p-2 whitespace-pre-wrap"
                          >
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
