import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const COUNT = 7500;

const bottomC = new THREE.Color('#6b1bff'); // �?
const midC = new THREE.Color('#ff4fd8');    // 霓虹�?
const topC = new THREE.Color('#ffffff');    // �?
const iceC = new THREE.Color('#e9ffff');    // 冰青�?
const lavC = new THREE.Color('#efe6ff');    // 冰紫�?

function boostColor(c: THREE.Color, t01: number) {
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);

  const satBoost = 1.25 + (1 - t01) * 0.35;
  const lightBoost = 1.05 + t01 * 0.10;

  hsl.s = THREE.MathUtils.clamp(hsl.s * satBoost, 0, 1);
  hsl.l = THREE.MathUtils.clamp(hsl.l * lightBoost, 0, 1);

  c.setHSL(hsl.h, hsl.s, hsl.l);
  return c;
}

export const ParticleTree = ({
  gestureRotation,
  topYRef,
}: {
  gestureRotation: React.MutableRefObject<number>;
  topYRef?: React.MutableRefObject<number>;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const mode = useStore((s) => s.mode);

  const data = useMemo(() => {
    const treePositions = new Float32Array(COUNT * 3);
    const explodePositions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    let maxY = -Infinity;

    for (let i = 0; i < COUNT; i++) {
      // 树形：y -10..10
      const y = Math.random() * 20 - 10;
      if (y > maxY) maxY = y;

      // 让树更“锥形�?
      const t = THREE.MathUtils.clamp((y + 10) / 20, 0, 1); // 0..1
      const baseR = THREE.MathUtils.lerp(9.0, 0.6, t);      // 底大顶小
      const jitter = Math.random() * 1.2;

      const angle = y * 5 + Math.random() * Math.PI * 2;
      const r = baseR + jitter;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const i3 = i * 3;
      treePositions[i3] = x;
      treePositions[i3 + 1] = y;
      treePositions[i3 + 2] = z;

      // 爆炸：均匀球面（半径稍大一点，爆炸更明显）
      const phi = Math.acos(-1 + (2 * i) / COUNT);
      const theta = Math.sqrt(COUNT * Math.PI) * phi;
      const rExplode = 32 + Math.random() * 14;

      explodePositions[i3] = rExplode * Math.cos(theta) * Math.sin(phi);
      explodePositions[i3 + 1] = rExplode * Math.sin(theta) * Math.sin(phi);
      explodePositions[i3 + 2] = rExplode * Math.cos(phi);

      // 颜色：紫 -> �?-> 白，并增强饱�?亮度
      const base = new THREE.Color();
      if (t < 0.62) base.lerpColors(bottomC, midC, t / 0.62);
      else base.lerpColors(midC, topC, (t - 0.62) / 0.38);

      base.offsetHSL(
        (Math.random() - 0.5) * 0.045,
        (Math.random() - 0.5) * 0.18,
        (Math.random() - 0.5) * 0.12
      );
      boostColor(base, t);

      // �?冰闪点（顶端更多�?
      const r01 = Math.random();
      const topBoost = THREE.MathUtils.smoothstep(t, 0.55, 1.0);

      let c = base;
      if (r01 < 0.06 + 0.08 * topBoost) c = (Math.random() > 0.5 ? iceC : lavC);
      else if (r01 < 0.16 && Math.abs((y + Math.random() * 0.2) % 2.6) < 0.18) c = topC;

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    return { treePositions, explodePositions, colors, maxY };
  }, []);

  // 顶部Y给星�?
  useEffect(() => {
    if (topYRef) topYRef.current = data.maxY;
  }, [data.maxY, topYRef]);

  // 当前插值位置（会被每帧修改�?
  const current = useRef<Float32Array>(new Float32Array(data.treePositions));

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(current.current, 3));
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    return g;
  }, [data.colors]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    // 旋转 + 手势
    pointsRef.current.rotation.y += delta * 0.08;
    pointsRef.current.rotation.y += (gestureRotation.current - pointsRef.current.rotation.y) * 0.06;

    // �?兼容你的按钮：ASSEMBLE/EXPLODE（也兼容 TREE�?
   const isTree = mode !== 'EXPLODE';


    // 帧率无关插�?
    const a = 1 - Math.exp(-3 * delta);

    const cur = current.current;
    const tgt = isTree ? data.treePositions : data.explodePositions;

    for (let i = 0; i < COUNT * 3; i += 3) {
      cur[i] += (tgt[i] - cur[i]) * a;
      cur[i + 1] += (tgt[i + 1] - cur[i + 1]) * a;
      cur[i + 2] += (tgt[i + 2] - cur[i + 2]) * a;
    }

    (geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geom} frustumCulled={false}>
      <pointsMaterial
        vertexColors
        toneMapped={false}
        fog={false}
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        size={0.32}          // �?这个值决定“树会不会肉眼可见�?
        sizeAttenuation
      />
    </points>
  );
};

