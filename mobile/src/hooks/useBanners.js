import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveBanners } from '../services/api';

/**
 * Loads the homepage banner carousel and tracks the active slide index.
 * Screen-level concerns (sizing, animations) stay in HomeScreen; this hook
 * only owns the async load + scroll-driven index.
 *
 * @param {object} options
 * @param {number} options.bannerWidth – pixel width of one slide (used to
 *   derive the active index from the horizontal scroll offset).
 */
export default function useBanners({ bannerWidth }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await getActiveBanners();
        if (!cancelled) setBanners(items || []);
      } catch {
        if (!cancelled) setBanners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleScroll = useCallback(
    (event) => {
      if (!bannerWidth) return;
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / bannerWidth);
      if (index >= 0 && index < banners.length && index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [bannerWidth, banners.length, currentIndex]
  );

  const scrollToIndex = useCallback(
    (index) => {
      setCurrentIndex(index);
      scrollRef.current?.scrollTo({
        x: index * bannerWidth,
        animated: true,
      });
    },
    [bannerWidth]
  );

  return {
    banners,
    loading,
    currentIndex,
    scrollRef,
    handleScroll,
    scrollToIndex,
  };
}
