import { cn } from "@/shared/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "bg-white rounded-card border border-line shadow-card p-7",
      className
    )}
    {...props}
  />
);
