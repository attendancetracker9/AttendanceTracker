import React from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";

type LoadingStateProps = {
  lines?: number;
};

export const LoadingState: React.FC<LoadingStateProps> = ({ lines = 3 }) => {
  return (
    <Card className="space-y-4 bg-gradient-to-r from-slate-50 to-white dark:from-white/5 dark:to-transparent">
      <div className="h-4 w-32 rounded-full bg-slate-200/80 dark:bg-white/10" />
      {[...Array(lines)].map((_, index) => (
        <motion.div
          key={index}
          className="h-3 rounded-full bg-slate-200/80 dark:bg-white/10"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1, ease: "easeInOut", repeatType: "reverse" }}
        />
      ))}
    </Card>
  );
};

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <Card className="text-center">
    <p className="text-lg font-semibold">{title}</p>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </Card>
);


