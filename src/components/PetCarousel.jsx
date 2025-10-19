// src/components/PetCarousel.jsx
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Horizontal carousel with scroll-snap.
 * - Exactly one full card visible at a time (minWidth: 100%).
 * - Compact indicator dots centered below.
 * - ESLint clean (PropTypes + deps).
 */
export default function PetCarousel({
  items,
  renderItem,
  gap = 12,
  slideWidthPct = 100,        // keep 100% to avoid next-card peeking
  onIndexChange,
}) {
  const railRef = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !rail.firstElementChild) return;

    const first = rail.firstElementChild;
    const cardWidth = first.getBoundingClientRect().width;
    const total = cardWidth + gap;

    const idx = Math.round(rail.scrollLeft / total);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));

    if (clamped !== active) {
      setActive(clamped);
      onIndexChange?.(clamped);
    }
  }, [gap, items.length, onIndexChange, active]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => rail.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const railStyle = useMemo(
    () => ({
      display: "flex",
      gap: `${gap}px`,
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      padding: "0 0 6px",     // no side padding -> no next-card peek
      boxSizing: "border-box",
    }),
    [gap]
  );

  const slideStyle = useMemo(
    () => ({
      minWidth: `${slideWidthPct}%`, // 100% = exactly one card visible
      scrollSnapAlign: "start",
      boxSizing: "border-box",
    }),
    [slideWidthPct]
  );

  const dotsRowStyle = useMemo(
    () => ({
      display: "inline-flex",  // keeps dots snug; width doesn’t stretch items
      justifyContent: "center",
      alignItems: "center",
      gap: 4,                  // compact spacing
      paddingTop: 8,
      width: "100%",
      margin: "0 auto",
    }),
    []
  );

  const dotStyle = useCallback(
    (on) => ({
      width: 8,
      height: 8,
      borderRadius: 999,
      background: on ? "#000" : "#d0d0d0",
    }),
    []
  );

  const scrollToIndex = useCallback((i) => {
    const rail = railRef.current;
    if (!rail || !rail.children[i]) return;
    const child = rail.children[i];
    rail.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, []);

  return (
    <>
      <div ref={railRef} style={railStyle} className="pet-carousel">
        {items.map((it, i) => (
          <div key={i} style={slideStyle} className="pet-slide">
            {renderItem(it, i)}
          </div>
        ))}
      </div>

      <div style={dotsRowStyle} className="pet-dots">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to item ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            className="pet-dot-btn"
          >
            <span
              className={`dot${i === active ? " active" : ""}`}
              style={dotStyle(i === active)}
            />
          </button>
        ))}
      </div>
    </>
  );
}

PetCarousel.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  renderItem: PropTypes.func.isRequired,
  gap: PropTypes.number,
  slideWidthPct: PropTypes.number,
  onIndexChange: PropTypes.func,
};
