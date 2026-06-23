import { cn } from "@/shared/lib/utils";

type LogoProps = {
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ className }) => (
  <div className={cn("inline-flex items-center gap-2", className)}>
    <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand text-white font-display font-bold text-xl shadow-card-sm rotate-[-6deg]">
      V
    </span>
    <span className="font-display font-bold text-2xl text-ink">
      Voca<span className="text-brand">Quiz</span>
    </span>
  </div>
);
