import{ useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  count?: number;
  area?: number;        // x/z范围
  height?: number;      // y范围
  yBase?: number;       // 基准高度
  fallSpeed?: number;   // 下落速度
  drift?: number;       // 横向飘动
  sizeMin?: number;     // 最小雪花尺寸（世界单位）
  sizeMax?: number;     // 最大雪花尺寸（世界单位）
  opacity?: number;
};

function makeSnowflakeTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // 只给“线条”一点柔光（不会出现圆形底）
  ctx.shadowColor = 'rgba(255,255,255,0.55)';
  ctx.shadowBlur = size * 0.06;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineCap = 'round';

  const drawArm = () => {
    // 主干：细 + 轻微加粗（更像雪花）
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = size * 0.018;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.lineWidth = size * 0.045;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R * 0.92, 0);
    ctx.stroke();

    // 分叉（只画线，不画面）
    const branch = (t: number, len: number, ang: number) => {
      const x = R * t;
      ctx.globalAlpha = 0.90;
      ctx.lineWidth = size * 0.014;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + len * Math.cos(ang), len * Math.sin(ang));
      ctx.stroke();
    };

    branch(0.35, R * 0.22, 0.72);
    branch(0.35, R * 0.22, -0.72);
    branch(0.60, R * 0.18, 0.85);
    branch(0.60, R * 0.18, -0.85);
    branch(0.80, R * 0.12, 0.98);
    branch(0.80, R * 0.12, -0.98);
  };

  // 6 臂
  for (let k = 0; k < 6; k++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * k) / 6);
    drawArm();
    ctx.restore();
  }

  // 中心小点（很小，不会形成“圆包裹”）
  ctx.shadowBlur = size * 0.03;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function FloatingSnow({
  count = 260,
  area = 85,
  height = 55,
  yBase = -2,
  fallSpeed = 0.7,
  drift = 0.7,
  sizeMin = 0.35,   // ✅ 大一点（你想更大就改 0.45）
  sizeMax = 0.95,   // ✅ 最大雪花大小
  opacity = 0.72,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const tex = useMemo(() => makeSnowflakeTexture(128), []);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    const rot = new Float32Array(count);
    const rotSpeed = new Float32Array(count);
    const scale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() * 2 - 1) * area;
      pos[i3 + 1] = yBase + Math.random() * height;
      pos[i3 + 2] = (Math.random() * 2 - 1) * area;

      speed[i] = (0.35 + Math.random() * 0.9) * fallSpeed;
      phase[i] = Math.random() * 1000;

      rot[i] = Math.random() * Math.PI * 2;
      rotSpeed[i] = (Math.random() * 2 - 1) * 0.8;

      // 大小分布：大雪花更少（偏小为主，少量大的）
      const t = Math.pow(Math.random(), 1.8);
      scale[i] = THREE.MathUtils.lerp(sizeMax, sizeMin, t);
    }

    return { pos, speed, phase, rot, rotSpeed, scale };
  }, [count, area, height, yBase, fallSpeed, sizeMin, sizeMax]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    const m = meshRef.current;
    if (!m) return;

    const t = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 下落
      data.pos[i3 + 1] -= data.speed[i] * delta;

      // 横向飘（更像 reference 那种慢飘）
      data.pos[i3] += Math.sin(t * 0.6 + data.phase[i]) * drift * delta * 0.65;
      data.pos[i3 + 2] += Math.cos(t * 0.5 + data.phase[i]) * drift * delta * 0.35;

      // 旋转
      data.rot[i] += data.rotSpeed[i] * delta;

      // 重生
      if (data.pos[i3 + 1] < yBase - 2) {
        data.pos[i3 + 1] = yBase + height;
        data.pos[i3] = (Math.random() * 2 - 1) * area;
        data.pos[i3 + 2] = (Math.random() * 2 - 1) * area;
        data.phase[i] = Math.random() * 1000;
      }

      dummy.position.set(data.pos[i3], data.pos[i3 + 1], data.pos[i3 + 2]);
      // billboard：面向相机（简化版：只绕Z转；r3f默认相机朝向时效果很好）
      dummy.rotation.set(0, 0, data.rot[i]);
      dummy.scale.setScalar(data.scale[i]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }

    m.instanceMatrix.needsUpdate = true;
  });

  // ✅ 释放贴图，避免热更新堆资源
  const disposeTimer = useRef<number | null>(null);

useEffect(() => {
  // 如果 StrictMode 触发“cleanup 后立刻又 setup”，这里会把刚刚排队的 dispose 取消掉
  if (disposeTimer.current !== null) {
    window.clearTimeout(disposeTimer.current);
    disposeTimer.current = null;
  }

  return () => {
    // 真正卸载时才会走到这里且不会再有下一次 setup 来取消
    disposeTimer.current = window.setTimeout(() => {
      tex.dispose();
      disposeTimer.current = null;
    }, 0);
  };
}, [tex]);


  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        // 更像真实雪：用 NormalBlending（别用 Additive 过亮）
        blending={THREE.NormalBlending}
        // 丢掉低alpha像素，减少过度绘制（更稳也更清爽）
        alphaTest={0.05}
      />
    </instancedMesh>
  );
}
