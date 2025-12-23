import { motion } from 'framer-motion';
import { useStore } from '../store';

export function Landing() {
  const entered = useStore((s) => s.entered);
  const enter = useStore((s) => s.enter);
  const toggleGesture = useStore((s) => s.toggleGesture);
  const setAudioPlaying = useStore((s) => s.setAudioPlaying);

  if (entered) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-[min(720px,92vw)] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_60px_rgba(255,20,147,0.18)] p-8 md:p-12"
      >
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-pink-500/30 via-white/5 to-fuchsia-500/15 blur-xl opacity-60 pointer-events-none" />

        <div className="relative">
          <h1
            className="text-4xl md:text-6xl font-serif tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-200 drop-shadow-[0_0_18px_rgba(255,182,193,0.35)]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            DREAMY XMAS
          </h1>

          <p className="mt-5 text-pink-100/70 leading-relaxed max-w-[58ch]">
            粉色梦幻 × 科技氛围。点击进入后�?
            <span className="text-white/80">点击屏幕</span>聚合/炸开�?
            <span className="text-white/80">手势模式</span>可用手掌旋转、捏合聚拢�?
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              className="px-8 py-4 rounded-2xl bg-gradient-to-b from-pink-400/60 to-fuchsia-600/40 border border-white/10 text-white font-serif tracking-wider shadow-[0_0_30px_rgba(255,20,147,0.25)] hover:from-pink-400/75 hover:to-fuchsia-600/55 transition"
              onClick={() => {
                enter();
                setAudioPlaying(true);
              }}
            >
              ENTER
            </button>

            <button
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/15 text-white/90 font-serif tracking-wider hover:bg-white/10 transition shadow-[0_0_24px_rgba(255,182,193,0.12)]"
              onClick={() => {
                toggleGesture();
                enter();
                setAudioPlaying(true);
              }}
            >
              GESTURE MODE
            </button>
          </div>

          <div className="mt-6 text-xs text-white/40 tracking-[0.2em]">
            TIP: 如果音乐没响，点右上�?🔊 再试一次（浏览器需要用户交互）
          </div>
        </div>
      </motion.div>
    </div>
  );
}

