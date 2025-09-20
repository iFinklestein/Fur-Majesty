import React, { useState } from "react";
import { seedDemoData } from "../utils/demoData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertTriangle } from "lucide-react";

export default function DemoDataSeeder() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setResult(null);
    
    try {
      const seedResult = await seedDemoData();
      setResult({
        success: true,
        message: seedResult.message,
        pets: seedResult.pets
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message || "Failed to seed demo data"
      });
    } finally {
      setSeeding(false);
    }
  };

  // Show demo data seeder only in development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('dev');
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="w-5 h-5" />
          Demo Data Seeder
          <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">DEV ONLY</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-700">
          Quickly populate your app with sample data for testing and demonstration purposes.
        </p>
        
        <div className="bg-white p-3 rounded border text-xs">
          <strong>Will create:</strong>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li>• 2 pets (Queenie the Golden Retriever, Oliver the Maine Coon)</li>
            <li>• 3 vet visits (including one with follow-up tomorrow)</li>
            <li>• 2 active medications (one due today)</li>
            <li>• 2 grooming sessions</li>
            <li>• AM/PM feeding schedules for both pets</li>
          </ul>
        </div>

        <Button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="w-full"
        >
          {seeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Seeding Demo Data...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Seed Demo Data
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              {result.message}
              {result.success && result.pets && (
                <div className="mt-2 text-sm">
                  <strong>Created pets:</strong> {result.pets.map(p => p.name).join(", ")}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}