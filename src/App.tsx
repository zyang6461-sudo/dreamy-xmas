import { Suspense, useEffect, useMemo, useRef } from 'react';
import Experience from './components/Experience';
import { Overlay } from './components/Overlay';
import { Landing } from './components/Landing';
import { GestureController } from './components/GestureController';
import { GreetingOverlay } from './components/GreetingOverlay';
import { useStore } from './store';

export default function App() {
  const entered = useStore((s) => s.entered);
  const enter = useStore((s) => s.enter);

  const toggleMode = useStore((s) => s.toggleMode);
  const audioPlaying = useStore((s) => s.audioPlaying);

  const gestureRotationRef = useRef(0);

  const bgMusic = useMemo(() => {
    const a = new Audio('/christmas_loop.mp3'); // 没有也不影响画面
    a.loop = true;
    a.volume = 0.55;
    return a;
  }, []);

  useEffect(() => {
    if (!entered) return;
    if (audioPlaying) {
      bgMusic.play().catch(() => {
        // 浏览器策略：需要用户手�?
      });
    } else {
      bgMusic.pause();
    }
  }, [entered, audioPlaying, bgMusic]);

  return (
    <div
      className="w-full h-screen relative overflow-hidden bg-[#050103]"
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        // 点击按钮不触发切�?
        if (target?.closest('button')) return;

        // 未进入：点背景也算进�?
        if (!entered) {
          enter();
          return;
        }

        // 已进入：点击切换模式
        toggleMode();
      }}
    >
      <Suspense fallback={<div className="text-white/60 p-6">Loading Magic...</div>}>
        <Experience gestureRotation={gestureRotationRef} />
      </Suspense>

      {/* 你原来的 UI */}
      <Landing />
      <Overlay />
      <GestureController gestureRotationRef={gestureRotationRef} />

      {/* �?新增：右侧文案叠层（永远�?Canvas 上面，不�?fog/bloom 影响�?*/}
      <GreetingOverlay />
    </div>
  );
}

