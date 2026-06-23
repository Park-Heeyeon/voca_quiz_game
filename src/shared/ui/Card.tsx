import { cn } from "@/shared/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("bg-white rounded-2xl shadow-lg p-6", className)}
    {...props}
  />
);
