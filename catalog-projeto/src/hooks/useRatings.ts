import { useCallback, useState } from "react";

const STORAGE_KEY = "ratings";

function readRatings(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, number>;
  } catch {
    return {};
  }
}

export function useRatings() {
  const [ratings, setRatings] = useState<Record<number, number>>(() => readRatings());

  const setRating = useCallback((itemId: number, stars: number) => {
    setRatings((prev) => {
      const next = { ...prev, [itemId]: stars };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignora erros de storage */
      }
      return next;
    });
  }, []);

  const getRating = useCallback(
    (itemId: number) => ratings[itemId] ?? 0,
    [ratings]
  );

  return { getRating, setRating };
}
