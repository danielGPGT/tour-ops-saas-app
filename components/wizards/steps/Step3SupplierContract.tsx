'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Plus,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Step3Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function Step3SupplierContract({ data, onNext, onBack }: Step3Props) {
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [existingSuppliers, setExistingSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const result = await response.json();
        setExistingSuppliers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let supplier: Supplier;
    
    if (supplierMode === 'existing') {
      const selected = existingSuppliers.find(s => s.id.toString() === selectedSupplierId);
      if (!selected) return;
      supplier = selected;
    } else {
      if (!newSupplier.name.trim()) return;
      supplier = {
        id: 0, // Will be created
        name: newSupplier.name,
        email: newSupplier.email,
        phone: newSupplier.phone
      };
    }

    onNext({
      supplier,
      supplierMode
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Supplier & Contract</h2>
        <p className="text-muted-foreground">
          Set up supplier information for your new product
        </p>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          A contract will be automatically created for this supplier with default terms.
          You can customize it later in the Contracts section.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={supplierMode === 'existing' ? 'default' : 'outline'}
              onClick={() => setSupplierMode('existing')}
              className="flex-1"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Use Existing Supplier
            </Button>
            <Button
              type="button"
              variant={supplierMode === 'new' ? 'default' : 'outline'}
              onClick={() => setSupplierMode('new')}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Supplier
            </Button>
          </div>

          {supplierMode === 'existing' ? (
            <div>
              <Label htmlFor="supplier">Select Supplier</Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : existingSuppliers.length === 0 ? (
                <Alert className="mt-2">
                  <AlertDescription>
                    No suppliers found. Create a new one instead.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{supplier.name}</span>
                          {supplier.email && (
                            <Badge variant="outline" className="text-xs">
                              {supplier.email}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Paris Hotels Ltd"
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierEmail">Email (Optional)</Label>
                  <Input
                    id="supplierEmail"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@supplier.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplierPhone">Phone (Optional)</Label>
                  <Input
                    id="supplierPhone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 20 1234 5678"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contract Preview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Contract will be auto-created with:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reference: AUTO-{Date.now().toString().slice(-6)}</li>
              <li>• Status: Active</li>
              <li>• Default cancellation policy (30 days)</li>
              <li>• Default payment terms (deposit required)</li>
              <li>• Valid for the date range you set in availability</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              You can customize all contract terms after creation.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </form>
    </div>
  );
}
