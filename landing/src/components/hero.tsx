import { Button } from "@/components/ui/button";
import {
   ArrowRight,
   BrainCircuit,
   ChevronDown,
   Globe,
   History,
   Layers,
   Maximize,
   MessageCircle,
   Moon,
   Settings,
   Sparkles,
   SquarePen,
   Command,
   Search,
   Plus,
   Play,
   AppWindow,
   Copy,
   Check,
   CheckCircle,
   ListTodo,
   Cpu,
   Bot,
   Layout,
   Columns2,
   Grid2X2,
   EyeOff,
   Shield,
   X
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLatestRelease } from "@/hooks/use-latest-release";

export const Hero = () => {
   const [activeTab, setActiveTab] = useState("chat");
   const [isDownloadOpen, setIsDownloadOpen] = useState(false);
   const { downloadUrl, downloadUrlAarch64, downloadUrlX86_64 } = useLatestRelease();

   useEffect(() => {
      // Cycle through: Chat -> Tasks -> Clipboard -> Shortcuts -> Layouts -> Web
      const tabs = ["chat", "tasks", "clipboard", "shortcuts", "layouts", "web"];
      const interval = setInterval(() => {
         setActiveTab(prev => {
            const currentIndex = tabs.indexOf(prev);
            const nextIndex = (currentIndex + 1) % tabs.length;
            return tabs[nextIndex];
         });
      }, 4000);
      return () => clearInterval(interval);
   }, []);

   const tabContentVariants = {
      initial: { opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" },
      animate: {
         opacity: 1,
         y: 0,
         scale: 1,
         filter: "blur(0px)",
         transition: { duration: 0.4, ease: "easeOut" }
      },
      exit: {
         opacity: 0,
         scale: 0.98,
         filter: "blur(4px)",
         transition: { duration: 0.3, ease: "easeIn" }
      }
   };

   return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16 w-full">

         {/* Hero Copy */}
         <div className="flex-1 space-y-8 text-center lg:text-left pt-8 lg:pt-20 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-xl mx-auto lg:mx-0">

            <motion.h1
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#44403C] leading-[1.1]"
            >
               The missing layer <br />
               <span>of</span>
               <span className="text-[#738F82]"> macOS.</span>
            </motion.h1>

            <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="text-lg md:text-xl text-[#44403C]/70 leading-relaxed font-light"
            >
               An intelligent sidebar that blends into your desktop. Chat with AI, track your clipboard, and organize windows—all without breaking your flow.
            </motion.p>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >

               <Button
                  size="lg"
                  className="h-12 px-8 text-base rounded-full bg-[#44403C] hover:bg-[#383531] text-[#FAF9F6] shadow-xl shadow-[#44403C]/10 transition-transform group"
                  onClick={() => setIsDownloadOpen(true)}
               >
                  Download for macOS
                  <ArrowRight className="ml-2 w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
               </Button>

               <div className="flex items-center gap-4 text-xs font-medium text-[#44403C]/40 px-2">
                  <span className="flex items-center gap-1.5">
                     <CheckCircle size={12} strokeWidth={1.5} />
                     Apple Silicon
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#44403C]/20" />
                  <span className="flex items-center gap-1.5">
                     <CheckCircle size={12} strokeWidth={1.5} />
                     Intel
                  </span>
               </div>
            </motion.div>

            <AnimatePresence>
               {isDownloadOpen && (
                  <motion.div
                     className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md px-6"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsDownloadOpen(false)}
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
                           onClick={() => setIsDownloadOpen(false)}
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
               )}
            </AnimatePresence>
         </div>

         {/* APP MOCKUP */}
         <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="relative w-full max-w-[340px] h-[640px] shrink-0"
         >

            {/* Abstract Desktop Wallpaper Context */}
            <div className="absolute top-10 -right-20 -left-20 bottom-10 bg-gradient-to-tr from-[#E6D5C3] to-[#738F82] rounded-[3rem] opacity-20 blur-3xl -z-10 transform rotate-3"></div>

            {/* The Drawer Window */}
            <div className="relative h-full bg-[#FAF9F6]/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/50 ring-1 ring-[#000000]/5 overflow-hidden flex flex-col">

               {/* Drag Region & Header (Updated with Split Nav) */}
               <div className="h-12 shrink-0 flex items-center justify-between px-5 z-20 bg-gradient-to-b from-white/80 to-transparent">
                  <span className="font-semibold text-sm text-[#44403C]/90 tracking-tight cursor-default select-none">md</span>

                  <div className="flex items-center gap-1.5">
                     {/* Settings in Header */}
                     <div className="w-7 h-7 flex items-center justify-center text-[#44403C]/40 hover:text-[#44403C]/80 transition-colors cursor-pointer border border-transparent hover:border-[#E7E5E4] rounded-full">
                        <Settings size={14} strokeWidth={1.5} />
                     </div>

                     <div className="w-px h-3 bg-[#E7E5E4]" />

                     <button className="w-7 h-7 rounded-full bg-white/50 border border-[#E7E5E4] flex items-center justify-center text-[#44403C]/60 hover:bg-white transition-colors">
                        <Moon size={12} strokeWidth={1.5} />
                     </button>
                     <div className="flex gap-1.5 pl-1 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] border border-[#E0443E]/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28C93F] border border-[#1AAB29]/50"></div>
                     </div>
                  </div>
               </div>

               {/* Main Content Area */}
               <div className="flex-1 relative overflow-hidden flex flex-col">
                  <AnimatePresence mode="wait">

                     {/* SCENE: CHAT */}
                     {activeTab === 'chat' && (
                        <motion.div
                           key="chat"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col"
                        >
                           {/* Top Bar */}
                           <div className="h-10 flex items-center justify-between px-3 shrink-0">
                              <div className="flex items-center gap-1">
                                 <button className="p-1.5 text-[#44403C]/40 hover:bg-[#F2EFE9] rounded-full transition-colors"><History size={14} strokeWidth={1.5} /></button>
                              </div>
                              <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E7E5E4] rounded-full text-[10px] font-medium text-[#44403C]/80 shadow-sm hover:border-[#D4C5BE] transition-colors">
                                 <Sparkles size={10} className="text-[#738F82]" strokeWidth={1.5} />
                                 <span>Claude 3.5 Sonnet</span>
                                 <ChevronDown size={10} className="opacity-40" strokeWidth={1.5} />
                              </button>
                              <button className="p-1.5 text-[#44403C]/40 hover:bg-[#F2EFE9] rounded-full transition-colors"><SquarePen size={14} strokeWidth={1.5} /></button>
                           </div>

                           {/* Chat Area */}
                           <div className="flex-1 px-3 py-2 space-y-4 overflow-hidden mask-image-b-fade">
                              {/* User Msg */}
                              <div className="flex justify-end">
                                 <div className="bg-[#44403C] text-[#FAF9F6] px-3 py-2 rounded-2xl rounded-tr-sm text-xs max-w-[85%] shadow-sm leading-relaxed">
                                    Can you parse this JSON and extract the user IDs?
                                 </div>
                              </div>

                              {/* AI Msg */}
                              <div className="flex gap-2.5 items-start">
                                 <div className="w-6 h-6 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <BrainCircuit size={12} className="text-[#738F82]" strokeWidth={1.5} />
                                 </div>
                                 <div className="space-y-1.5 max-w-[88%]">
                                    <div className="bg-white border border-[#E7E5E4] px-3 py-2.5 rounded-2xl rounded-tl-sm text-xs text-[#44403C] shadow-sm">
                                       <p className="leading-relaxed">Sure! Here is the extracted list of IDs from your data:</p>
                                       <div className="mt-2 bg-[#F2EFE9] p-2 rounded-md font-mono text-[10px] text-[#44403C]/80 border border-[#E7E5E4] select-all cursor-text">
                                          [104, 299, 401, 882]
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Input Area */}
                           <div className="p-3 pb-20">
                              <div className="bg-white border border-[#E7E5E4] rounded-[1.25rem] p-2 shadow-lg shadow-[#44403C]/5 flex items-center gap-2 ring-1 ring-transparent focus-within:ring-[#738F82]/20 transition-all">
                                 <button className="p-1.5 text-[#44403C]/40 hover:text-[#44403C] transition-colors"><SquarePen size={14} strokeWidth={1.5} /></button>
                                 <input type="text" placeholder="Ask anything..." className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-[#44403C]/30 h-6" />
                                 <button className="p-1.5 bg-[#44403C] text-[#FAF9F6] rounded-full hover:bg-[#44403C]/90 transition-colors"><ArrowRight size={12} strokeWidth={1.5} /></button>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* SCENE: TASKS (NEW) */}
                     {activeTab === 'tasks' && (
                        <motion.div
                           key="tasks"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 flex justify-between items-center mb-2">
                              <div className="flex gap-4">
                                 <h2 className="text-lg font-medium text-[#44403C] tracking-tight">Tasks</h2>
                              </div>
                              <div className="flex bg-[#E7E5E4]/50 p-0.5 rounded-lg">
                                 <div className="px-2 py-0.5 bg-white shadow-sm rounded-md text-[10px] font-medium text-[#44403C]">Lists</div>
                                 <div className="px-2 py-0.5 text-[10px] font-medium text-[#44403C]/50">Notes</div>
                              </div>
                           </div>

                           <div className="px-3 pb-20 space-y-2">
                              {/* Add Input */}
                              <div className="bg-white border border-[#E7E5E4] rounded-xl p-2 flex items-center gap-2 mb-3">
                                 <Plus size={14} className="text-[#44403C]/40 ml-1" />
                                 <span className="text-xs text-[#44403C]/30">Add a new task...</span>
                              </div>

                              {/* Task Item */}
                              <div className="bg-white border border-[#E7E5E4] p-3 rounded-xl shadow-sm flex items-center gap-3 hover:border-[#D4C5BE] transition-colors group">
                                 <div className="w-4 h-4 rounded-full border border-[#44403C]/20 group-hover:border-[#44403C]/40 transition-colors" />
                                 <span className="text-xs text-[#44403C]/80 font-medium">Update landing page design</span>
                              </div>

                              {/* Task Item */}
                              <div className="bg-white border border-[#E7E5E4] p-3 rounded-xl shadow-sm flex items-center gap-3 hover:border-[#D4C5BE] transition-colors group">
                                 <div className="w-4 h-4 rounded-full border border-[#44403C]/20 group-hover:border-[#44403C]/40 transition-colors" />
                                 <span className="text-xs text-[#44403C]/80 font-medium">Fix clipboard image support</span>
                              </div>

                              {/* Task Item (Checked) */}
                              <div className="bg-[#F2EFE9] border border-[#E7E5E4] p-3 rounded-xl flex items-center gap-3 opacity-60">
                                 <div className="w-4 h-4 rounded-full bg-[#738F82] flex items-center justify-center">
                                    <Check size={10} className="text-white" strokeWidth={2} />
                                 </div>
                                 <span className="text-xs text-[#44403C]/60 line-through">Release v0.4.0</span>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* SCENE: CLIPBOARD */}
                     {activeTab === 'clipboard' && (
                        <motion.div
                           key="clipboard"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 border-b border-[#E7E5E4]/50 flex justify-between items-center">
                              <div>
                                 <h2 className="text-lg font-bold text-[#44403C] tracking-tight">Clipboard</h2>
                                 <div className="flex items-center gap-1 text-[10px] text-[#44403C]/40 mt-0.5">
                                    <Command size={10} strokeWidth={1.5} />
                                    <span>History & Pinned</span>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#44403C]/30" size={12} strokeWidth={1.5} />
                                    <input className="bg-white border border-[#E7E5E4] rounded-lg h-7 pl-6 pr-2 text-[10px] w-24 focus:outline-none focus:border-[#D4C5BE]" placeholder="Search..." />
                                 </div>
                              </div>
                           </div>
                           <div className="flex-1 px-3 py-3 space-y-2.5 overflow-hidden">
                              <div className="bg-white border border-[#E7E5E4] p-3 rounded-2xl shadow-sm flex flex-col gap-2 hover:border-[#D4C5BE] transition-colors cursor-pointer group hover:-translate-y-0.5">
                                 <div className="flex justify-end items-start">
                                    <span className="text-[9px] text-[#44403C]/30">10:42 AM</span>
                                 </div>
                                 <p className="text-[11px] font-mono text-[#44403C]/80 line-clamp-2">npm install @tauri-apps/api @tauri-apps/plugin-fs</p>
                              </div>

                              <div className="bg-white border border-[#E7E5E4] p-3 rounded-2xl shadow-sm flex flex-col gap-2 hover:border-[#D4C5BE] transition-colors cursor-pointer group hover:-translate-y-0.5 opacity-80">
                                 <div className="flex justify-end items-start">
                                    <span className="text-[9px] text-[#44403C]/30">10:38 AM</span>
                                 </div>
                                 <p className="text-[11px] text-[#44403C]/80 line-clamp-2">The concept of "zen" in design emphasizes simplicity, intuition, and the removal of clutter...</p>
                              </div>

                              <div className="bg-white border border-[#E7E5E4] p-3 rounded-2xl shadow-sm flex flex-col gap-2 hover:border-[#D4C5BE] transition-colors cursor-pointer group hover:-translate-y-0.5 opacity-60">
                                 <div className="flex justify-end items-start">
                                    <span className="text-[9px] text-[#44403C]/30">10:30 AM</span>
                                 </div>
                                 <p className="text-[11px] font-mono text-[#44403C]/80 line-clamp-2">const [activeTab, setActiveTab] = useState("chat");</p>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* SCENE: SHORTCUTS (APPS) */}
                     {activeTab === 'shortcuts' && (
                        <motion.div
                           key="shortcuts"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 flex justify-between items-center mb-2">
                              <h2 className="text-lg font-light text-[#44403C]">My Apps</h2>
                              <button className="flex items-center gap-1 bg-[#44403C] text-white px-2 py-1 rounded-full text-[10px] font-medium shadow-md shadow-[#44403C]/10">
                                 <Plus size={10} strokeWidth={1.5} />
                                 <span>Add</span>
                              </button>
                           </div>
                           <div className="px-3 pb-20 overflow-y-auto space-y-2">
                              {[
                                 { name: 'Visual Studio Code', icon: <AppWindow size={16} strokeWidth={1.5} /> },
                                 { name: 'Spotify', icon: <AppWindow size={16} strokeWidth={1.5} /> },
                                 { name: 'Notion', icon: <AppWindow size={16} strokeWidth={1.5} /> },
                                 { name: 'Figma', icon: <AppWindow size={16} strokeWidth={1.5} /> },
                                 { name: 'Terminal', icon: <AppWindow size={16} strokeWidth={1.5} /> }
                              ].map((app, i) => (
                                 <div key={i} className="bg-white p-2.5 rounded-2xl border border-[#E7E5E4] shadow-sm flex items-center justify-between group hover:scale-[1.01] transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 rounded-xl bg-[#F2EFE9] flex items-center justify-center text-[#44403C]/40">
                                          {app.icon}
                                       </div>
                                       <span className="font-medium text-xs text-[#44403C]">{app.name}</span>
                                    </div>
                                    <div className="p-1.5 bg-[#F2EFE9] rounded-lg text-[#44403C]/40 group-hover:text-[#44403C] opacity-0 group-hover:opacity-100 transition-all">
                                       <Play size={10} fill="currentColor" strokeWidth={1.5} />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                     {/* SCENE: LAYOUTS (FLOW) */}
                     {activeTab === 'layouts' && (
                        <motion.div
                           key="layouts"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 flex justify-between items-center mb-2">
                              <h2 className="text-lg font-light text-[#44403C]">Window Flow</h2>
                              <button className="flex items-center gap-1 bg-[#44403C] text-white px-2 py-1 rounded-full text-[10px] font-medium shadow-md shadow-[#44403C]/10">
                                 <Plus size={10} strokeWidth={1.5} />
                                 <span>Capture</span>
                              </button>
                           </div>

                           <div className="px-3 pb-20 space-y-4 overflow-hidden">
                              <div>
                                 <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-2">Presets</h3>
                                 <div className="grid grid-cols-2 gap-2">
                                    <button className="h-12 bg-white rounded-xl border border-[#E7E5E4] hover:shadow-sm hover:bg-[#F2EFE9] transition-all flex items-center px-2 gap-2 text-[#44403C]/80">
                                       <div className="w-7 h-7 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#44403C]/40">
                                          <Columns2 size={14} strokeWidth={1.5} />
                                       </div>
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-bold uppercase">Split</span>
                                          <span className="text-[8px] text-[#44403C]/40">Vertical</span>
                                       </div>
                                    </button>
                                    <button className="h-12 bg-white rounded-xl border border-[#E7E5E4] hover:shadow-sm hover:bg-[#F2EFE9] transition-all flex items-center px-2 gap-2 text-[#44403C]/80">
                                       <div className="w-7 h-7 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#44403C]/40">
                                          <Grid2X2 size={14} strokeWidth={1.5} />
                                       </div>
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-bold uppercase">Grid</span>
                                          <span className="text-[8px] text-[#44403C]/40">2x2</span>
                                       </div>
                                    </button>
                                 </div>
                              </div>

                              <div>
                                 <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-2">Snapshots</h3>
                                 <div className="bg-white p-3 rounded-2xl border border-[#E7E5E4] shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3 mb-2">
                                       <div className="w-8 h-8 bg-[#F2EFE9] rounded-lg flex items-center justify-center text-[#44403C]/40">
                                          <Layout size={14} strokeWidth={1.5} />
                                       </div>
                                       <div>
                                          <h3 className="font-medium text-xs text-[#44403C]">Dev Workspace</h3>
                                          <p className="text-[9px] text-[#44403C]/40">3 windows • 10:00 AM</p>
                                       </div>
                                    </div>
                                    <button className="w-full py-1.5 bg-[#F2EFE9] text-[#44403C]/60 rounded-lg hover:bg-[#44403C] hover:text-white transition-all text-[10px] font-medium flex items-center justify-center gap-1.5">
                                       <span>Restore</span>
                                       <ArrowRight size={10} strokeWidth={1.5} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* SCENE: WEB RESEARCH */}
                     {activeTab === 'web' && (
                        <motion.div
                           key="web"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 flex justify-between items-center mb-2">
                              <h2 className="text-lg font-light text-[#44403C]">Research</h2>
                              <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#E7E5E4] rounded-lg text-[10px] font-medium text-[#44403C]/60">
                                 <Cpu size={10} strokeWidth={1.5} />
                                 <span>Mistral</span>
                                 <ChevronDown size={10} className="opacity-50" strokeWidth={1.5} />
                              </button>
                           </div>

                           <div className="px-3 pb-20 space-y-3">
                              <div className="bg-white p-2 rounded-[1.25rem] shadow-sm border border-[#E7E5E4]">
                                 <div className="flex items-center px-2 py-1 border-b border-[#E7E5E4]/50 mb-1">
                                    <Globe size={12} className="text-[#44403C]/40 mr-2" strokeWidth={1.5} />
                                    <div className="text-[10px] text-[#44403C]/40">https://example.com...</div>
                                 </div>
                                 <div className="flex items-center px-2 py-1">
                                    <Bot size={12} className="text-[#44403C]/40 mr-2" strokeWidth={1.5} />
                                    <div className="text-[10px] text-[#44403C]/60 flex-1">Summarize this page...</div>
                                    <div className="w-6 h-6 bg-[#44403C] rounded-full flex items-center justify-center text-white">
                                       <ArrowRight size={10} strokeWidth={1.5} />
                                    </div>
                                 </div>
                              </div>

                              <div className="p-3 bg-white rounded-2xl border border-[#E7E5E4] shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/40">Analysis Result</span>
                                    <span className="text-[9px] text-[#44403C]/30">Just now</span>
                                 </div>
                                 <div className="space-y-2">
                                    <div className="h-2 w-3/4 bg-[#F2EFE9] rounded-full animate-pulse" />
                                    <div className="h-2 w-full bg-[#F2EFE9] rounded-full animate-pulse delay-75" />
                                    <div className="h-2 w-5/6 bg-[#F2EFE9] rounded-full animate-pulse delay-150" />
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* SCENE: SETTINGS */}
                     {activeTab === 'settings' && (
                        <motion.div
                           key="settings"
                           variants={tabContentVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute inset-0 flex flex-col bg-[#FAF9F6]"
                        >
                           <div className="px-5 py-3 border-b border-[#E7E5E4]/50">
                              <h2 className="text-lg font-light text-[#44403C]">Settings</h2>
                           </div>

                           <div className="px-3 pb-20 space-y-4 pt-3 overflow-y-auto mask-image-b-fade">
                              {/* Behavior */}
                              <div>
                                 <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-2">Behavior</h3>
                                 <div className="bg-white p-3 rounded-2xl border border-[#E7E5E4] shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#44403C]/40">
                                          <EyeOff size={14} strokeWidth={1.5} />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-medium text-[#44403C]">Auto-Hide</span>
                                          <span className="text-[9px] text-[#44403C]/40">Hide on blur</span>
                                       </div>
                                    </div>
                                    <div className="w-9 h-5 bg-[#44403C] rounded-full relative p-0.5">
                                       <div className="w-4 h-4 bg-white rounded-full absolute right-0.5" />
                                    </div>
                                 </div>
                              </div>

                              {/* Permissions */}
                              <div>
                                 <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-2">Permissions</h3>
                                 <div className="bg-white p-3 rounded-2xl border border-[#E7E5E4] shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                          <Shield size={14} strokeWidth={1.5} />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-medium text-[#44403C]">Accessibility</span>
                                          <span className="text-[9px] text-[#44403C]/40">Granted</span>
                                       </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                       <Check size={12} strokeWidth={1.5} />
                                    </div>
                                 </div>
                              </div>

                              {/* Intelligence */}
                              <div>
                                 <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-2">Intelligence</h3>
                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button className="h-9 bg-[#44403C] text-white rounded-xl text-[10px] font-medium shadow-md">OpenAI</button>
                                    <button className="h-9 bg-white text-[#44403C]/60 border border-[#E7E5E4] rounded-xl text-[10px] font-medium">Anthropic</button>
                                 </div>
                                 <div className="bg-white p-3 rounded-2xl border border-[#E7E5E4] shadow-sm">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#44403C]/30 ml-1 mb-1 block">API Key</label>
                                    <div className="relative">
                                       <input type="password" value="sk-........................" disabled className="w-full bg-[#F2EFE9] h-8 rounded-lg px-3 text-[10px] font-mono text-[#44403C]/60" />
                                       <CheckCircle size={12} className="text-green-500 absolute right-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Floating Nav Pill (The Signature) */}
               <div className="absolute bottom-5 left-0 right-0 flex justify-center z-50">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E7E5E4]/80 backdrop-blur-sm">
                     {[
                        { id: 'chat', icon: MessageCircle },
                        { id: 'tasks', icon: ListTodo },
                        { id: 'clipboard', icon: Copy },
                        { id: 'shortcuts', icon: Layers },
                        { id: 'layouts', icon: Maximize },
                        { id: 'web', icon: Globe },
                     ].map((item) => (
                        <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id)}
                           className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${activeTab === item.id
                              ? 'text-[#44403C]'
                              : 'text-[#44403C]/40 hover:text-[#44403C]/80 hover:bg-[#F2EFE9]'
                              }`}
                        >
                           {activeTab === item.id && (
                              <motion.div
                                 layoutId="active-pill"
                                 className="absolute inset-0 bg-[#F2EFE9] rounded-full -z-10"
                                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                           )}
                           <item.icon size={16} strokeWidth={activeTab === item.id ? 2 : 1.5} />
                        </button>
                     ))}
                  </div>
               </div>

            </div>
         </motion.div>
      </div>
   );
};
