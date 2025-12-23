import { useStore } from '../store';

export function Overlay() {
  const entered = useStore((s) => s.entered);
  const mode = useStore((s) => s.mode);
  const toggleMode = useStore((s) => s.toggleMode);
  const gestureEnabled = useStore((s) => s.gestureEnabled);
  const toggleGesture = useStore((s) => s.toggleGesture);
  const audioPlaying = useStore((s) => s.audioPlaying);
  const toggleAudio = useStore((s) => s.toggleAudio);

  if (!entered) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none p-6 md:p-8">
      {/* Top bar */}
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl md:text-4xl font-serif tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-200 drop-shadow-[0_0_14px_rgba(255,182,193,0.35)]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            DREAMY XMAS
          </div>
          <div className="mt-2 text-xs md:text-sm text-pink-100/45 tracking-[0.35em]">
            CLICK ANYWHERE TO TOGGLE
          </div>
        </div>

        <button
          className="pointer-events-auto h-12 w-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition shadow-[0_0_24px_rgba(255,20,147,0.15)]"
          onClick={toggleAudio}
          title="Toggle music"
        >
          <span className="text-xl">{audioPlaying ? '🔊' : '🔇'}</span>
        </button>
      </div>

      {/* Center hint */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center pointer-events-none">
          <div className="text-[11px] md:text-xs text-pink-100/35 tracking-[0.45em] animate-pulse">
            {gestureEnabled ? 'MOVE YOUR HAND TO ROTATE' : 'CLICK TO EXPLODE / ASSEMBLE'}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 flex gap-3 pointer-events-auto">
        <button
          onClick={toggleMode}
          className="px-6 py-3 rounded-2xl bg-black/35 border border-pink-500/25 text-pink-50 font-serif hover:bg-pink-500/10 transition shadow-[0_0_28px_rgba(255,20,147,0.18)]"
        >
          {mode === 'TREE' ? 'EXPLODE' : 'ASSEMBLE'}
        </button>

        <button
          onClick={toggleGesture}
          className={`px-6 py-3 rounded-2xl border font-serif transition shadow-[0_0_28px_rgba(255,20,147,0.12)] ${
            gestureEnabled
              ? 'bg-pink-500/15 border-pink-500/45 text-white'
              : 'bg-black/35 border-white/10 text-white/70 hover:border-white/30'
          }`}
        >
          GESTURE {gestureEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

