import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  radius?: number;
  y?: number;
  spin?: number;
  opacity?: number;
};

function makeDustCarpetTexture() {
  const size = 2048;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // 背景轻雾（别太亮，不然糊�?
  const haze = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  haze.addColorStop(0.0, 'rgba(255,255,255,0.06)');
  haze.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  haze.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, size, size);

  // 超密小点（点很小，但数量�?�?“铺满无缝”）
  const N = 70000;
  for (let i = 0; i < N; i++) {
    const u = Math.random() ** 1.02; // 越接�?越铺�?
    const r = u * (size * 0.5);
    const a = Math.random() * Math.PI * 2;

    const x = size / 2 + Math.cos(a) * r;
    const y = size / 2 + Math.sin(a) * r;

    const t = r / (size * 0.5);
    const alpha = (1 - t) ** 1.4 * (0.18 + Math.random() * 0.55);

    const rad = 0.18 + Math.random() * 0.55; // �?小粒�?
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 少量亮点（更清晰的“星尘感”）
  const M = 9000;
  for (let i = 0; i < M; i++) {
    const u = Math.random() ** 1.25;
    const r = u * (size * 0.5);
    const a = Math.random() * Math.PI * 2;

    const x = size / 2 + Math.cos(a) * r;
    const y = size / 2 + Math.sin(a) * r;

    const t = r / (size * 0.5);
    const alpha = (1 - t) ** 2.0 * (0.25 + Math.random() * 0.75);

    const rad = 0.12 + Math.random() * 0.28; // �?更小更锐
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);

  // �?斜视角不糊的关键：mipmaps + anisotropy
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;

  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;

  return tex;
}

export function GroundDustDisk({
  radius = 140,
  y = -11.8,
  spin = 0.05,
  opacity = 0.55,
}: Props) {
  const g = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeDustCarpetTexture(), []);

  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * spin;
  });

  return (
    <group ref={g}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, y, 0]}
        frustumCulled={false}
        renderOrder={-20} // �?永远在最底层
      >
        <circleGeometry args={[radius, 96]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={opacity}
          color="#ffffff"
          depthWrite={false}
          depthTest={true}     // �?让圣诞树遮住地面（树在前面）
          alphaTest={0.25}     // �?边缘更“锐”，减少糊感
          blending={THREE.NormalBlending} // �?不用 additive，避免抹成雾
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

