import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type Props = {
  yMin?: number;
  yMax?: number;
  turns?: number;
  width?: number;      // 丝带宽度
  lift?: number;       // 丝带离树表面的“浮起”距离
  colorCore?: string;  // 内芯颜色
  colorHalo?: string;  // 外晕颜色
};

function makeRibbonAlphaTexture() {
  const w = 256;
  const h = 32;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // 横向：边缘透明，中间亮
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.15)');
  grad.addColorStop(0.50, 'rgba(255,255,255,1.0)');
  grad.addColorStop(0.82, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 叠一点微噪声（更像雾带）
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    img.data[i + 3] = Math.max(0, Math.min(255, img.data[i + 3] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2.2, 1);
  tex.needsUpdate = true;
  return tex;
}

function makeSpriteTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function GalaxyBand({
  yMin = -9.5,
  yMax = 9.5,
  turns = 2.25,
  width = 1.15,
  lift = 1.8,
  colorCore = '#ffffff',
  colorHalo = '#7df9ff',
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matCoreRef = useRef<THREE.MeshBasicMaterial>(null);
  const matHaloRef = useRef<THREE.MeshBasicMaterial>(null);

  const { geoCore, geoHalo, ribbonTex, fogGeo, fogTex } = useMemo(() => {
    // --- 1) 生成螺旋曲线（贴着树外圈） ---
    const pts: THREE.Vector3[] = [];
    const N = 320;

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = THREE.MathUtils.lerp(yMin, yMax, t);

      // 树大致半径: (10-y)*0.4 + noise
      // 丝带半径 = 树半径 + lift
      const baseRadius = (10 - y) * 0.46 + lift;

      const ang = t * turns * Math.PI * 2;
      const x = Math.cos(ang) * baseRadius;
      const z = Math.sin(ang) * baseRadius;

      pts.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
    const frames = curve.computeFrenetFrames(N, false);

    // --- 2) 丝带几何（用 strip 面片，而不是 Tube） ---
    const makeRibbon = (w: number) => {
      const positions = new Float32Array((N + 1) * 2 * 3);
      const uvs = new Float32Array((N + 1) * 2 * 2);
      const indices: number[] = [];

      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = curve.getPointAt(t);
        // 用 binormal 当“横向”，做丝带宽度
        const b = frames.binormals[i];

        const left = p.clone().add(b.clone().multiplyScalar(-w * 0.5));
        const right = p.clone().add(b.clone().multiplyScalar(w * 0.5));

        const vi = i * 2;

        positions[(vi + 0) * 3 + 0] = left.x;
        positions[(vi + 0) * 3 + 1] = left.y;
        positions[(vi + 0) * 3 + 2] = left.z;

        positions[(vi + 1) * 3 + 0] = right.x;
        positions[(vi + 1) * 3 + 1] = right.y;
        positions[(vi + 1) * 3 + 2] = right.z;

        // U: 0..1 across width, V: 0..1 along length
        uvs[(vi + 0) * 2 + 0] = 0;
        uvs[(vi + 0) * 2 + 1] = t;
        uvs[(vi + 1) * 2 + 0] = 1;
        uvs[(vi + 1) * 2 + 1] = t;

        if (i < N) {
          const a = vi;
          const b2 = vi + 1;
          const c = vi + 2;
          const d = vi + 3;
          indices.push(a, b2, c);
          indices.push(b2, d, c);
        }
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      g.setIndex(indices);
      g.computeVertexNormals();
      return g;
    };

    const geoCore = makeRibbon(width * 0.55);
    const geoHalo = makeRibbon(width * 1.0);

    const ribbonTex = makeRibbonAlphaTexture();
    const fogTex = makeSpriteTexture();

    // --- 3) 星云雾 Points：沿着丝带附近撒一堆半透明 sprite ---
    const FOG_COUNT = 1200;
    const fogPos = new Float32Array(FOG_COUNT * 3);

    for (let i = 0; i < FOG_COUNT; i++) {
      const t = Math.random();
      const p = curve.getPointAt(t);

      // 让雾在丝带周围漂一点（横向+纵向抖动）
      const ang = t * turns * Math.PI * 2;
      const radial = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const tangent = curve.getTangentAt(t).normalize();
      const side = new THREE.Vector3().crossVectors(tangent, radial).normalize();

      const r1 = (Math.random() - 0.5) * 1.6;
      const r2 = (Math.random() - 0.5) * 1.0;
      const r3 = (Math.random() - 0.5) * 0.9;

      const pp = p
        .clone()
        .add(radial.multiplyScalar(r1))
        .add(side.multiplyScalar(r2))
        .add(new THREE.Vector3(0, r3, 0));

      fogPos[i * 3 + 0] = pp.x;
      fogPos[i * 3 + 1] = pp.y;
      fogPos[i * 3 + 2] = pp.z;
    }

    const fogGeo = new THREE.BufferGeometry();
    fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));

    return { geoCore, geoHalo, ribbonTex, fogGeo, fogTex };
  }, [yMin, yMax, turns, width, lift]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 轻微旋转 + 呼吸
    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.06;

    // 让纹理“流动”
    if (matCoreRef.current?.map) matCoreRef.current.map.offset.y -= delta * 0.08;
    if (matHaloRef.current?.map) matHaloRef.current.map.offset.y -= delta * 0.06;
  });

  return (
    <group ref={groupRef}>
      {/* 外晕：更宽更淡 */}
      <mesh geometry={geoHalo} renderOrder={20}>
        <meshBasicMaterial
          ref={matHaloRef}
          color={colorHalo}
          map={ribbonTex}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 内芯：更细更亮 */}
      <mesh geometry={geoCore} renderOrder={21}>
        <meshBasicMaterial
          ref={matCoreRef}
          color={colorCore}
          map={ribbonTex}
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 星云雾 */}
      <points geometry={fogGeo} renderOrder={19}>
        <pointsMaterial
          map={fogTex}
          color={colorHalo}
          transparent
          opacity={0.22}
          size={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points geometry={fogGeo} renderOrder={18}>
        <pointsMaterial
          map={fogTex}
          color="#ffffff"
          transparent
          opacity={0.10}
          size={1.25}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
