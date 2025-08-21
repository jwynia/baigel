'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Search, 
  Settings, 
  Home, 
  MessageSquare,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileJson,
  RefreshCw,
  Shield,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/stores/settings';

export default function SettingsPage() {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    exportConfiguration,
    importConfiguration,
    validateImportData,
    clearAllSettings,
    clearConnectionData,
    clearAgentData,
    clearPreferences,
    lastExportTime
  } = useSettingsStore();

  const handleExport = () => {
    try {
      const data = exportConfiguration();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baigel-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setImportStatus('success');
      setImportMessage('Configuration exported successfully');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to export configuration');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const validation = validateImportData(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      
      await importConfiguration(data);
      
      setImportStatus('success');
      setImportMessage('Configuration imported successfully. Reloading...');
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Failed to import configuration');
      setTimeout(() => setImportStatus('idle'), 5000);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    await clearAllSettings();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/chat" className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Chat</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/discovery" className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Discovery</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div>
              <h1 className="text-lg font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your BAIGEL configuration
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 space-y-6 flex-1">
        {/* Status Alert */}
        {importStatus !== 'idle' && (
          <Alert className={importStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
            {importStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{importStatus === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{importMessage}</AlertDescription>
          </Alert>
        )}

        {/* Export/Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Configuration Management
            </CardTitle>
            <CardDescription>
              Export your configuration for backup or import a saved configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Section */}
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save your current settings, connections, and agents to a file
                </p>
                <Button onClick={handleExport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export to File
                </Button>
                {lastExportTime && (
                  <p className="text-xs text-muted-foreground">
                    Last exported: {new Date(lastExportTime).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Import Section */}
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Restore settings from a previously exported configuration file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import from File
                </Button>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Data Privacy</AlertTitle>
              <AlertDescription>
                All configuration data is stored locally in your browser. Export files contain your 
                connection settings and preferences but no chat history or sensitive credentials.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Clear Data Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Clear Data
            </CardTitle>
            <CardDescription>
              Remove stored data from your browser. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selective Clear Options */}
              <div className="space-y-3">
                <h3 className="font-medium">Selective Clear</h3>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="mr-2 h-4 w-4" />
                      Clear Connections
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Connections?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all configured connections. You'll need to set them up again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearConnectionData}>
                        Clear Connections
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="mr-2 h-4 w-4" />
                      Clear Agents
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Agents?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all discovered and configured agents.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAgentData}>
                        Clear Agents
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Clear Preferences
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Preferences?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all preferences to defaults, including theme settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearPreferences}>
                        Clear Preferences
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Reset Everything */}
              <div className="space-y-3">
                <h3 className="font-medium">Complete Reset</h3>
                
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Danger Zone</AlertTitle>
                  <AlertDescription>
                    This will clear ALL data and reset the app to its initial state.
                  </AlertDescription>
                </Alert>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Everything
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This action cannot be undone. This will permanently delete:</p>
                        <ul className="list-disc list-inside ml-2">
                          <li>All connections and agents</li>
                          <li>All preferences and settings</li>
                          <li>Chat history</li>
                          <li>Onboarding status</li>
                        </ul>
                        <p className="font-medium mt-2">
                          You will be returned to the initial setup screen.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearAll}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              About Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              BAIGEL stores all configuration data locally in your browser's localStorage. 
              No data is sent to external servers.
            </p>
            <div className="space-y-2">
              <p className="font-medium">What's stored:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Connection configurations (without passwords)</li>
                <li>Discovered agents and tools</li>
                <li>UI preferences and theme settings</li>
                <li>Onboarding completion status</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Tip: Export your configuration regularly for backup purposes.
            </p>
          </CardContent>
        </Card>

        {/* Debug Info (Hidden by default) */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Debug Information
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </Button>
            </CardTitle>
          </CardHeader>
          {showDebug && (
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">localStorage Keys:</h3>
                  <div className="bg-muted rounded p-3 font-mono text-xs space-y-1 max-h-60 overflow-auto">
                    {Object.keys(localStorage).length > 0 ? (
                      Object.keys(localStorage).map(key => (
                        <div key={key} className="flex justify-between">
                          <span className="text-blue-600">{key}</span>
                          <span className="text-gray-500">
                            {localStorage.getItem(key)?.length || 0} chars
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No localStorage data found</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total localStorage keys: {Object.keys(localStorage).length}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('=== localStorage Debug ===');
                    Object.keys(localStorage).forEach(key => {
                      console.log(`${key}:`, localStorage.getItem(key));
                    });
                    console.log('=== End Debug ===');
                    setImportStatus('success');
                    setImportMessage('Debug info logged to browser console');
                    setTimeout(() => setImportStatus('idle'), 3000);
                  }}
                >
                  Log Full Data to Console
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}