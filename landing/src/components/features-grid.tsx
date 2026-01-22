import { 
  BrainCircuit, 
  ClipboardCopy, 
  LayoutTemplate, 
  Globe, 
  ShieldCheck
} from "lucide-react";

export const FeaturesGrid = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#44403C] mb-3">
          Complete Toolkit
        </h2>
        <p className="text-lg text-[#44403C]/60 max-w-xl mx-auto">
          Everything you need to stay in flow, organized in one quiet drawer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-4 max-w-[1100px] mx-auto w-full h-auto md:h-[500px]">
        
        {/* 1. AI Chat (Large) - Sage Green */}
        <div className="md:col-span-4 md:row-span-1 bg-[#738F82] rounded-[2rem] p-6 md:p-8 relative overflow-hidden group hover:brightness-105 transition-all">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-[#FAF9F6] backdrop-blur-sm">
                    <BrainCircuit size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[#FAF9F6]/60 text-xs font-medium uppercase tracking-wider border border-[#FAF9F6]/20 px-3 py-1 rounded-full">Intelligence</span>
            </div>
            <div className="mt-8 md:mt-0">
                <h3 className="text-2xl font-bold text-[#FAF9F6] mb-2">Context-Aware AI</h3>
                <p className="text-[#FAF9F6]/80 text-lg leading-relaxed max-w-md">Chat with OpenAI, Anthropic, or local models. Drag & drop files for instant context.</p>
            </div>
          </div>
          <BrainCircuit className="absolute -right-12 -bottom-12 text-[#FAF9F6]/10 w-64 h-64 rotate-12" strokeWidth={1} />
        </div>

        {/* 2. Clipboard (Tall/Square) - Charcoal */}
        <div className="md:col-span-2 md:row-span-1 bg-[#44403C] rounded-[2rem] p-6 md:p-8 text-[#FAF9F6] relative overflow-hidden group hover:brightness-110 transition-all">
           <div className="relative z-10 h-full flex flex-col justify-between gap-8 md:gap-0">
             <div className="w-12 h-12 rounded-2xl bg-[#57534E] flex items-center justify-center text-[#FAF9F6] shadow-inner">
                <ClipboardCopy size={24} strokeWidth={1.5} />
             </div>
             <div>
                <h3 className="text-xl font-bold mb-1">Clipboard</h3>
                <p className="text-[#FAF9F6]/60 text-sm">Searchable, persistent history.</p>
             </div>
           </div>
           {/* Decorative lists */}
           <div className="absolute top-8 right-8 w-16 space-y-2 opacity-10">
              <div className="h-1.5 bg-white rounded-full w-full" />
              <div className="h-1.5 bg-white rounded-full w-3/4 ml-auto" />
              <div className="h-1.5 bg-white rounded-full w-5/6 ml-auto" />
              <div className="h-1.5 bg-white rounded-full w-full" />
           </div>
        </div>

        {/* 3. Window Layouts - Off-white */}
        <div className="md:col-span-2 md:row-span-1 bg-[#F2EFE9] rounded-[2rem] p-6 md:p-8 hover:bg-[#E7E5E4] transition-colors group">
            <div className="h-full flex flex-col justify-between gap-8 md:gap-0">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#44403C] shadow-sm">
                    <LayoutTemplate size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#44403C] mb-1">Window Snap</h3>
                    <p className="text-[#44403C]/60 text-sm">One-click window arrangements.</p>
                </div>
            </div>
        </div>

        {/* 4. Web Research - White w/ Border */}
        <div className="md:col-span-2 md:row-span-1 bg-white border border-[#E7E5E4] rounded-[2rem] p-6 md:p-8 hover:border-[#D4C5BE] transition-colors group">
             <div className="h-full flex flex-col justify-between gap-8 md:gap-0">
                <div className="w-12 h-12 rounded-2xl bg-[#F2EFE9] flex items-center justify-center text-[#44403C]">
                    <Globe size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#44403C] mb-1">Research Agent</h3>
                    <p className="text-[#44403C]/60 text-sm">Scrape and summarize web pages.</p>
                </div>
            </div>
        </div>

        {/* 5. Privacy - White w/ Border */}
        <div className="md:col-span-2 md:row-span-1 bg-white border border-[#E7E5E4] rounded-[2rem] p-6 md:p-8 hover:border-[#738F82] transition-colors group relative overflow-hidden">
             <div className="h-full flex flex-col justify-between relative z-10 gap-8 md:gap-0">
                <div className="w-12 h-12 rounded-2xl bg-[#F2EFE9] flex items-center justify-center text-[#738F82]">
                    <ShieldCheck size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#44403C] mb-1">Local & Private</h3>
                    <p className="text-[#44403C]/60 text-sm">Keys stored locally. No telemetry.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
