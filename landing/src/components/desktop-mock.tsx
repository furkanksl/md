import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MockAppWindow } from "./mock-app-window";

const DesktopIcon = ({ name, type = "folder", delay = 0 }: { name: string, type?: "folder" | "file" | "image", delay?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + delay, duration: 0.4 }}
            className="flex flex-col items-center gap-1.5 group cursor-default w-10"
        >
            {type === "folder" && (
                <div className="w-8 h-6 relative">
                    {/* Back plate */}
                    <div className="absolute inset-0 bg-blue-400 rounded-[2px] shadow-sm" />
                    {/* Front plate (lighter) */}
                    <div className="absolute top-0.5 left-0 right-0 bottom-0 bg-gradient-to-b from-blue-300 to-blue-400 rounded-b-[2px] rounded-t-[1px] shadow-inner" />
                    {/* Tab */}
                    <div className="absolute top-[-2px] left-0 w-3.5 h-1.5 bg-blue-400 rounded-t-[2px]" />
                </div>
            )}
            {type === "file" && (
                <div className="w-6 h-8 bg-white rounded-[2px] shadow-sm border border-stone-200 relative flex items-center justify-center">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-stone-100 rounded-bl-[2px]" />
                    <div className="w-3 h-0.5 bg-stone-200 mb-0.5" />
                    <div className="w-3 h-0.5 bg-stone-200 mb-0.5" />
                    <div className="w-2 h-0.5 bg-stone-200" />
                </div>
            )}
            {type === "image" && (
                <div className="w-8 h-8 bg-white p-0.5 rounded-[2px] shadow-sm border border-stone-200 relative">
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-100 to-sky-100 rounded-[1px]" />
                </div>
            )}

            <span className="text-[7px] font-semibold text-stone-700 px-1 py-0.5 rounded-[2px] transition-colors shadow-none text-center">
                {name}
            </span>
        </motion.div>
    );
};

export const DesktopMock = () => {
    const [activeTab, setActiveTab] = useState("chat");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' });
            const month = now.toLocaleDateString('en-US', { month: 'short' });
            const day = now.getDate();
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setCurrentTime(`${dayOfWeek} ${month} ${day} ${hours}:${minutes}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[1000px] xl:max-w-[1200px] relative mx-auto perspective-3000 group"
        >
            {/* iMac Head Unit */}
            <div className="relative z-20 bg-white rounded-[1.5rem] p-3.5 shadow-[0_2.8px_2.2px_rgba(0,0,0,0.02),0_6.7px_5.3px_rgba(0,0,0,0.028),0_12.5px_10px_rgba(0,0,0,0.035),0_22.3px_17.9px_rgba(0,0,0,0.042),0_41.8px_33.4px_rgba(0,0,0,0.05),0_100px_80px_rgba(0,0,0,0.07)] border border-black/5">

                {/* The White Bezel & Camera */}
                <div className="absolute top-0 left-0 right-0 h-full w-full rounded-[1.2rem] pointer-events-none z-30 ring-1 ring-black/5">
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/20 rounded-full blur-[0.5px]" />
                    {/* Camera Lens */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-[#1a1a1a] rounded-full" />
                </div>

                {/* Main Display Area (16:9 Aspect Ratio) */}
                <div className="relative aspect-video bg-black rounded-[0.8rem] overflow-hidden shadow-inner ring-1 ring-black/5">

                    {/* Screen Content */}
                    <div className="absolute inset-0 bg-[#FAF9F6] group/screen">
                        {/* Wallpaper */}
                        <div
                            className="absolute inset-0 bg-[#FAF9F6] cursor-default"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <img src="/assets/common/wallpaper.webp" className="w-full h-full object-cover opacity-90" alt="Wallpaper" />
                        </div>

                        {/* Menu Bar */}
                        <div className="absolute top-0 left-0 right-0 h-7 bg-white/40 backdrop-blur-xl border-b border-black/5 flex items-center justify-between pl-2 pr-4 z-10 pointer-events-none">
                            <div className="flex gap-1.5 items-center">
                                {/* Replaced Lucide Apple with Generated Asset */}
                                <img src="/assets/common/filled_black_apple_logo_icon_fla.webp" className=" h-7 object-fill opacity-90" alt="Apple Menu" />
                                <div className="flex flex-row gap-3">
                                    <span className="text-[11px] font-bold text-stone-900 tracking-tight">Finder</span>
                                    <span className="text-[11px] font-medium text-stone-600/90">File</span>
                                    <span className="text-[11px] font-medium text-stone-600/90">Edit</span>
                                    <span className="text-[11px] font-medium text-stone-600/90">View</span>
                                    <span className="text-[11px] font-medium text-stone-600/90">Go</span>
                                    <span className="text-[11px] font-medium text-stone-600/90">Window</span>
                                </div>
                            </div>
                            <div className="flex gap-3.5 items-center">
                                <div className="flex items-center gap-2.5 opacity-60">
                                    <div className="w-3 h-3 bg-stone-900/10 rounded-full" />
                                    <div className="w-3.5 h-3.5 bg-stone-900/10 rounded-sm" />
                                </div>
                                <span className="text-[11px] font-semibold text-stone-900 tabular-nums tracking-tight">{currentTime}</span>
                            </div>
                        </div>

                        {/* Glass Glare */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-50 pointer-events-none z-40" />

                        {/* Trigger Zone - Left Edge */}
                        <div
                            className="absolute top-8 bottom-0 left-0 w-20 z-20 hover:bg-black/[0.01] transition-colors cursor-pointer group/trigger flex items-center justify-center"
                            onMouseEnter={() => setIsSidebarOpen(true)}
                            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                        >
                            {/* <div className="w-1 h-20 bg-stone-400/20 rounded-full opacity-0 group-hover/trigger:opacity-100 transition-all duration-500" /> */}
                        </div>

                        {/* Sidebar Slide-in */}
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ x: "-100%", opacity: 0, y: "-50%" }}
                                    animate={{ x: 0, opacity: 1, y: "-50%" }}
                                    exit={{ x: "-100%", opacity: 0, y: "-50%" }}
                                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                    className="absolute top-1/2 left-2 z-30"
                                    style={{
                                        width: "min(340px, 100%)",
                                        height: "100%"
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MockAppWindow
                                        activeTab={activeTab}
                                        onTabChange={setActiveTab}
                                        className="w-full scale-[0.7] origin-left"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Desktop Icons (Decoration) */}
                        <div className="absolute top-12 right-4 flex flex-col gap-6 p-2 z-10 pointer-events-none">
                            <DesktopIcon name="Projects" type="folder" delay={0} />
                            <DesktopIcon name="Resources" type="folder" delay={0.1} />
                            <DesktopIcon name="Screenshot.png" type="image" delay={0.2} />
                            <DesktopIcon name="Notes.txt" type="file" delay={0.3} />
                        </div>

                        {/* Interaction Hint with Arrow Asset */}
                        <AnimatePresence>
                            {!isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: 1 }}
                                    className="absolute top-1/2 left-2 -translate-y-1/2 flex flex-col items-start gap-1 pointer-events-none z-10"
                                >
                                    <div className="w-14 h-14 flex items-center justify-center opacity-100 transform scale-x-[-1] drop-shadow-sm">
                                        <img src="/assets/common/hand_drawn_curved_arrow_pointing.png" className="w-full h-full object-contain" alt="Hover Arrow" />
                                    </div>
                                    <span className="ml-8 text-xs text-stone-600 tracking-wide font-light drop-shadow-sm text-right">Hover to open</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

                {/* iMac Chin Area with Logo (Height Increased) */}
                <div className="h-[72px] w-full flex items-center justify-center shrink-0">
                    <img src="/assets/common/soft_3d_apple_logo_icon_matte_cl.webp" className="w-10 h-10 mt-3 object-contain opacity-50 mix-blend-multiply" alt="Apple Logo" />
                </div>
            </div>

            {/* iMac Stand (Modern Geometric Style) */}
            <div className="relative z-10 mx-auto -mt-6 w-[140px] h-[90px] flex justify-center">
                {/* Neck */}
                <div className="w-[110px] h-full bg-[#D4D4D4] shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
                {/* Base */}
                <div className="absolute bottom-0 w-[160px] h-[6px] bg-[#CFCFCF] rounded-full shadow-lg" />
                <div className="absolute bottom-[-2px] w-[170px] h-[14px] bg-[#E5E5E5] rounded-[4px] shadow-xl transform perspective-[100px] rotateX(20deg)" />
            </div>
        </motion.div>
    );
}