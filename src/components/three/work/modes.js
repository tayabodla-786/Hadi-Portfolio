import * as THREE from 'three';

export const CAM_Z = 8.5;
export const FOV = 45;
export const CARD_W = 3.4;
export const CARD_H = 2.125;

const SPINE_DY = 2.7;
const HELIX_DY = 2.1;
const HELIX_STEP = 0.95; // radians between neighbouring cards on the carousel
const HELIX_R = 3.1;
const TUNNEL_DZ = 5.5;

const { clamp } = THREE.MathUtils;
const lookTarget = new THREE.Vector3();

export const SCENE_MODES = [
  { id: 'spine', label: 'Spine' },
  { id: 'helix', label: 'Helix' },
  { id: 'tunnel', label: 'Tunnel' },
];

const visibleWidth = (distance, aspect) => 2 * distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;

/**
 * Each mode describes:
 *  - extent(n): the stretch of world the centrepiece and particles fill, along `axis`
 *  - layouts(n, aspect, compact): static transform for every card
 *  - fade(rel): card opacity from its distance to the focused card (rel = progress - index)
 *  - camera(camera, track, p, n, pointer): per-frame camera / carousel placement (p in card units)
 */
export const MODES = {
  spine: {
    axis: 'y',
    extent: (n) => ({ start: 5, end: -(n - 1) * SPINE_DY - 5 }),
    layouts: (n, aspect, compact) => {
      const visW = visibleWidth(CAM_Z, aspect);
      // Compact cards sit 1.8 units nearer the camera, so shrink them to compensate
      const scale = compact ? Math.min(1, (visW * 0.8) / CARD_W) * ((CAM_Z - 1.8) / CAM_Z) : clamp(visW / 9.8, 0.6, 1.05);
      const xOff = compact ? visW * 0.05 : Math.min(2.7, visW * 0.22);
      return Array.from({ length: n }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        return {
          x: side * xOff,
          y: -i * SPINE_DY,
          z: compact ? 1.8 : side < 0 ? -0.4 : 0.6,
          ry: compact ? -side * 0.12 : -side * 0.32,
          rz: side * 0.03,
          scale,
        };
      });
    },
    fade: () => 1,
    camera: (camera, track, p, n, pointer) => {
      const y = -p * SPINE_DY;
      track.rotation.set(0, 0, 0);
      camera.position.set(pointer.x, y + pointer.y - 0.2, CAM_Z);
      camera.lookAt(0, y - 0.1, 0);
    },
  },

  helix: {
    axis: 'y',
    extent: (n) => ({ start: 5, end: -(n - 1) * HELIX_DY - 5 }),
    layouts: (n, aspect, compact) => {
      const r = compact ? 2.2 : HELIX_R;
      const visW = visibleWidth(CAM_Z + 1 - r, aspect);
      const scale = compact ? Math.min(0.9, (visW * 0.78) / CARD_W) : clamp(visW / 8.5, 0.6, 0.95);
      return Array.from({ length: n }, (_, i) => {
        const a = i * HELIX_STEP;
        // Faces outward from the core
        return { x: Math.sin(a) * r, y: -i * HELIX_DY, z: Math.cos(a) * r, ry: a, rz: 0, scale };
      });
    },
    // Cards swinging round the back of the core fade away instead of showing mirrored
    fade: (rel) => clamp((2.3 - Math.abs(rel)) / 0.8, 0, 1),
    camera: (camera, track, p, n, pointer) => {
      const y = -p * HELIX_DY;
      track.rotation.set(0, -p * HELIX_STEP, 0);
      camera.position.set(pointer.x * 1.4, y + pointer.y + 0.7, CAM_Z + 1);
      camera.lookAt(0, y - 0.1, 0);
    },
  },

  tunnel: {
    axis: 'z',
    extent: (n) => ({ start: 10, end: -(n - 1) * TUNNEL_DZ - 18 }),
    layouts: (n, aspect, compact) => {
      const visW = visibleWidth(6, aspect);
      const scale = compact ? Math.min(0.9, (visW * 0.8) / CARD_W) : clamp(visW / 9, 0.6, 1);
      const xOff = compact ? visW * 0.06 : Math.min(2.3, visW * 0.25);
      return Array.from({ length: n }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        return {
          x: side * xOff,
          y: compact ? 0 : side * -0.25,
          z: -i * TUNNEL_DZ - 1,
          ry: compact ? 0 : -side * 0.42,
          rz: side * 0.04,
          scale,
        };
      });
    },
    // Fade in from the depth of the tunnel, fade out just before flying past the camera
    fade: (rel) => (rel > 0 ? clamp(1 - (rel - 0.25) / 0.45, 0, 1) : clamp((4 + rel) / 1.5, 0, 1)),
    camera: (camera, track, p, n, pointer) => {
      const z = 5 - p * TUNNEL_DZ;
      track.rotation.set(0, 0, 0);
      camera.position.set(pointer.x * 0.8, pointer.y * 0.5, z);
      camera.lookAt(lookTarget.set(pointer.x * 0.3, 0, z - 10));
      // Slow barrel roll while flying
      camera.rotateZ(Math.sin(p * 0.9) * 0.06);
    },
  },
};
