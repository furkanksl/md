import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { MobileHeroMockup } from './mobile-hero-mockup';
import { useLatestRelease } from '@/hooks/use-latest-release';

const fadeInUp = {
   initial: { opacity: 0, y: 30 },
   animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
};

const staggerContainer = {
   animate: {
      transition: {
         staggerChildren: 0.15
      }
   }
};

const cloudAnimationLeft = {
   initial: { opacity: 0, x: -50, y: 50 },
   animate: { opacity: 0.6, x: 0, y: 0, transition: { duration: 1.5, ease: "easeOut" } },
   float: {
      y: [0, 20, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
   }
};

const cloudAnimationRight = {
   initial: { opacity: 0, x: 50, y: 50 },
   animate: { opacity: 0.6, x: 0, y: 0, transition: { duration: 1.5, ease: "easeOut", delay: 0.2 } },
   float: {
      y: [0, -25, 0],
      transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }
   }
};

export const Hero = ({ onOpenDownload }: { onOpenDownload: () => void }) => {
   const { version } = useLatestRelease();

   return (
      <section className="min-h-screen w-full flex flex-col relative overflow-hidden bg-[#FAF9F6]">
         {/* Floating Clouds (Hero Background) */}
         <motion.div
            className="absolute top-20 left-[5%] w-48 h-48 pointer-events-none hidden md:block z-0"
            variants={cloudAnimationLeft}
            initial="initial"
            animate={["animate", "float"]}
         >
            <img src="/assets/common/soft_3d_cloud_shape_pastel_sage_.webp" className="w-full h-full object-contain drop-shadow-xl" alt="Cloud" />
         </motion.div>

         <motion.div
            className="absolute top-40 right-[5%] w-64 h-64 pointer-events-none hidden md:block z-0"
            variants={cloudAnimationRight}
            initial="initial"
            animate={["animate", "float"]}
         >
            <img src="/assets/common/soft_3d_cloud_shape_pastel_sage_.webp" className="w-full h-full object-contain drop-shadow-xl transform scale-x-[-1]" alt="Cloud" />
         </motion.div>


         {/* Hero Content */}
         <div className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-5xl mx-auto relative z-10 pb-20 pt-32">
            <motion.div
               variants={staggerContainer}
               initial="initial"
               animate="animate"
            >
               <motion.div variants={fadeInUp} className="flex justify-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7E5E4]/50 border border-[#E7E5E4] text-xs font-medium text-[#44403C]/60">
                     <span className="w-2 h-2 rounded-full bg-[#738F82]"></span>
                     {version} is live
                  </div>
               </motion.div>

               <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-[#44403C]">
                  The missing layer <br />
                  <span className="text-[#738F82]">of macOS.</span>
               </motion.h1>

               <motion.p variants={fadeInUp} className="text-lg md:text-xl text-[#44403C]/60 max-w-2xl mx-auto mb-12 leading-relaxed">
                  An intelligent sidebar that lives on the edge of your screen. Chat with AI, track your clipboard, and stay in flow—without the clutter.
               </motion.p>

               <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Thinner Outline Download Button */}
                  <button
                     onClick={onOpenDownload}
                     className="group h-12 px-8 rounded-full border border-[#44403C] text-[#44403C] font-bold text-lg flex items-center gap-2 hover:bg-[#44403C] hover:text-[#FAF9F6] transition-all duration-300 w-auto justify-center"
                  >
                     <span>Download for Mac</span>
                     <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </button>

                  {/* Matched Height GitHub Button */}
                  <a
                     href="https://github.com/furkanksl/md"
                     target="_blank"
                     rel="noreferrer"
                     className="group h-12 px-6 flex items-center justify-center gap-2 text-[#44403C] font-medium text-lg rounded-full hover:bg-[#44403C]/5 transition-colors w-auto"
                  >
                     <Star size={18} className="text-[#738F82] group-hover:fill-[#738F82] transition-colors" />
                     <span>Star on GitHub</span>
                  </a>
               </motion.div>

               {/* Mobile Hero Mockup - Visible only on Mobile */}
               <div className="block md:hidden mt-12 w-full">
                  <MobileHeroMockup />
               </div>
            </motion.div>
         </div>
      </section>
   );
};
