"use client";

import React from "react";
import { AlertTriangle, Database, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  hasError?: boolean;
  onRetry?: () => void;
};

export function DatabaseStatus({ hasError, onRetry }: Props) {
  if (!hasError) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Database Connected</AlertTitle>
        <AlertDescription className="text-green-700">
          Successfully connected to the database.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Database Connection Error</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Unable to connect to the database. This could be due to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Database server is not running</li>
          <li>Incorrect connection credentials</li>
          <li>Network connectivity issues</li>
          <li>Missing environment variables</li>
        </ul>
        {onRetry && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Database className="h-3 w-3 mr-1" />
              Retry Connection
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
