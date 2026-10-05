import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const MiniAlhamdulillahShape = ({ color = "#ec4899" }) => {
  const meshRef = useRef();

  // Create mini 3D Calligraphy Shape
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.8, -0.2);
    s.bezierCurveTo(-0.8, 0.8, -0.4, 1.2, 0, 1.2);
    s.bezierCurveTo(0.4, 1.2, 0.8, 0.8, 0.8, -0.2);
    s.bezierCurveTo(0.4, -0.6, -0.4, -0.6, -0.8, -0.2);
    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    }),
    []
  );

  // Mini colorful cubes
  const cubes = useMemo(() => {
    const items = [];
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#eab308', '#10b981'];
    for (let i = 0; i < 6; i++) {
      items.push({
        pos: [(Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.5],
        scale: 0.1 + Math.random() * 0.1,
        color: colors[i % colors.length],
      });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1} floatIntensity={1}>
      <group ref={meshRef} scale={0.9}>
        <mesh position={[-0.2, -0.3, 0]}>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.15}
            metalness={0.9}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>

        {cubes.map((c, idx) => (
          <mesh key={idx} position={c.pos} scale={[c.scale, c.scale, c.scale]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={c.color} roughness={0.2} metalness={0.6} />
          </mesh>
        ))}

        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-3, -3, -2]} intensity={1} color={color} />
      </group>
    </Float>
  );
};

const Services3DCanvas = ({ type = 0, color = "#ec4899" }) => {
  return (
    <div className="w-full h-32 relative overflow-hidden rounded-sm bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <MiniAlhamdulillahShape color={color} />
      </Canvas>
    </div>
  );
};

export default Services3DCanvas;
