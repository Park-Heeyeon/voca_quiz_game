import { motion } from "framer-motion";

const clamp = (value: number): number => Math.min(Math.max(value, 0), 100);

export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full h-5 bg-brand-soft rounded-full p-1">
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-brand to-coral"
      initial={{ width: 0 }}
      animate={{ width: `${clamp(value)}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  </div>
);
