import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const About3DCalligraphyCore = () => {
  const groupRef = useRef();
  const { mouse } = useThree();

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.2, -0.4);
    s.bezierCurveTo(-1.2, 1.2, -0.6, 1.6, 0, 1.6);
    s.bezierCurveTo(0.6, 1.6, 1.2, 1.2, 1.2, -0.4);
    s.bezierCurveTo(0.6, -0.8, -0.6, -0.8, -1.2, -0.4);
    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 4,
    }),
    []
  );

  const cubes = useMemo(() => {
    const items = [];
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#eab308', '#10b981', '#f43f5e'];
    for (let i = 0; i < 16; i++) {
      items.push({
        pos: [(Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.0, (Math.random() - 0.5) * 2.5],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale: 0.12 + Math.random() * 0.12,
        color: colors[i % colors.length],
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const targetX = mouse.x * 0.5;
    const targetY = mouse.y * 0.5;

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY + Math.sin(t * 0.3) * 0.1, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX + t * 0.2, 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={1.1}>
      <mesh position={[-0.3, -0.4, 0]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.15}
          metalness={0.92}
          emissive="#ec4899"
          emissiveIntensity={0.25}
        />
      </mesh>

      {cubes.map((c, idx) => (
        <mesh key={idx} position={c.pos} rotation={c.rot} scale={[c.scale, c.scale, c.scale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={c.color} roughness={0.2} metalness={0.6} />
        </mesh>
      ))}

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 0, 4]} intensity={1.5} color="#ec4899" />
    </group>
  );
};

const About3DCanvas = () => {
  return (
    <div className="w-full aspect-square max-w-sm mx-auto relative overflow-hidden rounded-sm bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex items-center justify-center shadow-2xl">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <Float speed={2} rotationIntensity={0.8} floatIntensity={1}>
          <About3DCalligraphyCore />
        </Float>
      </Canvas>
    </div>
  );
};

export default About3DCanvas;
