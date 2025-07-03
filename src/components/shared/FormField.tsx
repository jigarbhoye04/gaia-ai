import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
