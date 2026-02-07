import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { InteractionDemo } from "@/components/interaction-demo";
import { FeaturesGrid } from "@/components/features-grid";
import { Footer } from "@/components/footer";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DownloadDialog } from "@/components/download-dialog";

function App() {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadSource, setDownloadSource] = useState("Hero");

  const handleOpenDownload = (source: string) => {
    setDownloadSource(source);
    setIsDownloadOpen(true);
  };

  return (
    <div className="h-screen w-full overflow-x-hidden font-sans bg-[#FAF9F6] text-[#44403C] selection:bg-[#738F82]/20 overflow-y-scroll scroll-smooth">
      <Header onOpenDownload={() => handleOpenDownload("Header")} />
      
      {/* Section 1: Hero */}
      <section className="min-h-screen w-full flex flex-col justify-center relative py-8 md:py-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full pt-16">
          <Hero onOpenDownload={() => handleOpenDownload("Hero")} />
        </div>
      </section>

      {/* Section 2: Interaction Demo */}
      <section className="min-h-screen w-full flex flex-col justify-center bg-white relative py-20 md:py-0">
        <InteractionDemo />
      </section>

      {/* Section 3: Features */}
      <section className="min-h-screen w-full flex flex-col justify-center relative py-20 md:py-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full">
          <FeaturesGrid />  
        </div>
      </section>

      {/* Section 4: Footer */}
      <section className="min-h-[50vh] w-full flex flex-col justify-center relative bg-[#FAF9F6] py-20 md:py-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full">
          <div className="text-center mb-12 space-y-6 flex flex-col items-center">
             <h2 className="text-2xl font-bold">Ready to streamline your workflow?</h2>
             <p className="text-[#44403C]/60">Download My Drawer today.</p>
             <a href="https://www.producthunt.com/products/my-drawer?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-my-drawer" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1074628&theme=light&t=1770347625097" alt="My Drawer - Intelligent sidebar for MacOS | FREE & OS | Product Hunt" style={{ width: '250px', height: '54px' }} width="250" height="54" />
             </a>
          </div>
          <Footer />
        </div>
      </section>
      
      <AnimatePresence>
        {isDownloadOpen && (
          <DownloadDialog 
            onClose={() => setIsDownloadOpen(false)} 
            source={downloadSource} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;