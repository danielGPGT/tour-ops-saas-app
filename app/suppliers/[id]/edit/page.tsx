"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateSupplier } from "../../actions";

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = BigInt(params?.id as string);
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<string>("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    // Fetch existing via API route if needed later; for MVP we rely on navigation state or manual input
  }, [id]);

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold mb-4">Edit Supplier</h1>
      <form
        action={async () => {
          await updateSupplier(id, { name, channels: channels.split(",").map((c) => c.trim()).filter(Boolean), status });
          router.push("/suppliers");
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Channels (comma separated)</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={channels} onChange={(e) => setChannels(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">Save</button>
          <button type="button" onClick={() => router.back()} className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
        </div>
      </form>
    </div>
  );
}


