import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

type Props = {
  y?: number;
  count?: number;
};

export function NebulaFloor({ y = -11.5, count = 18000 }: Props) {
  return (
    <group position={[0, y, 0]} rotation={[-0.18, 0, 0]}>
      <FloorDust count={count} />
      <FloorOrbits />
    </group>
  );
}

function FloorDust({ count }: { count: number }) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  const { geom, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    const Z_NEAR = -10;
    const Z_FAR = -240;

    for (let i = 0; i < count; i++) {
      const t = Math.pow(Math.random(), 1.65); // 偏向更远
      const z = THREE.MathUtils.lerp(Z_NEAR, Z_FAR, t);

      const spread = 26 + (-z) * 0.55; // 越远越宽
      const x = (Math.random() - 0.5) * spread;

      const yy = (Math.random() - 0.5) * 1.6;

      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = yy;
      positions[i3 + 2] = z;

      seeds[i] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 18.0 },     // 基础点大小
        uFadeNear: { value: 12.0 },
        uFadeFar: { value: 210.0 },
        uCold: { value: new THREE.Color('#9fe7ff') },
        uWarm: { value: new THREE.Color('#ff78d6') },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uSize;
        uniform float uFadeNear;
        uniform float uFadeFar;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec3 p = position;

          // 轻微流动
          p.x += sin(uTime * 0.35 + aSeed * 6.2831) * 0.08;
          p.y += cos(uTime * 0.25 + aSeed * 6.2831) * 0.06;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float depth = -mv.z;

          // 深度衰减
          float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, depth);

          // 很轻的闪烁
          float tw = 0.85 + 0.15 * sin(uTime * 1.2 + aSeed * 19.0);
          vAlpha = fade * tw;

          // 少量偏粉（避免“粉布”）
          vMix = step(0.88, aSeed); // ~12%

          // 点大小：透视 + clamp（防止异常过大导致 overdraw）
          float ps = uSize * (1.0 / max(depth, 1.0));
          gl_PointSize = clamp(ps, 0.65, 2.2);

          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uCold;
        uniform vec3 uWarm;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);

          // ✅ 直接丢弃外圈像素，减少填充率（非常关键）
          if (d > 0.55) discard;

          float a = smoothstep(0.55, 0.0, d);
          a = a * a; // 更柔

          vec3 col = mix(uCold, uWarm, vMix);

          float outA = a * vAlpha;

          // 再丢弃极低 alpha（减少 blending 压力）
          if (outA < 0.01) discard;

          gl_FragColor = vec4(col, outA);
        }
      `,
    });

    return { geom, material };
  }, [count]);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
  });

  // ✅ 关键：释放 GPU 资源（不然 HMR/重建会越堆越大，最后 Context Lost）
  useEffect(() => {
    return () => {
      geom.dispose();
      material.dispose();
    };
  }, [geom, material]);

  return (
    <points geometry={geom} frustumCulled={false}>
      <primitive object={material} attach="material" ref={matRef as any} />
    </points>
  );
}

function FloorOrbits() {
  const rings = useMemo(() => {
    const mkArc = (r: number, y: number, start: number, end: number, seg = 140) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= seg; i++) {
        const t = i / seg;
        const a = THREE.MathUtils.lerp(start, end, t);
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      return pts;
    };

    return [
      { pts: mkArc(13, 0.25, -0.5, Math.PI * 1.35), rotY: 0.2, opacity: 0.16 },
      { pts: mkArc(20, 0.05, 0.2, Math.PI * 1.65), rotY: -0.35, opacity: 0.12 },
      { pts: mkArc(28, -0.15, -0.2, Math.PI * 1.25), rotY: 0.55, opacity: 0.09 },
    ];
  }, []);

  return (
    <group rotation={[0, 0.08, 0]}>
      {rings.map((r, idx) => (
        <group key={idx} rotation={[0, r.rotY, 0]}>
          <Line
            points={r.pts}
            color="#caa6ff"
            dashed
            dashSize={1.2}
            gapSize={1.2}
            lineWidth={1}
            transparent
            opacity={r.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </group>
      ))}
    </group>
  );
}
