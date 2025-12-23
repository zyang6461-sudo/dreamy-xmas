import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { useStore } from '../store';

export function GestureController({
  gestureRotationRef,
}: {
  gestureRotationRef: React.MutableRefObject<number>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorX = useRef<number>(window.innerWidth * 0.5);
  const cursorY = useRef<number>(window.innerHeight * 0.5);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastModeRef = useRef<'TREE' | 'EXPLODE' | null>(null);

  const [loaded, setLoaded] = useState(false);

  const gestureEnabled = useStore((s) => s.gestureEnabled);
  const setMode = useStore((s) => s.setMode);

  useEffect(() => {
    let cancelled = false;

    async function enable() {
      try {
        setLoaded(false);
        lastVideoTimeRef.current = -1;
        lastModeRef.current = null;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        handLandmarkerRef.current?.close();
        handLandmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          setLoaded(true);
        }

        const loop = () => {
          if (cancelled) return;

          const v = videoRef.current;
          const lmkr = handLandmarkerRef.current;

          if (!gestureEnabled || !v || !lmkr) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          if (v.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = v.currentTime;

            const result = lmkr.detectForVideo(v, performance.now());
            const lm = result.landmarks?.[0];

            if (lm && lm.length >= 21) {
              // Pinch distance (thumb tip 4, index tip 8)
              const thumbTip = lm[4];
              const indexTip = lm[8];
              const pinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

              // Rough "open hand" heuristic: spread of fingertips from palm
              const palm = lm[0];
              const spread = (pt: any) => Math.hypot(pt.x - palm.x, pt.y - palm.y);
              const openScore =
                spread(lm[8]) + spread(lm[12]) + spread(lm[16]) + spread(lm[20]);

              const nextMode: 'TREE' | 'EXPLODE' =
                pinch < 0.05 ? 'TREE' : openScore > 1.8 ? 'EXPLODE' : (lastModeRef.current ?? 'EXPLODE');

              if (lastModeRef.current !== nextMode) {
                lastModeRef.current = nextMode;
                setMode(nextMode);
              }

              // Rotation control: palm/index_mcp x (5) mapped to rotation
              const handX = lm[5].x; // 0..1
              const targetRot = (handX - 0.5) * 10;
              gestureRotationRef.current = THREE.MathUtils.lerp(
                gestureRotationRef.current,
                targetRot,
                0.15
              );

              // Cursor follow: use index tip (8), mirror x because video mirrored
              const cx = (1 - indexTip.x) * window.innerWidth;
              const cy = indexTip.y * window.innerHeight;

              cursorX.current = THREE.MathUtils.lerp(cursorX.current, cx, 0.22);
              cursorY.current = THREE.MathUtils.lerp(cursorY.current, cy, 0.22);

              const el = cursorRef.current;
              if (el) {
                el.style.transform = `translate(${cursorX.current - 10}px, ${cursorY.current - 10}px)`;
                el.style.opacity = '1';
              }
            }
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        console.error('[GestureController] enable failed:', e);
      }
    }

    function disable() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if (videoRef.current) videoRef.current.srcObject = null;

      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;

      setLoaded(false);
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    }

    if (gestureEnabled) enable();
    else disable();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [gestureEnabled, setMode, gestureRotationRef]);

  if (!gestureEnabled) return null;

  return (
    <>
      {/* Finger cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          background: 'rgba(255,105,180,0.85)',
          boxShadow: '0 0 18px rgba(255,105,180,0.9), 0 0 38px rgba(255,0,255,0.5)',
          opacity: 0,
          transform: `translate(${cursorX.current}px, ${cursorY.current}px)`,
        }}
      />

      {/* Camera preview */}
      <div className="fixed bottom-4 right-4 w-36 h-28 border-2 border-pink-500/50 rounded-xl overflow-hidden bg-black/50 backdrop-blur-md z-50">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-pink-200">
            Loading AI...
          </div>
        )}
      </div>
    </>
  );
}

