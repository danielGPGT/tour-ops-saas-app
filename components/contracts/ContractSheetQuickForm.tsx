'use client';

import { useMemo, useState, useCallback } from 'react';
import { SheetForm } from '@/components/ui/SheetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';
import { toast } from 'sonner';
import { createContract } from '@/app/contracts/actions';
// Removed contract version actions - no longer needed
import { createClient } from '@/utils/supabase/client';
import { Upload, FileText, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type Supplier = { id: bigint; name: string; status?: string };

const QuickFormSchema = z.object({
  supplier_id: z.bigint(),
  reference: z.string().min(1),
  contract_type: z.enum(['net_rate', 'commissionable', 'allocation']).default('net_rate'),
  valid_from: z.string(), // yyyy-mm-dd
  valid_to: z.string(),
  currency: z.string().length(3),
  commission_rate: z.union([z.number(), z.null()]).optional(),
  booking_cutoff_days: z.number().int().min(0).default(3),
  signed_date: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  special_terms: z.string().optional(),
  notes: z.string().optional(),
  // Simple deadline tracking
  deadlines: z.array(z.object({
    deadline_type: z.string(),
    deadline_date: z.string(),
    penalty_type: z.string().optional(),
    penalty_value: z.number().optional(),
    notes: z.string().optional()
  })).optional()
});

type QuickFormValues = z.infer<typeof QuickFormSchema>;

export function ContractSheetQuickForm({
  suppliers,
  trigger,
  open,
  onOpenChange,
  onSuccess
}: {
  suppliers: Supplier[];
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const initial: QuickFormValues = {
    supplier_id: suppliers[0]?.id ?? BigInt(0),
    reference: '',
    contract_type: 'net_rate',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    currency: 'USD',
    commission_rate: null,
    booking_cutoff_days: 3,
    signed_date: undefined,
    terms_and_conditions: '',
    special_terms: '',
    notes: '',
    deadlines: []
  };

  const [sections, setSections] = useState({ 
    basic: true, 
    financial: true, 
    terms: false, 
    deadlines: false 
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<QuickFormValues | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  const daysBetween = useMemo(() => {
    if (!pendingValues) return null;
    const a = new Date(pendingValues.valid_from);
    const b = new Date(pendingValues.valid_to);
    const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  }, [pendingValues]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const supabase = createClient();
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `contracts/${fileName}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);
      
      setUploadedFile({
        name: file.name,
        url: urlData.publicUrl
      });
      
      toast.success('Contract document uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload contract document');
    } finally {
      setUploadingFile(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await handleFileUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploadingFile
  });

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const handleValidate = (values: QuickFormValues) => {
    const res = QuickFormSchema.safeParse(values);
    if (!res.success) {
      const msg = res.error.issues[0]?.message ?? 'Invalid form';
      toast.error(msg);
      return false;
    }
    return true;
  };

  const handleSubmit = (values: QuickFormValues) => {
    if (!handleValidate(values)) return;
    
    setPendingValues(values);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!pendingValues) return;
    try {
      // Create contract with all terms included
      const contract = await createContract({
        supplier_id: pendingValues.supplier_id,
        reference: pendingValues.reference.trim(),
        status: 'active',
        contract_type: pendingValues.contract_type,
        signed_document_url: uploadedFile?.url,
        signed_date: pendingValues.signed_date ? new Date(pendingValues.signed_date) : undefined,
        terms_and_conditions: pendingValues.terms_and_conditions,
        special_terms: pendingValues.special_terms,
        notes: pendingValues.notes ?? '',
        // Contract terms fields (moved from contract_versions)
        commission_rate: pendingValues.commission_rate ?? undefined,
        currency: pendingValues.currency,
        booking_cutoff_days: pendingValues.booking_cutoff_days,
        cancellation_policies: [],
        payment_policies: [],
        valid_from: new Date(pendingValues.valid_from),
        valid_to: new Date(pendingValues.valid_to),
      }, { redirect: false });

      if (!contract?.id) throw new Error('Failed to create contract');

      toast.success('Contract created');
      setShowConfirm(false);
      onOpenChange?.(false);
      onSuccess?.();

    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    }
  };

  return (
    <>
      <SheetForm
        trigger={trigger}
        title="Create Contract"
        description="Single-page fast contract form"
        initial={initial}
        onSubmit={handleSubmit}
        submitLabel="Save Contract"
        side="right"
        open={open}
        onOpenChange={onOpenChange}
      >
        {({ values, set }) => (
          <div className="space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader onClick={() => setSections(prev => ({ ...prev, basic: !prev.basic }))} className="cursor-pointer">
                <CardTitle className="text-base">Basic Information</CardTitle>
                <CardDescription>Supplier, reference, dates, currency</CardDescription>
              </CardHeader>
              {sections.basic && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Supplier *</Label>
                      <Select value={values.supplier_id.toString()} onValueChange={(v) => set('supplier_id', BigInt(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(s => (
                            <SelectItem key={s.id.toString()} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Reference *</Label>
                      <Input value={values.reference} onChange={(e) => set('reference', e.target.value)} placeholder="HOTEL-2024-001" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contract Type *</Label>
                      <Select value={values.contract_type} onValueChange={(v) => set('contract_type', v as 'net_rate' | 'commissionable' | 'allocation')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net_rate">Net Rate</SelectItem>
                          <SelectItem value="commissionable">Commissionable</SelectItem>
                          <SelectItem value="allocation">Allocation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Currency *</Label>
                      <Select value={values.currency} onValueChange={(v) => set('currency', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Valid From *</Label>
                      <Input type="date" value={values.valid_from} onChange={(e) => set('valid_from', e.target.value)} />
                    </div>
                    <div>
                      <Label>Valid To *</Label>
                      <Input type="date" value={values.valid_to} onChange={(e) => set('valid_to', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="text-sm text-muted-foreground">
                      {values.valid_from && values.valid_to ? (
                        <span>
                          {(() => {
                            const a = new Date(values.valid_from);
                            const b = new Date(values.valid_to);
                            const d = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
                            return isNaN(d) ? '' : `${d} days`;
                          })()}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <Label>Signed Contract Document</Label>
                      {uploadedFile ? (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">{uploadedFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeUploadedFile}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isDragActive 
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-gray-300 hover:border-gray-400'
                          } ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input {...getInputProps()} />
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">
                            {uploadingFile ? 'Uploading...' : isDragActive ? 'Drop the contract here' : 'Drag & drop contract here'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            or click to browse (PDF, DOC, DOCX)
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Signed Date</Label>
                      <Input type="date" value={values.signed_date ?? ''} onChange={(e) => set('signed_date', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Financial Terms */}
            <Card>
              <CardHeader onClick={() => setSections(prev => ({ ...prev, financial: !prev.financial }))} className="cursor-pointer">
                <CardTitle className="text-base">Financial Terms</CardTitle>
                <CardDescription>Commission and booking cutoff</CardDescription>
              </CardHeader>
              {sections.financial && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Commission Rate</Label>
                      <Input type="number" min="0" max="100" step="0.1" value={values.commission_rate ?? ''} onChange={(e) => set('commission_rate', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Leave empty for net rate" />
                    </div>
                    <div>
                      <Label>Booking Cutoff (days)</Label>
                      <Input type="number" min="0" value={values.booking_cutoff_days} onChange={(e) => set('booking_cutoff_days', parseInt(e.target.value || '0'))} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Full Terms & Special Terms & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Full Terms & Conditions</CardTitle>
                <CardDescription>Rich text for complete contract terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label>Terms & Conditions</Label>
                <Textarea rows={6} value={values.terms_and_conditions ?? ''} onChange={(e) => set('terms_and_conditions', e.target.value)} />
                <Label>Special Terms & Exceptions</Label>
                <Textarea rows={4} value={values.special_terms ?? ''} onChange={(e) => set('special_terms', e.target.value)} />
                <Label>Internal Notes</Label>
                <Textarea rows={3} value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
              </CardContent>
            </Card>

            {/* Key Dates & Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Dates & Deadlines</CardTitle>
                <CardDescription>Important dates to track (payment, cancellation, attrition)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" onClick={() => set('deadlines', [...(values.deadlines ?? []), { 
                  deadline_type: 'payment', 
                  deadline_date: new Date().toISOString().split('T')[0], 
                  penalty_type: 'none',
                  penalty_value: 0,
                  notes: '' 
                }])}>+ Add Deadline</Button>
                <div className="space-y-2">
                  {(values.deadlines ?? []).map((d, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-3 border rounded-lg">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={d.deadline_type} onValueChange={(value) => {
                          const arr = [...(values.deadlines ?? [])];
                          arr[idx] = { ...arr[idx], deadline_type: value };
                          set('deadlines', arr);
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="cancellation">Cancellation</SelectItem>
                            <SelectItem value="attrition">Attrition</SelectItem>
                            <SelectItem value="release">Release</SelectItem>
                            <SelectItem value="final_numbers">Final Numbers</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={d.deadline_date} onChange={(e) => {
                          const arr = [...(values.deadlines ?? [])];
                          arr[idx] = { ...arr[idx], deadline_date: e.target.value };
                          set('deadlines', arr);
                        }} />
                      </div>
                      <div>
                        <Label className="text-xs">Penalty Type</Label>
                        <Select value={d.penalty_type || 'none'} onValueChange={(value) => {
                          const arr = [...(values.deadlines ?? [])];
                          arr[idx] = { ...arr[idx], penalty_type: value };
                          set('deadlines', arr);
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            <SelectItem value="forfeit_deposit">Forfeit Deposit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Penalty Value</Label>
                        <Input type="number" min="0" value={d.penalty_value || 0} onChange={(e) => {
                          const arr = [...(values.deadlines ?? [])];
                          arr[idx] = { ...arr[idx], penalty_value: parseFloat(e.target.value || '0') };
                          set('deadlines', arr);
                        }} />
                      </div>
                      <div className="flex items-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => {
                          const arr = [...(values.deadlines ?? [])];
                          arr.splice(idx, 1);
                          set('deadlines', arr);
                        }}>Remove</Button>
                      </div>
                      <div className="md:col-span-5">
                        <Label className="text-xs">Notes</Label>
                        <Input value={d.notes ?? ''} onChange={(e) => {
                          const arr = [...(values.deadlines ?? [])];
                          arr[idx] = { ...arr[idx], notes: e.target.value };
                          set('deadlines', arr);
                        }} placeholder="Additional details..." />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetForm>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Contract Details</DialogTitle>
            <DialogDescription>Please review before creating</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {pendingValues && (
              <>
                <div><span className="text-muted-foreground">Supplier:</span> {suppliers.find(s => s.id === pendingValues.supplier_id)?.name || '—'}</div>
                <div><span className="text-muted-foreground">Reference:</span> {pendingValues.reference}</div>
                <div><span className="text-muted-foreground">Type:</span> {pendingValues.contract_type}</div>
                <div><span className="text-muted-foreground">Valid:</span> {pendingValues.valid_from} - {pendingValues.valid_to} {daysBetween ? `(${daysBetween} days)` : ''}</div>
                <div><span className="text-muted-foreground">Currency:</span> {pendingValues.currency}</div>
                <div><span className="text-muted-foreground">Booking Cutoff:</span> {pendingValues.booking_cutoff_days} days</div>
                <Separator className="my-2" />
                <div><span className="text-muted-foreground">Deadlines:</span> {pendingValues.deadlines?.length || 0} deadline(s) configured</div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Edit</Button>
            <Button onClick={handleConfirm}>Confirm & Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}