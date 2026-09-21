import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const finePointerQuery = "(hover: hover) and (pointer: fine)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(reducedMotionQuery).matches;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => true);
}

/** Adds a one-shot "reveal-pending" class, then flips it visible when the element scrolls in. */
export function useScrollReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Prepare reveals before paint so nothing flashes, but keep content visible if observation is unavailable.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
        element.classList.remove("reveal-pending");
      });
      return;
    }

    elements.forEach((element) => element.classList.add("reveal-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );

    elements.forEach((element) => observer.observe(element));

    const revealDone = (event: TransitionEvent) => {
      if (event.propertyName !== "translate" || !(event.target instanceof HTMLElement)) return;
      event.target.classList.remove("reveal-pending");
    };

    root.addEventListener("transitionend", revealDone);

    return () => {
      observer.disconnect();
      root.removeEventListener("transitionend", revealDone);
      elements.forEach((element) => element.classList.remove("reveal-pending"));
    };
  }, [prefersReducedMotion]);

  return rootRef;
}

/** Returns true once the element has scrolled into view (fires once). */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/** Cursor-following 3D tilt, desktop pointers only, clamped to +/- 4 degrees. */
export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const reset = useCallback((element: T) => {
    element.style.removeProperty("--tilt-x");
    element.style.removeProperty("--tilt-y");
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion) return;
    if (!window.matchMedia(finePointerQuery).matches) return;

    const onMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
      element.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
    };

    const onMouseLeave = () => reset(element);

    element.addEventListener("mousemove", onMouseMove);
    element.addEventListener("mouseleave", onMouseLeave);

    return () => {
      element.removeEventListener("mousemove", onMouseMove);
      element.removeEventListener("mouseleave", onMouseLeave);
      reset(element);
    };
  }, [prefersReducedMotion, reset]);

  return ref;
}
