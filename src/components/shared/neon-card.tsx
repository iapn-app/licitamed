import { cn } from "@/lib/utils";

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
}

export function NeonCard({ children, className }: NeonCardProps) {
  return (
    <div className={cn("neon-card bg-white rounded-lg border border-neutral-200", className)}>
      {children}
    </div>
  );
}
