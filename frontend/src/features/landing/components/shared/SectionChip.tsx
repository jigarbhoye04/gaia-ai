import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionChipProps {
  text: string;
  icon?: LucideIcon; // Optional Lucide icon
}

const SectionChip: React.FC<SectionChipProps> = ({ text, icon: Icon }) => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8">
      {Icon && <Icon className="w-4 h-4 text-[#01BBFF]" />}
      <span className="text-sm font-medium text-white/90">{text}</span>
    </div>
  );
};

export default SectionChip;
