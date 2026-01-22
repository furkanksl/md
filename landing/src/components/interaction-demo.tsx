import { ArrowRight, MousePointer2, PanelLeft } from "lucide-react";
import { motion } from "framer-motion";

export const InteractionDemo = () => {
  return (
    <div className="w-full border-y border-[#E7E5E4] bg-white relative overflow-hidden h-full flex items-center">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#E7E5E4] to-transparent"></div>
      <div className="max-w-[1000px] mx-auto px-6 w-full">
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 text-[#738F82] font-medium text-sm tracking-wide uppercase">
              <PanelLeft size={16} strokeWidth={1.5} />
              <span>Auto-Hide</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#44403C] leading-tight">
              Hidden until you <br /> need it.
            </h2>
            <p className="text-lg text-[#44403C]/70 leading-relaxed">
              My Drawer lives on the edge of your screen. It stays out of your way when you're focused, and appears instantly when you move your mouse to the left edge.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 px-4 rounded-full bg-[#F2EFE9] border border-[#E7E5E4] flex items-center gap-2 text-sm text-[#44403C]/80">
                <MousePointer2 size={16} strokeWidth={1.5} />
                <span>Hover Left Edge</span>
              </div>
              <ArrowRight size={16} className="text-[#44403C]/30" strokeWidth={1.5} />
              <div className="h-10 px-4 rounded-full bg-[#44403C] text-[#FAF9F6] flex items-center gap-2 text-sm shadow-md">
                <PanelLeft size={16} strokeWidth={1.5} />
                <span>Drawer Opens</span>
              </div>
            </div>
          </div>

          {/* Animation Container */}
          <div className="flex-1 w-full max-w-[400px]">
            <div className="aspect-[4/3] bg-[#FAF9F6] rounded-2xl border border-[#E7E5E4] relative overflow-hidden shadow-sm ring-1 ring-[#000000]/5">
              {/* Mock Desktop Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#E7E5E4_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

              {/* The Mock Sidebar */}
              <motion.div
                animate={{
                  x: ["-120%", "-120%", "20px", "20px", "-120%", "-120%"],
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.15, 0.2, 0.55, 0.6, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-0 top-6 bottom-6 w-48 bg-white rounded-2xl border border-[#E7E5E4] shadow-xl z-20 flex flex-col p-3 gap-3"
              >
                <div className="w-8 h-8 bg-[#F2EFE9] rounded-lg shrink-0" />
                <div className="space-y-2">
                  <div className="h-2 w-full bg-[#F2EFE9] rounded-full" />
                  <div className="h-2 w-3/4 bg-[#F2EFE9] rounded-full" />
                </div>
                <div className="mt-auto h-8 w-full bg-[#F2EFE9] rounded-lg" />
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
                className="absolute w-8 h-8 rounded-full border-2 border-[#44403C]/30 z-10 -translate-x-1/2 -translate-y-1/2"
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
                style={{ marginLeft: -6, marginTop: -4 }} // Added missing alignment style
              >
                <MousePointer2
                  size={32}
                  className="fill-black text-white drop-shadow-xl"
                  strokeWidth={1}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
