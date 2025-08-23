'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugStoragePage() {
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  
  const loadStorageData = () => {
    const data: Record<string, any> = {};
    
    // Get all localStorage keys and values
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to parse as JSON, fallback to string
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        } catch (e) {
          data[key] = 'Error reading value';
        }
      }
    }
    
    setStorageData(data);
  };
  
  useEffect(() => {
    loadStorageData();
  }, []);
  
  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    loadStorageData();
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Storage Debug View</CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadStorageData} variant="outline">
              Refresh
            </Button>
            <Button onClick={clearAllStorage} variant="destructive">
              Clear All Storage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">localStorage Keys ({Object.keys(storageData).length}):</h3>
              {Object.keys(storageData).length === 0 ? (
                <p className="text-muted-foreground">No data in localStorage</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(storageData).map(([key, value]) => (
                    <div key={key} className="border rounded p-2">
                      <div className="font-mono text-sm font-semibold">{key}</div>
                      <pre className="text-xs mt-1 overflow-auto max-h-32">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}