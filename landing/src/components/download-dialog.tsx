import { motion } from "framer-motion";
import { X, Cpu, AppWindow, ArrowRight } from "lucide-react";
import { useLatestRelease } from "@/hooks/use-latest-release";

interface DownloadDialogProps {
  onClose: () => void;
  source?: string;
}

export const DownloadDialog = ({ onClose, source = "Download Dialog" }: DownloadDialogProps) => {
  const { downloadUrl, downloadUrlAarch64, downloadUrlX86_64 } = useLatestRelease();

  return (
      <motion.div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md px-6"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={onClose}
      >
         <motion.div
            className="w-full max-w-md bg-[#FAF9F6] text-[#44403C] rounded-3xl shadow-2xl border border-white/70 p-6 relative"
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
         >
            <button
               className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[#E7E5E4] bg-white/70 hover:bg-white transition-colors flex items-center justify-center text-[#44403C]/60 hover:text-[#44403C]"
               onClick={onClose}
               aria-label="Close download options"
            >
               <X size={14} strokeWidth={1.5} />
            </button>

            <div className="space-y-2 pr-8">
               <h3 className="text-xl font-semibold">Choose your Mac</h3>
               <p className="text-sm text-[#44403C]/60">
                  Select the build that matches your processor.
               </p>
            </div>

            <div className="mt-6 grid gap-3">
               <a
                  href={downloadUrlAarch64 || downloadUrl}
                  data-umami-event="Download"
                  data-umami-event-source={source}
                  data-umami-event-arch="arm64"
                  className="group flex items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm font-medium hover:border-[#C7BFB4] hover:bg-[#F7F4EF] transition-colors"
               >
                  <span className="flex items-center gap-3">
                     <span className="w-10 h-10 rounded-xl bg-[#738F82]/15 text-[#738F82] flex items-center justify-center">
                        <Cpu size={18} strokeWidth={1.5} />
                     </span>
                     Apple Silicon
                  </span>
                  <ArrowRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
               </a>

               <a
                  href={downloadUrlX86_64 || downloadUrl}
                  data-umami-event="Download"
                  data-umami-event-source={source}
                  data-umami-event-arch="x64"
                  className="group flex items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm font-medium hover:border-[#C7BFB4] hover:bg-[#F7F4EF] transition-colors"
               >
                  <span className="flex items-center gap-3">
                     <span className="w-10 h-10 rounded-xl bg-[#44403C]/10 text-[#44403C] flex items-center justify-center">
                        <AppWindow size={18} strokeWidth={1.5} />
                     </span>
                     Intel
                  </span>
                  <ArrowRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
               </a>
            </div>
         </motion.div>
      </motion.div>
  );
};
