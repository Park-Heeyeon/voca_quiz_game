import { cn } from "@/shared/lib/utils";

type WordCardProps = {
  word: string;
  tag?: string;
  className?: string;
};

export const WordCard: React.FC<WordCardProps> = ({ word, tag, className }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-card bg-white border border-line shadow-card px-8 py-10 text-center",
      className
    )}
  >
    <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand via-coral to-amber" />
    {tag && (
      <span className="inline-block mb-3 text-xs font-semibold tracking-wide uppercase text-ink-soft">
        {tag}
      </span>
    )}
    <p className="font-display font-bold text-4xl sm:text-5xl text-ink break-words leading-tight">
      {word}
    </p>
  </div>
);
