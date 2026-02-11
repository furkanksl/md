import {
    MessageCircle,
    Archive,
    Layers,
    Maximize,
    Globe,
    Settings,
    Sun,
    Moon,
    ListTodo,
    History,
    Sparkles,
    ChevronDown,
    SquarePen,
    Paperclip,
    SendHorizontal,
    Plus,
    Circle,
    CheckCircle2,
    Trash2,
    MoreVertical,
    Search,
    Copy,
    Image as ImageIcon,
    Bot,
    ChevronLeft,
    LayoutGrid,
    List,
    Columns2,
    Rows2,
    Columns3,
    Grid2X2,
    LayoutPanelLeft,
    Layers as LayersIcon,
    Layout,
    ArrowRight,
    Monitor,
    Smartphone,
    X,
    Cpu,
    Paintbrush,
    Check,
    CheckCircle,
    Microscope,
    ArrowLeft,
    RotateCcw,
    Type,
    ExternalLink,
    FileText,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

// --- Types ---
interface MockAppWindowProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    className?: string;
}

// --- Main Container ---
export const MockAppWindow = ({
    activeTab = "chat",
    onTabChange,
    className
}: MockAppWindowProps) => {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const bottomNavItems = [
        { id: "chat", label: "Journal", icon: MessageCircle },
        { id: "tasks", label: "Tasks", icon: ListTodo },
        { id: "clipboard", label: "Collect", icon: Archive },
        { id: "shortcuts", label: "Apps", icon: Layers },
        { id: "layouts", label: "Flow", icon: Maximize },
        { id: "web", label: "Web", icon: Globe },
    ] as const;

    const handleTabChange = (id: string) => {
        if (onTabChange) {
            onTabChange(id);
        }
    };

    const handleSettingsClick = () => {
        if (onTabChange) onTabChange('settings');
    };

    return (
        <div className={clsx("flex flex-col font-sans text-left selection:bg-stone-200 selection:text-stone-900 transition-colors duration-300 h-full w-full", className)}>
            <div className={clsx(
                "flex flex-col h-full w-full bg-white dark:bg-stone-950 overflow-hidden backdrop-blur-sm rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-2xl relative",
                theme === "dark" && "dark"
            )}>
                {/* Drag Region */}
                <div className="fixed top-0 left-0 w-full h-8 z-40" />

                {/* Main Card */}
                <div className="flex-1 flex flex-col rounded-[3rem] overflow-hidden relative border-none h-full bg-white dark:bg-stone-950">
                    {/* Minimal Header */}
                    <header className="h-12 shrink-0 flex items-center justify-between pr-2 pl-6 z-50">
                        <div className="relative">
                            <h1 className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100 cursor-default font-sans">
                                md
                            </h1>
                        </div>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={handleSettingsClick}
                                className={clsx(
                                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                                    activeTab === 'settings'
                                        ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
                                )}
                            >
                                <Settings size={16} strokeWidth={1.5} />
                            </button>

                            <div className="w-px h-4 bg-stone-200 dark:bg-stone-800" />

                            <button
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 p-0"
                            >
                                <motion.div
                                    key={theme}
                                    initial={{ rotate: -10, opacity: 0, scale: 0.95 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={{ rotate: 10, opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.22 }}
                                    className="flex items-center justify-center w-5 h-5 text-stone-500 dark:text-stone-400"
                                >
                                    {theme === "light" ? (
                                        <Moon size={16} strokeWidth={1.5} />
                                    ) : (
                                        <Sun size={16} strokeWidth={1.5} />
                                    )}
                                </motion.div>
                            </button>
                        </div>
                    </header>

                    {/* Dynamic Content */}
                    <main className="flex-1 overflow-hidden relative px-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, filter: "blur(10px)" }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="h-full w-full"
                            >
                                {activeTab === "chat" && <MockChatView />}
                                {activeTab === "tasks" && <MockTodoView />}
                                {activeTab === "clipboard" && <MockClipboardView />}
                                {activeTab === "shortcuts" && <MockShortcutsView />}
                                {activeTab === "layouts" && <MockLayoutsView />}
                                {activeTab === "web" && <MockWebView />}
                                {activeTab === "settings" && <MockSettingsView />}
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    {/* Floating Nav Pill */}
                    <div className="h-20 flex items-center justify-center shrink-0">
                        <nav className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 rounded-full shadow-lg border border-stone-200 dark:border-stone-800">
                            {bottomNavItems.map((item) => {
                                const isActive = activeTab === item.id;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabChange(item.id)}
                                        className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden group",
                                            isActive
                                                ? "text-white dark:text-stone-950"
                                                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                                        )}
                                        title={item.label}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-bg"
                                                className="absolute inset-0 bg-stone-900 dark:bg-stone-100 rounded-full"
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0.2,
                                                    duration: 0.2,
                                                }}
                                            />
                                        )}
                                        <Icon
                                            size={18}
                                            strokeWidth={isActive ? 2 : 1.5}
                                            className="relative z-10"
                                        />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Mock Views ---

const MockChatView = () => {
    return (
        <div className="flex flex-col h-full relative">
            <div className="h-12 grid grid-cols-3 items-center px-4 shrink-0 relative z-10">
                <div className="flex items-center gap-3 justify-start overflow-hidden">
                    <button className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 rounded-full transition-all flex-shrink-0">
                        <History size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="flex justify-center">
                    <button className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 outline-none max-w-xl">
                        <Sparkles size={12} className="text-stone-400 flex-shrink-0" />
                        <span className="truncate">Claude 3.5 Sonnet</span>
                        <ChevronDown size={10} className="opacity-50 flex-shrink-0" />
                    </button>
                </div>
                <div className="flex justify-end">
                    <button className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 rounded-full transition-all">
                        <SquarePen size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>
            <div className="flex-1 min-h-0 w-full relative overflow-y-auto px-4 py-2 space-y-6 scrollbar-none">
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%] leading-relaxed shadow-sm">
                        Summarize the key points from this article.
                    </div>
                </div>
                <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                            <Bot size={14} className="text-stone-500" />
                        </div>
                        <span className="text-xs text-stone-500 font-medium">Assistant</span>
                    </div>
                    <div className="text-stone-900 dark:text-stone-100 text-sm leading-relaxed space-y-3 pl-1">
                        <p>Here's a summary of the key points:</p>
                        <ul className="space-y-2 list-disc list-inside marker:text-stone-400">
                            <li>The new architecture improves performance by 40%.</li>
                            <li>Local-first data storage ensures complete privacy.</li>
                            <li>Seamless integration with existing macOS workflows.</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="py-4 px-3 w-full max-w-3xl mx-auto shrink-0">
                <div className="relative flex items-end gap-1 bg-stone-50 dark:bg-stone-900/50 rounded-[1.5rem] p-1.5 border border-stone-200 dark:border-stone-800 focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-colors">
                    <button className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors">
                        <Paperclip size={16} strokeWidth={1.5} />
                    </button>
                    <div className="flex-1 min-h-[36px] max-h-48 py-2 pr-1 text-sm text-stone-400 flex items-center">
                        Ask anything...
                    </div>
                    <button className="h-8 w-8 shrink-0 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                        <SendHorizontal size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MockTodoView = () => {
    const [activeTab, setActiveTab] = useState("checklist");
    return (
        <div className="h-full flex flex-col p-4 pt-2 gap-4">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Tasks</h2>
                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 rounded-lg p-1">
                        <button onClick={() => setActiveTab("checklist")} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all shadow-sm", activeTab === "checklist" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" : "text-stone-500 hover:text-stone-900")}>Lists</button>
                        <button onClick={() => setActiveTab("notes")} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all shadow-sm", activeTab === "notes" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" : "text-stone-500 hover:text-stone-900")}>Notes</button>
                    </div>
                </div>
                <div className="flex flex-col h-full overflow-hidden relative">
                    {activeTab === "checklist" ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-2 duration-300">
                            <header className="flex items-center gap-3 mb-4 shrink-0">
                                <div className="font-semibold text-lg flex-1 text-stone-900 dark:text-stone-100">Personal</div>
                                <button className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-stone-900 rounded-full transition-colors"><MoreVertical className="h-4 w-4" /></button>
                            </header>
                            <div className="flex gap-2 mb-4 shrink-0 relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Plus className="h-4 w-4 text-stone-400" /></div>
                                <div className="w-full bg-stone-50 dark:bg-stone-900 h-10 rounded-xl pl-9 flex items-center text-sm text-stone-400 border border-stone-200 dark:border-stone-800">Add a new task...</div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 pb-4 scrollbar-none">
                                {[
                                    { id: 1, text: "Review PR #42", completed: false },
                                    { id: 2, text: "Update documentation", completed: true },
                                    { id: 3, text: "Email the design team", completed: false },
                                    { id: 4, text: "Prepare launch assets", completed: false },
                                ].map((item) => (
                                    <div key={item.id} className={clsx("group flex items-start gap-3 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors cursor-default", item.completed && "opacity-50")}>
                                        <div className={clsx("mt-0.5 transition-colors", item.completed ? "text-stone-400" : "text-stone-300")}>{item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</div>
                                        <span className={clsx("flex-1 text-sm pt-0.5 transition-all text-stone-700 dark:text-stone-300", item.completed && "line-through text-stone-400")}>{item.text}</span>
                                        <Trash2 className="h-4 w-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
                            <header className="flex items-center gap-3 mb-2 shrink-0">
                                <button className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500"><ChevronLeft className="h-4 w-4" /></button>
                                <div className="font-semibold text-lg border-none bg-transparent flex-1 text-stone-900 dark:text-stone-100">Project Ideas</div>
                                <button className="h-8 w-8 text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                            </header>
                            <div className="flex-1 p-4 text-base leading-relaxed text-stone-600 dark:text-stone-300 bg-transparent border-none resize-none focus:ring-0">
                                <p>- AI-powered color palette generator</p>
                                <p>- Markdown editor with live preview</p>
                                <p>- Focus mode timer integration</p>
                                <p className="mt-4 text-stone-400 italic">Thinking about adding cloud sync...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MockClipboardView = () => {
    return (
        <div className="flex flex-col h-full px-4 py-3 relative overflow-hidden">
            <div className="relative mb-2 flex gap-2 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" size={16} />
                    <div className="w-full bg-stone-50 dark:bg-stone-900 h-10 rounded-xl pl-9 flex items-center text-sm text-stone-400 border border-stone-200 dark:border-stone-800">Search...</div>
                </div>
                <div className="h-10 px-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2 text-stone-500 dark:text-stone-400">
                    <History size={16} /><span className="text-xs font-medium">Last 30</span><ChevronDown size={14} className="opacity-50" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 pt-6 px-1 -mx-1 flex-1 min-h-0 scrollbar-none">
                <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 hover:shadow-md transition-all group h-32 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-end items-start mb-2"><span className="text-[9px] text-stone-400 text-right w-full">10:42 AM</span></div>
                    <p className="text-stone-800 dark:text-stone-200 text-sm font-medium line-clamp-3 leading-relaxed break-words">git commit -m "feat: landing page redesign"</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="h-1 w-6 bg-stone-100 dark:bg-stone-800 rounded-full" />
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14} className="text-stone-400 hover:text-stone-600" /><Trash2 size={14} className="text-stone-400 hover:text-red-500" /></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 hover:shadow-md transition-all group h-32 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-end items-start mb-2"><span className="text-[9px] text-stone-400 text-right w-full">09:15 AM</span></div>
                    <div className="flex-1 overflow-hidden min-h-0"><div className="w-full h-full rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center relative group/image"><ImageIcon size={16} className="text-stone-300" /></div></div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="h-1 w-6 bg-stone-100 dark:bg-stone-800 rounded-full" />
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14} className="text-stone-400 hover:text-stone-600" /><Trash2 size={14} className="text-stone-400 hover:text-red-500" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockShortcutsView = () => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const apps = [
        { id: '1', name: 'Google Chrome', icon: Globe },
        { id: '2', name: 'VS Code', icon: Cpu },
        { id: '3', name: 'Terminal', icon: Monitor },
        { id: '4', name: 'Spotify', icon: Layers },
        { id: '5', name: 'Slack', icon: MessageCircle },
        { id: '6', name: 'Figma', icon: Paintbrush },
    ];

    return (
        <div className="h-full px-4 py-3 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-light text-stone-900 dark:text-stone-100">My Apps</h2>
                    <div className="flex bg-stone-100 dark:bg-stone-800 rounded-md p-0.5">
                        <button onClick={() => setViewMode('grid')} className={clsx("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white dark:bg-stone-700 shadow-sm" : "text-stone-400")}><LayoutGrid size={14} /></button>
                        <button onClick={() => setViewMode('list')} className={clsx("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-stone-700 shadow-sm" : "text-stone-400")}><List size={14} /></button>
                    </div>
                </div>
                <button className="flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-colors shadow-lg shadow-stone-900/10">
                    <Plus size={14} /><span>Add App</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4 px-1 -mx-1 scrollbar-none min-h-0">
                <div className={clsx(viewMode === 'grid' ? "grid grid-cols-4 gap-4 p-2" : "grid grid-cols-1 gap-2")}>
                    {apps.map((app) => (
                        <div key={app.id} className={clsx("group relative transition-all cursor-default", viewMode === 'list' ? "bg-white dark:bg-stone-900 p-3 rounded-md border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md flex items-center justify-between" : "aspect-square flex items-center justify-center rounded-md hover:bg-stone-50 dark:hover:bg-stone-900")}>
                            <div className={clsx("flex items-center min-w-0", viewMode === 'list' ? "gap-3" : "justify-center w-full h-full flex-col gap-2")}>
                                <div className={clsx("rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500", viewMode === 'list' ? "w-10 h-10" : "w-12 h-12")}>
                                    <app.icon size={24} strokeWidth={1.5} />
                                </div>
                                {viewMode === 'list' && <span className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">{app.name}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MockLayoutsView = () => {
    return (
        <div className="h-full px-4 py-3 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-light text-stone-900 dark:text-stone-100">Window Flow</h2>
                <button className="flex items-center gap-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-colors shadow-lg shadow-stone-900/10">
                    <Plus size={14} /><span>Capture</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4 px-1 -mx-1 scrollbar-none min-h-0 flex flex-col gap-6">
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 mb-2">Workspace Layouts</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { name: "2 Columns", sub: "Horizontal", icon: Columns2 },
                            { name: "2 Rows", sub: "Vertical", icon: Rows2 },
                            { name: "3 Columns", sub: "Triple", icon: Columns3 },
                            { name: "2x2 Grid", sub: "Four", icon: Grid2X2 },
                            { name: "Focus", sub: "Main+Stack", icon: LayoutPanelLeft },
                            { name: "Cascade", sub: "Staircase", icon: LayersIcon },
                        ].map(preset => (
                            <button key={preset.name} className="h-14 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all flex items-center px-3 gap-3">
                                <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500"><preset.icon size={16} /></div>
                                <div className="flex flex-col items-start"><span className="text-[10px] font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">{preset.name}</span><span className="text-[9px] text-stone-400">{preset.sub}</span></div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Snapshots</h3>
                    {[
                        { name: "Dev Mode", count: 4, date: "Today" },
                        { name: "Reading", count: 2, date: "Yesterday" }
                    ].map((layout) => (
                        <div key={layout.name} className="bg-white dark:bg-stone-900 p-4 rounded-md border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-stone-100 dark:bg-stone-800 rounded-md flex items-center justify-center text-stone-500"><Layout size={16} strokeWidth={1.5} /></div>
                                    <div><h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">{layout.name}</h3><p className="text-[10px] text-stone-400">{layout.count} windows • {layout.date}</p></div>
                                </div>
                                <button className="p-1.5 text-stone-400 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                            <button className="w-full py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 transition-all text-xs font-medium flex items-center justify-center gap-2 group/btn">
                                <span>Restore Layout</span><ArrowRight size={12} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MockWebView = () => {
    const [mode, setMode] = useState<"browse" | "research">("browse");

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden">
            {/* Header / Mode Switcher */}
            <div className="flex justify-between items-center shrink-0 mb-2">
                <div className="flex p-1 bg-muted/50 rounded-lg">
                    <button
                        onClick={() => setMode("browse")}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all",
                            mode === "browse"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid size={12} />
                        Browse
                    </button>
                    <button
                        onClick={() => setMode("research")}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all",
                            mode === "research"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Microscope size={12} />
                        Research
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-muted rounded-md opacity-30 transition-colors">
                        <ArrowLeft size={12} />
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded-md opacity-30 transition-colors">
                        <ArrowRight size={12} />
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <RotateCcw size={12} />
                    </button>

                    <div className="w-px h-4 bg-border mx-1" />

                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <Type size={12} />
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded-md opacity-30 transition-colors">
                        <ExternalLink size={12} />
                    </button>
                </div>
            </div>

            {mode === "browse" ? (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Top Bar: Persistent URL Bar */}
                    <div className="shrink-0 z-50 py-2 bg-background/40 backdrop-blur-md border-b border-border/10 px-0">
                        <div className="flex items-center p-1 bg-background/95 backdrop-blur-md rounded-xl border border-border/50 transition-all duration-200">
                            <div className="flex-1 relative">
                                <div className="w-full h-8 px-3 flex items-center text-sm bg-accent/50 rounded-lg border border-transparent text-muted-foreground/50">
                                    Search or enter website name
                                </div>
                            </div>
                            {/* UA Toggle */}
                            <button className="p-1.5 ml-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <Smartphone size={14} />
                            </button>
                        </div>
                    </div>

                        {/* Main Content Area - Speed Dial Mock */}
                    <div className="flex-1 w-full bg-transparent relative min-h-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mb-6">
                            <h1 className="text-xl font-bold tracking-tight text-foreground/80 mb-2">
                                New Tab
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Search or choose a shortcut
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                            {[
                                { title: "YouTube", url: "https://youtube.com" },
                                { title: "GitHub", url: "https://github.com" },
                                { title: "Gmail", url: "https://gmail.com" },
                                { title: "Twitter", url: "https://twitter.com" },
                                { title: "Notion", url: "https://notion.so" },
                                { title: "Linear", url: "https://linear.app" },
                            ].map((fav) => (
                                <div
                                    key={fav.title}
                                    className="group relative flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 group-hover:scale-110 transition-transform overflow-hidden">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${fav.url}&sz=128`}
                                            alt={fav.title}
                                            className="w-5 h-5 object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground truncate w-full">
                                        {fav.title}
                                    </span>
                                </div>
                            ))}

                            {/* Add Button */}
                            <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition-all cursor-pointer border border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary">
                                <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center mb-1">
                                    <Plus size={16} strokeWidth={1.5} />
                                </div>
                                <span className="text-[10px] font-medium">Add</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar: Tabs Strip Mock */}
                    <div className="shrink-0 z-50 flex w-full mt-0.5 overflow-x-auto items-center py-1 gap-1 bg-background/50 backdrop-blur-sm border-b border-border/10 px-0">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors max-w-[120px] shrink-0 border border-primary/20 bg-primary/10 text-primary">
                            <div className="w-3 h-3 rounded-full bg-current/20 shrink-0" />
                            <span className="truncate flex-1">New Tab</span>
                            <button className="opacity-60 hover:opacity-100 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0">
                                <X size={10} />
                            </button>
                        </div>
                        <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 py-2">
                     <div className="bg-card p-2 rounded-md shadow-lg border border-border flex flex-col gap-1.5 shrink-0 mb-4 relative overflow-hidden">
                        <div className="flex items-center px-3 pt-1">
                            <Globe size={14} className="text-muted-foreground mr-2" />
                            <div className="flex-1 h-8 flex items-center text-muted-foreground/50 font-mono text-[10px]">
                                https://example.com
                            </div>
                        </div>
                        <div className="h-px bg-border mx-3" />
                        <div className="flex items-center px-3 pb-1">
                            <Bot size={14} className="text-muted-foreground mr-2" />
                            <div className="flex-1 h-8 flex items-center text-muted-foreground/50 text-[10px]">
                                What do you want to find?
                            </div>
                            <button className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground ml-2">
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                         <FileText size={40} strokeWidth={1} />
                         <p className="text-xs">No research tasks yet.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MockSettingsView = () => {
    const THEMES = [
        { id: "MD", name: "Default (MD)", lightColor: "#FAF9F6", darkColor: "#1C1917" },
        { id: "Clay", name: "Claymorphism", lightColor: "#EBE5E2", darkColor: "#1E1B19" },
        { id: "Doom64", name: "Doom64", lightColor: "#CCCCCC", darkColor: "#1A1A1A" },
        { id: "Kodama", name: "Kodama Grove", lightColor: "#E6D8B8", darkColor: "#3A362E" },
        { id: "Mocha", name: "Mocha Mousse", lightColor: "#EFEDD9", darkColor: "#2D2622" },
        { id: "Northern", name: "Northern Lights", lightColor: "#F5F5FA", darkColor: "#1A1D23" },
    ];
    return (
        <div className="h-full px-4 py-3 overflow-y-auto scrollbar-none space-y-6">
            <div>
                <h2 className="text-xl font-light text-stone-900 dark:text-stone-100 mb-4">Appearance</h2>
                <div className="bg-white dark:bg-stone-900 rounded-md p-4 border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center"><Paintbrush size={20} /></div>
                            <div className="flex flex-col"><span className="text-sm font-medium text-stone-900 dark:text-stone-100">Theme</span><span className="text-xs text-stone-400">Customize the look and feel</span></div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {THEMES.map((t, i) => (
                                <div key={t.id} className={clsx("relative flex flex-col items-center justify-center rounded-lg border-2 transition-all h-6 w-6 p-0 overflow-hidden group", i === 0 ? "border-stone-900 dark:border-stone-100 ring-2 ring-stone-900/20 dark:ring-stone-100/20" : "border-transparent")}>
                                    <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(to bottom right, ${t.lightColor} 50%, ${t.darkColor} 50%)` }} />
                                    {i === 0 && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 dark:bg-white/10"><div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 w-6 h-6 rounded-full flex items-center justify-center scale-100"><Check size={14} strokeWidth={3} /></div></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-light text-stone-900 dark:text-stone-100 mb-6">Intelligence</h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {['OpenAI', 'Anthropic', 'Google', 'Mistral'].map((p, i) => (
                        <div key={p} className={clsx("h-12 rounded-lg text-xs font-medium flex items-center justify-center relative border", i === 0 ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent shadow-lg shadow-stone-900/10" : "bg-white dark:bg-stone-900 text-stone-400 border-stone-200 dark:border-stone-800")}>
                            {i === 0 && <div className="absolute top-2 right-3"><Check size={12} /></div>}{p}
                        </div>
                    ))}
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">API Access Key</label>
                        <div className="relative">
                            <div className="w-full bg-stone-50 dark:bg-stone-950 h-10 rounded-lg px-4 flex items-center text-xs font-mono text-stone-900 dark:text-stone-100">sk-........................</div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle size={14} className="text-green-500" /></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-center pb-4">
                <span className="text-[10px] text-stone-400 hover:text-stone-900 transition-colors hover:underline cursor-default">About My Drawer</span>
            </div>
        </div>
    );
};