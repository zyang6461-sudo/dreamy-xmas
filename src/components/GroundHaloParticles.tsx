import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
  y?: number;
  thickness?: number;
  spin?: number;
  densityPower?: number; // 越接近 1 越“铺开”
  size?: number;
  opacity?: number;
};

function makeSoftDotTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

  // 中心亮、边缘透明：像“粉尘粒子”
  g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.22)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function GroundHaloParticles({
  count = 2500,
  innerRadius = 0.2,
  outerRadius = 60,
  y = -10.6,
  thickness = 2.0,
  spin = 0.12,
  densityPower = 1.15,
  size = 0.12,
  opacity = 0.5,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);

  const dotTex = useMemo(() => makeSoftDotTexture(), []);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // u 越接近 0 越靠中心。densityPower 越接近 1 越“铺满全场”
      const u = Math.random() ** densityPower;
      const r = innerRadius + (outerRadius - innerRadius) * u;

      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const yy = y + (Math.random() - 0.5) * thickness;

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = yy;
      pos[i * 3 + 2] = z;
    }

    return pos;
  }, [count, innerRadius, outerRadius, y, thickness, densityPower]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * spin;
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>

        <pointsMaterial
          map={dotTex}
          alphaMap={dotTex}
          transparent
          opacity={opacity}
          size={size}
          sizeAttenuation
          color="#ffffff"
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
