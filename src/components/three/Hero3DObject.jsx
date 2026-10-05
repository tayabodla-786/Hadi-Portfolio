import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Hero3DObject = () => {
  const meshRef = useRef();
  const wireframeRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const particlesRef = useRef();
  const scrollYRef = useRef(0);
  const { mouse } = useThree();

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Create floating particle points
  const particleCount = 140;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.5 + Math.random() * 2.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scrollFactor = scrollYRef.current * 0.003;

    // Mouse parallax tracking
    const targetX = mouse.x * 0.8;
    const targetY = mouse.y * 0.8;

    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetY + t * 0.15 + scrollFactor * 1.5,
        0.06
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetX + t * 0.25 + scrollFactor * 2.0,
        0.06
      );
      meshRef.current.rotation.z = scrollFactor * 0.8;
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.x = THREE.MathUtils.lerp(
        wireframeRef.current.rotation.x,
        -targetY - t * 0.2 - scrollFactor * 1.8,
        0.06
      );
      wireframeRef.current.rotation.y = THREE.MathUtils.lerp(
        wireframeRef.current.rotation.y,
        -targetX + t * 0.3 + scrollFactor * 2.2,
        0.06
      );
    }

    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.3 + scrollFactor * 2.5;
      ringRef1.current.rotation.x = Math.sin(t * 0.2 + scrollFactor) * 0.6;
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.25 - scrollFactor * 2.0;
      ringRef2.current.rotation.y = Math.cos(t * 0.3 + scrollFactor) * 0.7;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.05 + scrollFactor * 1.2;
      particlesRef.current.rotation.x = Math.sin(t * 0.03 + scrollFactor) * 0.2;
    }
  });

  return (
    <group scale={1.15}>
      {/* Ambient & Cyber Directional Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1.2} color="#ff375f" />
      <pointLight position={[0, 0, 5]} intensity={0.8} color="#0a84ff" />

      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.5}>
        {/* Core Metallic Distorted Sphere / Mesh */}
        <mesh ref={meshRef}>
          <torusKnotGeometry args={[1.1, 0.35, 128, 32]} />
          <MeshDistortMaterial
            color="#141419"
            roughness={0.2}
            metalness={0.9}
            distort={0.3}
            speed={2.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Outer Wireframe Cyber Lattice */}
        <mesh ref={wireframeRef} scale={[1.18, 1.18, 1.18]}>
          <torusKnotGeometry args={[1.1, 0.36, 64, 16]} />
          <meshStandardMaterial
            color="#ff375f"
            wireframe
            transparent
            opacity={0.38}
            emissive="#ff375f"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Orbital Ring 1 */}
        <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.2, 0.015, 16, 100]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>

        {/* Orbital Ring 2 */}
        <mesh ref={ringRef2} rotation={[-Math.PI / 4, 0.5, 0]}>
          <torusGeometry args={[2.5, 0.012, 16, 100]} />
          <meshBasicMaterial color="#ff375f" transparent opacity={0.5} />
        </mesh>

        {/* Floating Particle Point Cloud */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.045}
            color="#ffffff"
            transparent
            opacity={0.75}
            sizeAttenuation
          />
        </points>
      </Float>
    </group>
  );
};

export default Hero3DObject;
