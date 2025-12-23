import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

import { ParticleTree } from './ParticleTree';
import { StarTop } from './StarTop';
import { GalaxyBand } from './GalaxyBand';
import { GroundHaloParticles } from './GroundHaloParticles';
import { GroundDustDisk } from './GroundDustDisk';
import { NebulaFloor } from './NebulaFloor';
import { FloatingSnow } from './FloatingSnow';

function StarAnchor({
  topYRef,
  offset = 2.2,
  scale = 1.55,
  children,
}: {
  topYRef: React.MutableRefObject<number>;
  offset?: number;
  scale?: number;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!g.current) return;
    g.current.position.y = topYRef.current + offset;
  });

  return <group ref={g} scale={scale}>{children}</group>;
}

function Scene({
  gestureRotation,
  postFxEnabled,
}: {
  gestureRotation: React.MutableRefObject<number>;
  postFxEnabled: boolean;
}) {
  const topYRef = useRef<number>(10);

  const treeGroupPos: [number, number, number] = [0, -3.5, 0];
  const treeGroupScale = 1.5;

  const treeBottomWorldY = treeGroupPos[1] + -10 * treeGroupScale;

  return (
    <>
      <color attach="background" args={['#050103']} />
      <fog attach="fog" args={['#050103', 140, 340]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight intensity={0.55} color="#ffd1ea" groundColor="#120016" />

      <spotLight
        position={[12, 18, 14]}
        angle={0.28}
        penumbra={1}
        intensity={2.2}
        color="#FFB7C5"
        castShadow={false}
      />

      <directionalLight position={[-10, 8, -10]} intensity={0.95} color="#ff4fd6" />
      <directionalLight position={[12, 10, 12]} intensity={0.75} color="#7df9ff" />
      <directionalLight position={[0, 16, 18]} intensity={0.95} color="#ffffff" />
      <directionalLight position={[-14, 10, 8]} intensity={0.55} color="#ffd6f0" />

      <pointLight position={[0, -12, 0]} intensity={6} color="#ff00ff" distance={55} />
      <pointLight position={[0, 6, 16]} intensity={7} color="#ff7ad9" distance={120} />

      
<Environment preset="city" background={false} resolution={64} frames={1} />
      {/* 原本背景星尘 */}
      <Sparkles count={90} scale={[60, 35, 60]} size={1.0} speed={0.10} opacity={0.18} color="#fff" />
      <Sparkles count={60} scale={[60, 35, 60]} size={0.85} speed={0.07} opacity={0.10} color="#7df9ff" />

      {/* ✅ 新增：粉色空气微粒（两层叠加） */}
      <Sparkles
        count={110}
        scale={[70, 45, 70]}
        size={0.9}
        speed={0.06}
        opacity={0.10}
        color="#ff78d6"
      />
      <Sparkles
        count={55}
        scale={[70, 45, 70]}
        size={1.6}
        speed={0.03}
        opacity={0.06}
        color="#ff4fd8"
      />

      {/* 雪花 */}
      <FloatingSnow
        count={1100}
        area={85}
        height={55}
        yBase={-2}
        fallSpeed={0.7}
        drift={0.7}
        sizeMin={0.38}
        sizeMax={1.05}
        opacity={0.72}
      />

      <group position={treeGroupPos} scale={treeGroupScale}>
        <ParticleTree gestureRotation={gestureRotation} topYRef={topYRef} />

        <NebulaFloor y={-10.2} count={16000} />

        <GroundDustDisk radius={120} y={-9.9} spin={0.05} opacity={0.68} />
        <GroundDustDisk radius={135} y={-10.3} spin={-0.03} opacity={0.36} />

        <GroundHaloParticles
          count={1800}
          innerRadius={0.05}
          outerRadius={90}
          y={-10.9}
          thickness={2.0}
          spin={0.1}
          densityPower={1.06}
          size={0.14}
          opacity={0.20}
        />
        <GroundHaloParticles
          count={900}
          innerRadius={0.05}
          outerRadius={80}
          y={-10.3}
          thickness={2.6}
          spin={-0.14}
          densityPower={1.18}
          size={0.095}
          opacity={0.14}
        />

        <GalaxyBand width={0.95} lift={1.15} turns={2.35} colorCore="#ffffff" colorHalo="#ff7ad9" />

        <StarAnchor topYRef={topYRef} offset={2.4} scale={1.55}>
          <StarTop />
        </StarAnchor>
      </group>

      <ContactShadows
        position={[0, treeBottomWorldY - 1.2, 0]}
        opacity={0.26}
        scale={70}
        blur={3.0}
        far={26}
        resolution={256}
        frames={1}
        color="#1a0010"
      />

      {postFxEnabled && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.55} intensity={0.45} radius={0.55} />
          <Vignette eskil={false} offset={0.18} darkness={0.45} />
          <Noise opacity={0.02} />
        </EffectComposer>
      )}

      <OrbitControls enableZoom={false} enablePan={false} target={[0, -2.5, 0]} />
    </>
  );
}

export default function Experience({
  gestureRotation,
}: {
  gestureRotation: React.MutableRefObject<number>;
}) {
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const [glReady, setGlReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    if (!glReady) return;

    const gl = glRef.current;
    if (!gl) return;

    const el = gl.domElement;

    const onLost = (e: any) => {
      e.preventDefault?.();
      setContextLost(true);
    };

    const onRestored = () => {
      setContextLost(false);
      setCanvasKey((k) => k + 1);
    };

    el.addEventListener('webglcontextlost', onLost, { passive: false });
    el.addEventListener('webglcontextrestored', onRestored);

    return () => {
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [glReady, canvasKey]);

  return (
    <Canvas
      key={canvasKey}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      shadows={false}
      camera={{ position: [0, 3.6, 72], fov: 34 }}
      dpr={[1, 1]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        glRef.current = gl;
        setGlReady(true);

        gl.setClearColor('#050103', 1);

        if ('outputColorSpace' in gl) {
          (gl as any).outputColorSpace = THREE.SRGBColorSpace;
        } else if ((THREE as any).sRGBEncoding) {
          (gl as any).outputEncoding = (THREE as any).sRGBEncoding;
        }

        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
    >
      <Scene gestureRotation={gestureRotation} postFxEnabled={!contextLost} />
    </Canvas>
  );
}
