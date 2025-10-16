"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  ArrowRight,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  sampleValue?: string;
}

interface ImportIssue {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportWizardProps {
  onComplete: (importResults: any) => void;
  onCancel: () => void;
}

export function ImportWizard({ onComplete, onCancel }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);

  const steps: ImportStep[] = [
    { id: 'upload', title: 'Upload File', description: 'Select your CSV or Excel file', completed: currentStep > 1 },
    { id: 'map', title: 'Map Columns', description: 'Match your columns to our fields', completed: currentStep > 2 },
    { id: 'review', title: 'Review & Fix', description: 'Check for issues and preview data', completed: currentStep > 3 },
    { id: 'import', title: 'Import', description: 'Import your data', completed: currentStep > 4 }
  ];

  // Expected fields for different import types
  const expectedFields = {
    bookings: [
      { field: 'reference', label: 'Booking Reference', required: true },
      { field: 'customer_name', label: 'Customer Name', required: true },
      { field: 'customer_email', label: 'Customer Email', required: false },
      { field: 'check_in', label: 'Check-in Date', required: true },
      { field: 'check_out', label: 'Check-out Date', required: true },
      { field: 'product_name', label: 'Product/Service', required: true },
      { field: 'total_price', label: 'Total Price', required: true },
      { field: 'currency', label: 'Currency', required: false },
      { field: 'status', label: 'Status', required: false },
      { field: 'notes', label: 'Notes', required: false }
    ],
    products: [
      { field: 'name', label: 'Product Name', required: true },
      { field: 'supplier', label: 'Supplier', required: true },
      { field: 'type', label: 'Product Type', required: true },
      { field: 'cost_per_person', label: 'Cost per Person', required: true },
      { field: 'price_per_person', label: 'Price per Person', required: true },
      { field: 'available_from', label: 'Available From', required: true },
      { field: 'available_until', label: 'Available Until', required: true },
      { field: 'quantity', label: 'Quantity per Day', required: false }
    ],
    customers: [
      { field: 'name', label: 'Customer Name', required: true },
      { field: 'email', label: 'Email', required: false },
      { field: 'phone', label: 'Phone', required: false },
      { field: 'company', label: 'Company', required: false },
      { field: 'notes', label: 'Notes', required: false }
    ]
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      // Parse header and data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setCsvData(data);
      
      // Auto-map columns
      const mappings = headers.map(header => ({
        sourceColumn: header,
        targetField: findBestMatch(header),
        required: false,
        sampleValue: data[0]?.[header] || ''
      }));

      setColumnMappings(mappings);
      setCurrentStep(2);
    };

    reader.readAsText(uploadedFile);
  }, []);

  const findBestMatch = (sourceColumn: string): string => {
    const lower = sourceColumn.toLowerCase();
    
    // Fuzzy matching for common column names
    if (lower.includes('ref') || lower.includes('booking')) return 'reference';
    if (lower.includes('name') && !lower.includes('email')) return 'customer_name';
    if (lower.includes('email')) return 'customer_email';
    if (lower.includes('check') && lower.includes('in')) return 'check_in';
    if (lower.includes('check') && lower.includes('out')) return 'check_out';
    if (lower.includes('product') || lower.includes('service')) return 'product_name';
    if (lower.includes('price') || lower.includes('total')) return 'total_price';
    if (lower.includes('currency')) return 'currency';
    if (lower.includes('status')) return 'status';
    if (lower.includes('notes') || lower.includes('comment')) return 'notes';
    
    return '';
  };

  const updateColumnMapping = (index: number, targetField: string) => {
    const updated = [...columnMappings];
    updated[index].targetField = targetField;
    updated[index].required = expectedFields.bookings.some(f => f.field === targetField && f.required);
    setColumnMappings(updated);
  };

  const validateData = () => {
    const newIssues: ImportIssue[] = [];
    const requiredFields = expectedFields.bookings.filter(f => f.required).map(f => f.field);
    
    csvData.forEach((row, rowIndex) => {
      // Check required fields
      requiredFields.forEach(requiredField => {
        const mapping = columnMappings.find(m => m.targetField === requiredField);
        if (mapping && (!row[mapping.sourceColumn] || row[mapping.sourceColumn].trim() === '')) {
          newIssues.push({
            row: rowIndex + 2, // +2 because CSV is 1-indexed and we skip header
            column: mapping.sourceColumn,
            message: `${requiredField} is required but empty`,
            severity: 'error'
          });
        }
      });

      // Validate date formats
      const dateFields = ['check_in', 'check_out'];
      dateFields.forEach(dateField => {
        const mapping = columnMappings.find(m => m.targetField === dateField);
        if (mapping && row[mapping.sourceColumn]) {
          const dateValue = row[mapping.sourceColumn];
          if (!isValidDate(dateValue)) {
            newIssues.push({
              row: rowIndex + 2,
              column: mapping.sourceColumn,
              message: `Invalid date format: ${dateValue}. Expected YYYY-MM-DD`,
              severity: 'error'
            });
          }
        }
      });

      // Validate numeric fields
      const numericFields = ['total_price'];
      numericFields.forEach(numericField => {
        const mapping = columnMappings.find(m => m.targetField === numericField);
        if (mapping && row[mapping.sourceColumn]) {
          const numericValue = row[mapping.sourceColumn];
          if (isNaN(parseFloat(numericValue))) {
            newIssues.push({
              row: rowIndex + 2,
              column: mapping.sourceColumn,
              message: `Invalid number: ${numericValue}`,
              severity: 'error'
            });
          }
        }
      });
    });

    setIssues(newIssues);
    setCurrentStep(3);
  };

  const isValidDate = (dateString: string): boolean => {
    // Try multiple date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/ // M/D/YYYY
    ];
    
    return formats.some(format => format.test(dateString)) && !isNaN(Date.parse(dateString));
  };

  const performImport = async () => {
    setImportProgress(0);
    
    try {
      // Simulate import process
      const totalRows = csvData.length;
      const successfulRows = [];
      const failedRows = [];

      for (let i = 0; i < totalRows; i++) {
        const row = csvData[i];
        const rowIssues = issues.filter(issue => issue.row === i + 2);
        
        if (rowIssues.some(issue => issue.severity === 'error')) {
          failedRows.push({ row: i + 1, issues: rowIssues });
        } else {
          // Simulate successful import
          successfulRows.push(row);
        }
        
        setImportProgress(((i + 1) / totalRows) * 100);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
      }

      const results = {
        totalRows,
        successfulRows: successfulRows.length,
        failedRows: failedRows.length,
        successfulData: successfulRows,
        failedData: failedRows
      };

      setImportResults(results);
      setCurrentStep(4);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Your Data</h3>
        <p className="text-muted-foreground">
          Choose a CSV or Excel file to import your bookings, products, or customers
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Drop your file here, or click to browse</p>
              <p className="text-xs text-muted-foreground">
                Supports CSV, Excel (.xlsx), and Google Sheets exports
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {file.name}
            </CardTitle>
            <CardDescription>
              {(file.size / 1024).toFixed(1)} KB
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Supported formats</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CSV files with headers in the first row</li>
          <li>• Excel files (.xlsx, .xls)</li>
          <li>• Google Sheets exports</li>
          <li>• Maximum file size: 10MB</li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Map Your Columns</h3>
        <p className="text-muted-foreground">
          Match your file columns to our system fields
        </p>
      </div>

      <div className="space-y-4">
        {columnMappings.map((mapping, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <Label className="text-sm font-medium">Your Column</Label>
                  <p className="text-sm text-muted-foreground">{mapping.sourceColumn}</p>
                  {mapping.sampleValue && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sample: "{mapping.sampleValue}"
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">
                    Our Field {mapping.required && <span className="text-red-500">*</span>}
                  </Label>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateColumnMapping(index, e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                  >
                    <option value="">Select field...</option>
                    {expectedFields.bookings.map(field => (
                      <option key={field.field} value={field.field}>
                        {field.label} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
        <Button onClick={validateData}>
          Review Data
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review & Fix Issues</h3>
        <p className="text-muted-foreground">
          Check for problems and preview your data
        </p>
      </div>

      {/* Issues summary */}
      {issues.length > 0 && (
        <Alert className={cn(
          issues.some(i => i.severity === 'error') ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {issues.length} issues that need attention:
            <ul className="mt-2 space-y-1">
              {issues.slice(0, 5).map((issue, index) => (
                <li key={index} className="text-sm">
                  Row {issue.row}: {issue.message}
                </li>
              ))}
              {issues.length > 5 && <li className="text-sm">...and {issues.length - 5} more</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Data preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Preview</CardTitle>
          <CardDescription>
            First 5 rows of your data with mapped columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columnMappings.filter(m => m.targetField).map((mapping, index) => (
                    <th key={index} className="text-left p-2 font-medium">
                      {mapping.targetField}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    {columnMappings.filter(m => m.targetField).map((mapping, colIndex) => {
                      const hasError = issues.some(issue => 
                        issue.row === rowIndex + 2 && issue.column === mapping.sourceColumn
                      );
                      return (
                        <td key={colIndex} className={cn(
                          "p-2",
                          hasError && "bg-red-50 text-red-900"
                        )}>
                          {row[mapping.sourceColumn] || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Back
        </Button>
        <Button 
          onClick={performImport}
          disabled={issues.some(i => i.severity === 'error')}
        >
          Import Data
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
        <p className="text-muted-foreground">
          Your data has been processed
        </p>
      </div>

      {importResults && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {importResults.successfulRows}
              </div>
              <p className="text-sm text-muted-foreground">Successful</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {importResults.failedRows}
              </div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">
                {importResults.totalRows}
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            <li>• Successfully imported data is now available in your system</li>
            <li>• Failed rows can be exported and fixed for re-import</li>
            <li>• You can start using your imported data immediately</li>
            <li>• Check the data in your respective sections (Bookings, Products, etc.)</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Import More Data
        </Button>
        <Button onClick={() => onComplete(importResults)}>
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step.completed 
                ? "bg-green-600 text-white" 
                : currentStep === index + 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-1 mx-2",
                step.completed ? "bg-green-600" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[500px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Progress bar for import step */}
      {currentStep === 4 && importProgress > 0 && importProgress < 100 && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Importing data...</span>
            <span>{Math.round(importProgress)}%</span>
          </div>
          <Progress value={importProgress} className="w-full" />
        </div>
      )}
    </div>
  );
}
