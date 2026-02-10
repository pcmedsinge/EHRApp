/**
 * useDebounce Hook
 * ================
 * 
 * Purpose:
 *   Debounce a value change by specified delay.
 *   Useful for search inputs to avoid excessive API calls.
 * 
 * Module: src/hooks/useDebounce.ts
 * 
 * Usage:
 *   const debouncedValue = useDebounce(searchTerm, 300);
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
