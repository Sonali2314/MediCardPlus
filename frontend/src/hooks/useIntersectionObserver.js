import { useEffect, useRef, useState } from 'react';

const useIntersectionObserver = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = elementRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (target) {
          observer.unobserve(target);
        }
      }
    }, {
      threshold: 0.1,
      ...options
    });

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
};

export default useIntersectionObserver;