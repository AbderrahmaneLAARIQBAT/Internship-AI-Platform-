import { useEffect, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = [value, (v: T) => {}]
  
  // Simple implementation returning the value with a hook
  return value
}

export function useDebounceCallback(callback: (...args: unknown[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (...args: unknown[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => callback(...args), delay)
  }
}
