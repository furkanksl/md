import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { InteractionDemo } from "@/components/interaction-demo";
import { FeaturesGrid } from "@/components/features-grid";
import { Footer } from "@/components/footer";

function App() {
  return (
    <div className="h-screen w-full font-sans bg-[#FAF9F6] text-[#44403C] selection:bg-[#738F82]/20 overflow-y-scroll scroll-smooth">
      <Header />
      
      {/* Section 1: Hero */}
      <section className="h-screen w-full snap-start flex flex-col justify-center relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full pt-16">
          <Hero />
        </div>
      </section>

      {/* Section 2: Interaction Demo */}
      <section className="h-screen w-full snap-start flex flex-col justify-center bg-white relative">
        <InteractionDemo />
      </section>

      {/* Section 3: Features */}
      <section className="h-screen w-full snap-start flex flex-col justify-center relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full">
          <FeaturesGrid />
        </div>
      </section>

      {/* Section 4: Footer */}
      <section className="h-[50vh] min-h-[300px] w-full snap-start flex flex-col justify-center relative bg-[#FAF9F6]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 w-full">
          <div className="text-center mb-12 space-y-4">
             <h2 className="text-2xl font-bold">Ready to streamline your workflow?</h2>
             <p className="text-[#44403C]/60">Download My Drawer today.</p>
          </div>
          <Footer />
        </div>
      </section>
    </div>
  );
}

export default App;
