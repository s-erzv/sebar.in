import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @param {...(string|object|array|undefined|null|boolean)}
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}