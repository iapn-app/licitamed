import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
          )}
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? "text-neutral-900 font-medium" : "text-neutral-500"}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
