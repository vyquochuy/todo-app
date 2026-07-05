import { useEffect, useState } from "react";

/**
 * Debounces a value by the given delay (ms).
 *
 * Used for search input so we don't fire an API request on every keystroke.
 * Default delay of 300ms is a comfortable UX balance between responsiveness
 * and reducing unnecessary network requests.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300);
 * // Only changes after user stops typing for 300ms
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
