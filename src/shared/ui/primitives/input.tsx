import * as React from "react"

import { cn } from "@/shared/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border-2 border-line bg-cloud px-4 py-2 text-base text-ink transition-colors placeholder:text-ink-soft/70 focus-visible:outline-none focus-visible:border-brand focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
