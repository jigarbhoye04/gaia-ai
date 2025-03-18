import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateTitle(title: string, maxLength = 20): string {
  return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
}
