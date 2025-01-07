import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches); //this listner is going to be the function that update the mathces state
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);
  return matches;
}
