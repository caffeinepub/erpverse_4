import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when key changes
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
      else setStoredValue(initialValueRef.current);
    } catch {
      setStoredValue(initialValueRef.current);
    }
  }, [key]);

  return [storedValue, setValue] as const;
}
