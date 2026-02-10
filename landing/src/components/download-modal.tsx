import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useLatestRelease } from "@/hooks/use-latest-release";

interface DownloadModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export const DownloadModal = ({ isOpen, onClose }: DownloadModalProps) => {
   const { downloadUrl, downloadUrlAarch64, downloadUrlX86_64 } = useLatestRelease();

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm px-6"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={(e) => e.target === e.currentTarget && onClose()}
            >
               <motion.div
                  className="w-full max-w-md bg-[#FAF9F6] text-[#44403C] rounded-[2rem] shadow-2xl border border-white p-8 relative"
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
               >
                  <button
                     className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#E7E5E4] hover:bg-[#D6D3D1] transition-colors flex items-center justify-center text-[#44403C]"
                     onClick={onClose}
                     aria-label="Close"
                  >
                     <X size={16} strokeWidth={2} />
                  </button>

                  <h3 className="text-2xl font-bold mb-2">Download MyDrawer</h3>
                  <p className="text-[#44403C]/60 mb-8 text-sm">
                     Choose the version compatible with your Mac's processor.
                  </p>

                  <div className="space-y-4">
                     <a
                        href={downloadUrlAarch64 || downloadUrl}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7E5E4] hover:border-[#738F82] hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                     >
                        <div className="flex items-center gap-4 relative z-10">
                           <img src="/assets/common/soft_3d_apple_silicon_chip_icon_.png" className="w-[70px] h-[70px] object-contain drop-shadow-sm" alt="Apple Silicon" />
                           <div>
                              <div className="font-bold text-[#44403C]">Apple Silicon</div>
                              <div className="text-xs text-[#44403C]/50">M chips</div>
                           </div>
                        </div>
                        <ArrowRight size={20} className="text-[#738F82] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 relative z-10" />
                     </a>

                     <a
                        href={downloadUrlX86_64 || downloadUrl}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7E5E4] hover:border-[#44403C] hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                     >
                        <div className="flex items-center gap-4 relative z-10">
                           <img src="/assets/common/soft_3d_intel_processor_chip_ico.png" className="w-[70px] h-[70px] object-contain drop-shadow-sm" alt="Intel" />
                           <div>
                              <div className="font-bold text-[#44403C]">Intel</div>
                              <div className="text-xs text-[#44403C]/50">Older Mac models</div>
                           </div>
                        </div>
                        <ArrowRight size={20} className="text-[#44403C] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 relative z-10" />
                     </a>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};