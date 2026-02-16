"use client";

import { useState, useEffect, useCallback } from 'react';

export function useCachedState<T>(
  key: string,
  initialValue: T,
  ttl: number = 30000 // 30 seconds default cache time
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    // Try to load from localStorage on mount
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Return cached value if still valid
        if (age < ttl) {
          return value;
        }
      }
    } catch (error) {
      console.error('Error loading cached state:', error);
    }
    
    return initialValue;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        value: state,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cached state:', error);
    }
  }, [key, state]);

  // Force refresh function to clear cache
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cached state:', error);
    }
  }, [key]);

  return [state, setState, refresh];
}
