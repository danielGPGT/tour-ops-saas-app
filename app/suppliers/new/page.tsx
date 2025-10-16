"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold mb-4">New Supplier</h1>
      <form
        action={async () => {
          setSubmitting(true);
          await createSupplier({ name, channels: channels.split(",").map((c) => c.trim()).filter(Boolean) });
          router.push("/suppliers");
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="DirectEvents"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Channels (comma separated)</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            placeholder="b2c, b2b"
          />
        </div>
        <div className="flex items-center gap-2">
          <button disabled={submitting} className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">Create</button>
          <button type="button" onClick={() => router.back()} className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
        </div>
      </form>
    </div>
  );
}


