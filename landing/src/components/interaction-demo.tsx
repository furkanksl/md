import { ArrowRight, MousePointer2, PanelLeft } from "lucide-react";
import { motion } from "framer-motion";

export const InteractionDemo = () => {
  return (
    <section className="w-full bg-white relative overflow-hidden min-h-screen flex flex-col justify-center items-center py-20 px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 justify-center">
          <div className="flex-1 space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 text-[#738F82] font-medium text-sm tracking-wide uppercase">
              <PanelLeft size={16} strokeWidth={1.5} />
              <span>Auto-Hide</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#44403C] leading-tight">
              Hidden until you <br /> need it.
            </h2>
            <p className="text-xl text-[#44403C]/70 leading-relaxed">
              My Drawer lives on the edge of your screen. It stays out of your way when you're focused, and appears instantly when you move your mouse to your chosen edge or corner.
            </p>
            <div className="flex items-center gap-3 pt-4">
              <div className="h-12 px-5 rounded-full bg-[#F2EFE9] border border-[#E7E5E4] flex items-center gap-2 text-sm text-[#44403C]/80">
                <MousePointer2 size={18} strokeWidth={1.5} />
                <span>Hover Edge</span>
              </div>
              <ArrowRight size={20} className="text-[#44403C]/30" strokeWidth={1.5} />
              <div className="h-12 px-5 rounded-full bg-[#44403C] text-[#FAF9F6] flex items-center gap-2 text-sm shadow-md">
                <PanelLeft size={18} strokeWidth={1.5} />
                <span>Drawer Opens</span>
              </div>
            </div>
          </div>

          {/* Animation Container */}
          <div className="flex-1 w-full max-w-[500px]">
            <div className="aspect-[4/3] bg-[#FAF9F6] rounded-[2rem] border border-[#E7E5E4] relative overflow-hidden shadow-lg ring-1 ring-[#000000]/5 w-full">
              {/* Mock Desktop Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#E7E5E4_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />

              {/* The Mock Sidebar */}
              <motion.div
                animate={{
                  x: ["-120%", "-120%", "24px", "24px", "-120%", "-120%"],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.15, 0.2, 0.55, 0.6, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-0 top-8 bottom-8 w-56 bg-white rounded-2xl border border-[#E7E5E4] shadow-xl z-20 flex flex-col p-4 gap-4"
              >
                <div className="w-10 h-10 bg-[#F2EFE9] rounded-xl shrink-0" />
                <div className="space-y-3">
                  <div className="h-2.5 w-full bg-[#F2EFE9] rounded-full" />
                  <div className="h-2.5 w-3/4 bg-[#F2EFE9] rounded-full" />
                </div>
                <div className="mt-auto h-10 w-full bg-[#F2EFE9] rounded-xl" />
              </motion.div>

              {/* Click Ripple */}
              <motion.div
                animate={{
                  opacity: [0, 0, 1, 0],
                  scale: [0.8, 0.8, 0.9, 0],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.54, 0.55, 0.8],
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute w-10 h-10 rounded-full border-2 border-[#44403C]/30 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: "60%", top: "40%" }}
              />

              {/* The Cursor */}
              <motion.div
                animate={{
                  left: ["80%", "0%", "0%", "60%", "60%", "80%"],
                  top: ["60%", "60%", "60%", "40%", "40%", "60%"],
                  scale: [1, 1, 1, 1, 0.85, 1],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.15, 0.45, 0.55, 0.58, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute z-30 origin-top-left"
                style={{ marginLeft: -6, marginTop: -4 }}
              >
                <MousePointer2
                  size={40}
                  className="fill-black text-white drop-shadow-xl"
                  strokeWidth={1}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};