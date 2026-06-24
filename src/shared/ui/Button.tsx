import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold tracking-tight transition-[transform,box-shadow] duration-100 active:translate-y-[5px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white shadow-btn-brand hover:brightness-105",
        mint: "bg-mint text-white shadow-btn-mint hover:brightness-105",
        coral: "bg-coral text-white shadow-btn-coral hover:brightness-105",
        secondary:
          "bg-white text-ink shadow-btn-light border-2 border-line hover:bg-cloud",
        ghost:
          "bg-transparent text-brand shadow-none active:translate-y-0 hover:bg-brand-soft",
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
