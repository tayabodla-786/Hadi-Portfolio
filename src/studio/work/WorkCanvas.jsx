import React from 'react';
import { Canvas } from '@react-three/fiber';
import WorkRing from './WorkRing.jsx';

// Split out so three.js only loads as the work stage approaches
const WorkCanvas = (props) => (
  <Canvas camera={{ position: [0, 0, 0], fov: 42, near: 0.1, far: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} flat linear>
    <WorkRing {...props} />
  </Canvas>
);

export default WorkCanvas;
