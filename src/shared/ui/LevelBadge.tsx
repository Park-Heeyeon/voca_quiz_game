export const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-dark font-bold text-sm">
    Level {level}
  </span>
);
