import { motion } from "framer-motion";

const clamp = (value: number): number => Math.min(Math.max(value, 0), 100);

export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
    <motion.div
      className="h-full bg-primary rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${clamp(value)}%` }}
      transition={{ duration: 0.4 }}
    />
  </div>
);
