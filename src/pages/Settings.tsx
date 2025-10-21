import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { saveSettings, loadSettings, extractSheetId, type GoogleSheetsConfig } from "@/lib/googleSheets";
import { useNavigate } from "react-router-dom";
import { authLib } from "@/lib/auth";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [worksheetNames, setWorksheetNames] = useState<string[]>(["MASTER DATA", "BACKEND SHEET"]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({
    trip_id: "A",
    date: "B",
    consultant: "C",
    status: "D",
    traveller_name: "E",
    travel_date: "G",
    travel_state: "H",
    remarks: "K",
    nights: "L",
    pax: "M",
    hotel_category: "N",
    meal_plan: "O",
    phone: "P",
    email: "Q"
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const session = authLib.getSession();
    if (!session || session.user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const config = loadSettings();
    if (config) {
      setApiKey(config.apiKey);
      setSheetUrl(`https://docs.google.com/spreadsheets/d/${config.sheetId}`);
      setSheetId(config.sheetId);
      setWorksheetNames(config.worksheetNames);
      setColumnMappings(config.columnMappings);
    }
  }, [navigate]);

  const handleSave = () => {
    if (!apiKey || !sheetUrl) {
      toast({
        variant: "destructive",
        title: "Missing configuration",
        description: "Please provide Google API Key and Sheet URL",
      });
      return;
    }

    const extractedId = extractSheetId(sheetUrl);
    if (!extractedId) {
      toast({
        variant: "destructive",
        title: "Invalid Sheet URL",
        description: "Please provide a valid Google Sheets URL",
      });
      return;
    }

    const config: GoogleSheetsConfig = {
      apiKey,
      sheetId: extractedId,
      worksheetNames,
      columnMappings,
    };

    saveSettings(config);
    setSheetId(extractedId);

    toast({
      title: "Settings saved",
      description: "Google Sheets configuration has been saved successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure Google Sheets integration for authentication and data sync
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Google Sheets Integration</CardTitle>
            <CardDescription>
              Connect your Google Sheet for user authentication and lead management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Google API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from Google Cloud Console → APIs & Services → Credentials
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheetUrl">Google Sheet URL</Label>
              <Input
                id="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  setSheetId(extractSheetId(e.target.value));
                }}
              />
              <p className="text-xs text-muted-foreground">
                The URL of your Google Spreadsheet
              </p>
            </div>

            {sheetId && (
              <div className="space-y-2">
                <Label>Sheet ID (Auto-extracted)</Label>
                <Input value={sheetId} readOnly className="bg-muted" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Worksheet Configuration</CardTitle>
            <CardDescription>
              Configure worksheet names and column mappings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {worksheetNames.map((name, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`worksheet-${index}`}>
                  Worksheet {index + 1} Name {index === 0 ? '(Leads)' : '(Users)'}
                </Label>
                <Input
                  id={`worksheet-${index}`}
                  value={name}
                  onChange={(e) => {
                    const newNames = [...worksheetNames];
                    newNames[index] = e.target.value;
                    setWorksheetNames(newNames);
                  }}
                  placeholder={index === 0 ? 'MASTER DATA' : 'BACKEND SHEET'}
                />
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-4">Column Mappings (for MASTER DATA sheet)</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(columnMappings).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`col-${key}`} className="text-xs">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={`col-${key}`}
                      value={value}
                      onChange={(e) => setColumnMappings({ ...columnMappings, [key]: e.target.value.toUpperCase() })}
                      placeholder="A"
                      className="text-center"
                      maxLength={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 border rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p className="font-semibold mb-2">📌 Setup Instructions:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Create a Google Sheets API key in Google Cloud Console</li>
            <li>Enable Google Sheets API for your project</li>
            <li>Make sure your sheet has two worksheets: MASTER DATA and BACKEND SHEET</li>
            <li>BACKEND SHEET columns: C=Name, D=Email, E=Phone, M=Role, N=Password</li>
            <li>MASTER DATA for leads with columns as configured above</li>
            <li>Share your sheet with "Anyone with the link can view"</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
          <Button onClick={handleSave}>
            Save Settings
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
