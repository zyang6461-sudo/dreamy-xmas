import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

export function StarTop() {
  const groupRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const outerR = 1.25;
    const innerR = 0.55;
    const points: THREE.Vector2[] = [];

    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }

    const shape = new THREE.Shape(points);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.09,
      bevelSegments: 3,
    });

    g.center();
    return g;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.9;
    groupRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.12}
          metalness={0.75}
          emissive="#ff7fc7"
          emissiveIntensity={2.4}
          toneMapped={false}
          transparent
          opacity={0.98}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} scale={0.86} renderOrder={11}>
        <meshStandardMaterial
          color="#ffd6ef"
          roughness={0.22}
          metalness={0.35}
          emissive="#ffffff"
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Sparkles count={120} scale={[6.5, 6.5, 6.5]} size={2.0} speed={0.22} opacity={0.55} color="#ffffff" />
      <Sparkles count={40} scale={[4.5, 4.5, 4.5]} size={3.2} speed={0.12} opacity={0.25} color="#7df9ff" />
    </group>
  );
}

