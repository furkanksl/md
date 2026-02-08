import { useUIStore } from '@/stores/ui-store';
import { clsx } from 'clsx';
import { Paintbrush, Check } from 'lucide-react';

const THEMES = [
  {
    id: "MD",
    name: "Default (MD)",
    lightColor: "#FAF9F6",
    darkColor: "#1C1917"
  },
  {
    id: "Clay",
    name: "Claymorphism",
    lightColor: "#EBE5E2",
    darkColor: "#1E1B19"
  },
  {
    id: "Doom64",
    name: "Doom64",
    lightColor: "#CCCCCC",
    darkColor: "#1A1A1A"
  },
  {
    id: "Kodama",
    name: "Kodama Grove",
    lightColor: "#E6D8B8",
    darkColor: "#3A362E"
  },
  {
    id: "Mocha",
    name: "Mocha Mousse",
    lightColor: "#EFEDD9",
    darkColor: "#2D2622"
  },
  {
    id: "Northern",
    name: "Northern Lights",
    lightColor: "#F5F5FA",
    darkColor: "#1A1D23"
  },
  {
    id: "Notebook",
    name: "Notebook",
    lightColor: "#F9F9F9",
    darkColor: "#2B2B2B"
  },
  {
    id: "Pastel",
    name: "Pastel Dreams",
    lightColor: "#F7F2FA",
    darkColor: "#1C1917"
  },
  {
    id: "Quantum",
    name: "Quantum Rose",
    lightColor: "#FFF0F7",
    darkColor: "#1E0922"
  },
];

export const ThemeSection = () => {
  const { themeName, setThemeName } = useUIStore();

  return (
    <div>
      <h2 className="text-xl font-light text-foreground mb-4">Appearance</h2>
      <div className="bg-card rounded-md p-4 border border-border shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center">
              <Paintbrush size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <span className="text-xs text-muted-foreground">
                Customize the look and feel
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeName(t.id)}
                title={t.name}
                className={clsx(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 transition-all h-6 w-6 p-0 overflow-hidden group hover:scale-[1.05] active:scale-[0.95]",
                  themeName === t.id
                    ? "border-primary ring-2 ring-primary/20 ring-offset-1 ring-offset-background"
                    : "border-transparent hover:border-border hover:shadow-sm"
                )}
              >
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: `linear-gradient(to bottom right, ${t.lightColor} 50%, ${t.darkColor} 50%)`
                  }}
                />

                {themeName === t.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 dark:bg-white/10 backdrop-blur-[1px]">
                    <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center shadow-sm scale-100 transition-transform">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
