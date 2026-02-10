import { Hero } from "@/components/hero";
import { InteractionDemo } from "@/components/interaction-demo";
import { Footer } from "@/components/footer";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DownloadModal } from "@/components/download-modal";
import { DesktopMock } from "./components/desktop-mock";
import { BentoGrid } from "./components/bento-grid";
import { Header } from "./components/header";

function App() {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [_, setDownloadSource] = useState("Hero");

  const handleOpenDownload = (source: string) => {
    setDownloadSource(source);
    setIsDownloadOpen(true);
  };

  return (
    <div className="font-sans text-[#44403C] selection:bg-[#738F82]/20 relative overflow-x-hidden">

      {/* Separated Header Component */}
      <Header onOpenDownload={() => handleOpenDownload("Header")} />
      <Hero onOpenDownload={() => handleOpenDownload("Hero")} />

      {/* Desktop Mock Section - Desktop Only */}
      <section className="hidden md:flex w-full flex-col justify-center items-center px-6 bg-[#FAF9F6] relative z-20 -mt-32 pb-20">
        <div className="max-w-7xl mx-auto w-full">
          <DesktopMock />
        </div>
      </section>

      <BentoGrid />

      {/* Interaction Demo - Mobile Only */}
      <section className="block md:hidden w-full bg-[#FAF9F6] relative z-20 pb-20">
        <InteractionDemo />
      </section>

      {/* Footer Section */}
      <section className="min-h-[50vh] w-full flex flex-col justify-center relative bg-[#FAF9F6] py-20 md:py-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full">
          <div className="text-center mb-12 space-y-6 flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold">It's completely free and open source.</h2>
            <p className="text-[#44403C]/60">Give us a star on GitHub to support us or an upvote on Product Hunt.</p>
            <a href="https://www.producthunt.com/products/my-drawer?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-my-drawer" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
              <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1074628&theme=light&t=1770347625097" alt="My Drawer - Intelligent sidebar for MacOS | FREE & OS | Product Hunt" style={{ width: '250px', height: '54px' }} width="250" height="54" />
            </a>
          </div>
          <Footer />
        </div>
      </section>

      <AnimatePresence>
        {isDownloadOpen && (
          <DownloadModal
            onClose={() => setIsDownloadOpen(false)}
            isOpen={isDownloadOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;