import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getCSVData } from "@/lib/api";
import { Spinner } from "../ui/spinner";

export function DevelopmentalResources() {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [suggestionsData, setSuggestionsData] = useState<any[]>([]);
  const [derailersData, setDerailersData] = useState<any[]>([]);
  const [keyThemesData, setKeyThemesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData(type: 'suggestions' | 'derailers' | 'key_themes') {
      setLoading(true);
      setError("");
      try {
        const data = await getCSVData(type);
        switch (type) {
          case 'suggestions':
            setSuggestionsData(data);
            break;
          case 'derailers':
            setDerailersData(data);
            break;
          case 'key_themes':
            setKeyThemesData(data);
            break;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    // Fetch data based on active tab
    switch (activeTab) {
      case 'suggestions':
        if (suggestionsData.length === 0) {
          fetchData('suggestions');
        }
        break;
      case 'derailers':
        if (derailersData.length === 0) {
          fetchData('derailers');
        }
        break;
      case 'keyThemes':
        if (keyThemesData.length === 0) {
          fetchData('key_themes');
        }
        break;
    }
  }, [activeTab]);

  const renderTable = (data: any[], type: string) => {
    if (loading) {
      return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    if (error) {
      return <div className="text-red-500 p-4">{error}</div>;
    }

    if (!data || data.length === 0) {
      return <div className="p-4">No data available</div>;
    }

    // Get all column names from the first row
    const columns = Object.keys(data[0]);

    return (
      <div className="relative border border-gray-200" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className="font-bold bg-white border border-gray-200 p-2">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => {
              const isGray = rowIndex % 2 === 0;
              const bgColor = isGray ? 'bg-gray-100' : 'bg-blue-50';

              return (
                <TableRow key={rowIndex} className={bgColor}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="align-top border border-gray-200 p-2">
                      {row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Developmental Resources</h2>
      <Tabs defaultValue="suggestions" className="w-full space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="derailers">Derailers</TabsTrigger>
          <TabsTrigger value="keyThemes">Key Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          {renderTable(suggestionsData, 'suggestions')}
        </TabsContent>

        <TabsContent value="derailers">
          {renderTable(derailersData, 'derailers')}
        </TabsContent>

        <TabsContent value="keyThemes">
          {renderTable(keyThemesData, 'keyThemes')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
