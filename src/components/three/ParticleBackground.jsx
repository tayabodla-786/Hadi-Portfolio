import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

const ParticleBackground = () => {
    const points = useRef();
    const count = 5000;

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25; // z
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (points.current) {
            points.current.rotation.y = state.clock.getElapsedTime() * 0.03;
            points.current.rotation.x = state.clock.getElapsedTime() * 0.01;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.02} color="#5eead4" sizeAttenuation transparent opacity={0.6} />
        </points>
    );
};

export default ParticleBackground;
