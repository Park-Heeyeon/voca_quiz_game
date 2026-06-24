export const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand text-white font-display font-semibold text-sm shadow-card-sm">
    <span className="text-amber">★</span>
    Level {level}
  </span>
);
