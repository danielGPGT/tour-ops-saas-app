"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function ClearSearchButton() {
  const router = useRouter();

  const handleClear = () => {
    router.push("/products-variants");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClear}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      <X className="h-3 w-3 mr-1" />
      Clear search
    </Button>
  );
}
