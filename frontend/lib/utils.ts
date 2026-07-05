import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Used throughout the codebase for conditional class composition.
 *
 * @example cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string for display in todo cards.
 * - Today → "Today at 3:45 PM"
 * - Yesterday → "Yesterday at 3:45 PM"
 * - Within 7 days → "3 days ago"
 * - Older → "Jan 5, 2025"
 */
export function formatTodoDate(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }

  const daysDiff = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, "MMM d, yyyy");
}

/**
 * Extracts a readable error message from unknown Axios/fetch errors.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Axios error with response data
    const axiosError = error as {
      response?: { data?: { message?: string } };
      message: string;
    };
    return (
      axiosError.response?.data?.message ??
      axiosError.message ??
      "An unexpected error occurred"
    );
  }
  return "An unexpected error occurred";
}
