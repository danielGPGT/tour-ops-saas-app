"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Side = "left" | "right" | "top" | "bottom";

export type SheetFormProps<V extends Record<string, any>> = {
  trigger: React.ReactNode;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  initial: V;
  onSubmit: (values: V) => Promise<void> | void;
  submitLabel?: string;
  side?: Side;
  afterSubmit?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (ctx: { values: V; set: <K extends keyof V>(key: K, value: V[K]) => void }) => React.ReactNode;
};

export function SheetForm<V extends Record<string, any>>({
  trigger,
  title,
  description,
  initial,
  onSubmit,
  submitLabel = "Save",
  side = "right",
  afterSubmit,
  open: controlledOpen,
  onOpenChange,
  children
}: SheetFormProps<V>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [values, setValues] = React.useState<V>(initial);

  React.useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  function set<K extends keyof V>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side={side} className="!max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{typeof title === 'string' ? title : title}</SheetTitle>
          {description ? (
            <SheetDescription>
              {typeof description === 'string' ? description : description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="mt-4 px-4 space-y-4">
          {children({ values, set })}
        </div>
        <SheetFooter className="mt-6">
          <Button
            onClick={async () => {
              try {
                await onSubmit(values);
                toast.success("Saved");
                setOpen(false);
                afterSubmit?.();
              } catch (e: any) {
                toast.error(e?.message ?? "Save failed");
              }
            }}
          >
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


