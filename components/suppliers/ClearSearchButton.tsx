"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ClearSearchButtonProps {
  className?: string;
}

export function ClearSearchButton({ className }: ClearSearchButtonProps) {
  const router = useRouter();

  const handleClear = () => {
    router.push('/suppliers');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClear}
      className={`h-8 text-muted-foreground hover:text-foreground ${className || ''}`}
    >
      Clear search
    </Button>
  );
}
