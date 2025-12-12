import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './TiltedCard.css';

const springValues = {
    damping: 30,
    stiffness: 100,
    mass: 2
};

export default function TiltedCard({
    children,
    containerHeight = 'auto',
    containerWidth = '100%',
    scaleOnHover = 1.05,
    rotateAmplitude = 10,
    className = ''
}) {
    const ref = useRef(null);

    const rotateX = useSpring(useMotionValue(0), springValues);
    const rotateY = useSpring(useMotionValue(0), springValues);
    const scale = useSpring(1, springValues);

    const [lastY, setLastY] = useState(0);

    function handleMouse(e) {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

        const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
        const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

        rotateX.set(rotationX);
        rotateY.set(rotationY);

        setLastY(offsetY);
    }

    function handleMouseEnter() {
        scale.set(scaleOnHover);
    }

    function handleMouseLeave() {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
    }

    return (
        <div
            ref={ref}
            className={`tilted-card-wrapper ${className}`}
            style={{
                height: containerHeight,
                width: containerWidth
            }}
            onMouseMove={handleMouse}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="tilted-card-content"
                style={{
                    rotateX,
                    rotateY,
                    scale
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
