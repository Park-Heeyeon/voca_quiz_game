import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold text-white transition active:translate-y-1 active:shadow-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary shadow-btn-3d hover:bg-primary-dark",
        secondary: "bg-secondary shadow-btn-3d hover:bg-secondary-dark",
        ghost: "bg-transparent text-primary shadow-none",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  className,
  ...props
}) => (
  <button
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
);
