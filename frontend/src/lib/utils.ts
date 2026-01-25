import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3001';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
