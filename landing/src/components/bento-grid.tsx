import { motion } from 'framer-motion';
import { Command, ListTodo, Lock } from 'lucide-react';

export const BentoGrid = () => {
   return (
      <section className="min-h-screen w-full flex flex-col justify-center py-20 px-6 bg-[#FAF9F6] relative z-10">
         <div className="max-w-7xl mx-auto w-full">
            {/* Fixed row height of 300px ensures alignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

               {/* Large Card 1: AI Chat (Row 1, 2 Cols) */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-[#E7E5E4] shadow-sm relative overflow-hidden flex flex-col justify-center items-start h-full"
               >
                  <div className="relative z-10 max-w-md">
                     <h3 className="text-xl sm:text-3xl font-bold mb-4 text-[#44403C]">Context-Aware AI</h3>
                     <p className="text-[#44403C]/60 sm:text-lg text-sm">
                        Chat with Claude, OpenAI, or local models directly from your sidebar. Drag and drop files to give them instant context.
                     </p>
                  </div>
                  {/* Visual Element: 3D Brain */}
                  <div className="absolute -right-8 sm:right-[-5%] top-8  sm:top-1/2 -translate-y-1/2 w-1/2 h-full opacity-90 pointer-events-none">
                     <img src="/assets/common/soft_3d_brain_with_subtle_circui.webp" className="w-full h-full sm:scale-75 scale-75 object-contain object-bottom drop-shadow-xl" alt="AI Brain" />
                  </div>
               </motion.div>

               {/* Tall Card 2: Clipboard (Rows 1-2, 1 Col) */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="md:row-span-2 bg-[#44403C] rounded-[2rem] p-8 pb-0 sm:pb-8 text-[#FAF9F6] relative overflow-hidden h-full"
               >
                  <div className="relative z-10 backdrop-blur-sm sm:backdrop-blur-none rounded-lg">
                     <div className="w-12 h-12 bg-[#FAF9F6]/10 rounded-2xl flex items-center justify-center mb-6 text-[#FAF9F6]">
                        <Command size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xl sm:text-3xl font-bold mb-4">Clipboard History</h3>
                     <p className="text-[#FAF9F6]/60 sm:text-lg text-sm mb-8">
                        Never lose a link or snippet again. Searchable, persistent history that supports images and rich text.
                     </p>
                  </div>
                  {/* Visual Element: Paper Stack */}
                  <div className="absolute -bottom-4 -right-4 w-64 h-64 opacity-40 pointer-events-none">
                     <img src="/assets/common/soft_3d_stack_of_papers_floating.webp" className="w-full h-full object-contain drop-shadow-2xl transform rotate-[-10deg] scale-90" alt="Paper Stack" />
                  </div>
               </motion.div>

               {/* Small Card 3: Focus Tasks (Row 2, 1 Col) */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-[2rem] p-8 border border-[#E7E5E4] shadow-sm flex flex-col justify-between relative overflow-hidden h-full"
               >
                  <div className="relative z-10">
                     <div className="w-12 h-12 bg-[#F2EFE9] rounded-2xl flex items-center justify-center mb-6 text-[#44403C]">
                        <ListTodo size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xl sm:text-3xl font-bold mb-2 text-[#44403C]">Focus Tasks</h3>
                     <p className="text-[#44403C]/60 sm:text-lg text-sm">
                        Minimalist checklists and scratchpads that auto-clear to keep you focused.
                     </p>
                  </div>
                  {/* Visual Element: Notebook */}
                  <div className="absolute -right-4 -bottom-10 w-40 h-40 opacity-80 pointer-events-none">
                     <img src="/assets/common/soft_3d_notebook_with_checklist_.webp" className="w-full h-full object-contain drop-shadow-lg scale-90" alt="Notebook" />
                  </div>
               </motion.div>

               {/* Small Card 4: Privacy (Row 2, 1 Col) */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-[2rem] p-8 border border-[#E7E5E4] shadow-sm relative overflow-hidden h-full"
               >
                  <div className="relative z-10">
                     <div className="w-12 h-12 bg-[#F2EFE9] rounded-2xl flex items-center justify-center mb-6 text-[#44403C]">
                        <Lock size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xl sm:text-3xl font-bold mb-2 text-[#44403C]">Privacy First</h3>
                     <p className="text-[#44403C]/60 sm:text-lg text-sm mb-2">
                        Your keys, your data. Local-first architecture.
                     </p>
                  </div>

                  {/* Visual Element: Shield */}
                  <div className="absolute -bottom-10 -right-4 w-40 h-40 opacity-80 pointer-events-none">
                     <img src="/assets/common/soft_3d_shield_with_lock_matte_c.webp" className="w-full h-full object-contain drop-shadow-lg scale-90" alt="Privacy Shield" />
                  </div>
               </motion.div>

               {/* Wide Card 5: Research Toolkit (Row 3, 3 Cols) */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="md:col-span-3 bg-[#F2EFE9] rounded-[2rem] p-8 sm:p-12 sm:px-12 border border-[#E7E5E4] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden h-full"
               >
                  <div className="relative max-w-lg z-20">
                     <h3 className="text-xl sm:text-3xl font-bold mb-6 text-[#44403C]">A Complete Research Toolkit</h3>
                     <p className="text-[#44403C]/70 sm:text-lg text-sm leading-relaxed mb-0 sm:mb-8">
                        Scrape web pages, summarize documents, and manage your tasks without leaving your current context. MyDrawer is the productivity OS you didn't know you needed.
                     </p>
                  </div>
                  {/* Visual Element: Magnifying Glass */}
                  <div className="z-10 w-80 h-20 sm:w-full sm:h-full aspect-square flex items-end justify-end ml-auto -mt-0 sm:mt-0 -mr-10 sm:mr-0">
                     <img src="/assets/common/soft_3d_magnifying_glass_leaning.webp" className=" sm:w-auto w-1/2 sm:h-full object-contain drop-shadow-2xl" alt="Research Tool" />
                  </div>
               </motion.div>
            </div>
         </div>
      </section>
   );
};