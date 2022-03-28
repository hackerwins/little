import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ScrollToTop is a custom hook that scrolls the page to the top when the user
// navigates to a new page.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
