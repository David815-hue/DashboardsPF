import { useState, useEffect } from 'react';

/**
 * Hook for animated counting up to a target number
 * @param {number} end - Target value to count to
 * @param {number} duration - Animation duration in ms (default 1000)
 * @returns {number} Current animated value
 */
export const useCountUp = (end, duration = 1000) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof end !== 'number' || isNaN(end)) {
            setCount(0);
            return;
        }

        let startTime;
        let animationFrame;
        const startValue = 0;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth end
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (end - startValue) * easeOutQuart;

            setCount(currentValue);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [end, duration]);

    return count;
};
