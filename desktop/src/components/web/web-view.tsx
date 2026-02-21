import { useState, useEffect, useMemo, useRef } from "react";
import { useScrapingStore } from "@/stores/scraping-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { WebBlanketView } from "./web-blanket/web-blanket-view";
import {
  ArrowRight,
  Loader2,
  Globe,
  Trash2,
  FileText,
  Bot,
  ChevronDown,
  Cpu,
  LayoutGrid,
  Microscope,
  ArrowLeft,
  ZoomIn,
  Plus,
  Minus,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { MODELS } from "@/core/domain/models";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { webScrapingService } from "@/core/application/services/web-scraping-service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { isImeComposing } from "@/lib/ime";
import { open } from "@tauri-apps/plugin-shell";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Markdown = ReactMarkdown as any;

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  mistral: "Mistral",
  groq: "Groq",
  custom: "Custom",
};

export const WebView = () => {
  const {
    history,
    loadHistory,
    addScrapingTask,
    deleteTask,
    clearHistory,
    loadResult,
  } = useScrapingStore();
  const { aiConfigurations } = useSettingsStore();
  const {
    mode,
    setMode,
    init: initWebBlanket,
    dispose: disposeWebBlanket,
    tabs,
    activeTabId,
    goBack,
    goForward,
    reload,
    stop,
    zoomIn,
    zoomOut,
    isFullScreen,
  } = useWebBlanketStore();

  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedResultText, setSelectedResultText] = useState<string | null>(
    null,
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const isComposingPromptRef = useRef(false);
  const ignoreNextPromptEnterRef = useRef(false);
  const selectedResultIdRef = useRef<string | null>(null);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const historyPageSize = 50;

  useEffect(() => {
    selectedResultIdRef.current = selectedResultId;
  }, [selectedResultId]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    const init = async () => {
      const res = await loadHistory({ limit: historyPageSize, offset: 0 });
      setHistoryOffset(res.items.length);
      setHistoryHasMore(res.hasMore);
    };

    init();
    initWebBlanket();
    return () => {
      disposeWebBlanket();
    };
  }, []);

  // Compute available models based on configured providers
  const availableModels = useMemo(() => {
    const models: { id: string; name: string; provider: string }[] = [];

    Object.keys(aiConfigurations).forEach((provider) => {
      const config = aiConfigurations[provider];
      if (config && config.apiKey) {
        // Filter models from the domain definition
        const providerModels = MODELS.filter((m) => m.provider === provider);
        providerModels.forEach((model) => {
          models.push({
            id: model.id,
            name: model.name,
            provider: model.provider,
          });
        });
      }
    });

    return models;
  }, [aiConfigurations]);

  // Set default model if none selected or current selection is invalid
  useEffect(() => {
    if (availableModels.length > 0) {
      if (
        !selectedModel ||
        !availableModels.find((m) => m.id === selectedModel)
      ) {
        const firstModel = availableModels[0];
        if (firstModel) {
          setSelectedModel(firstModel.id);
        }
      }
    } else {
      setSelectedModel(null);
    }
  }, [availableModels, selectedModel]);

  const handleScrape = async () => {
    if (!url.trim() || !selectedModel) return;
    setIsLoading(true);

    try {
      const modelInfo = availableModels.find((m) => m.id === selectedModel);
      if (!modelInfo) throw new Error("Model not found");

      const config = aiConfigurations[modelInfo.provider];
      if (!config) throw new Error("Provider configuration not found");

      let streamContent = "";

      // Use the Service
      await webScrapingService.scrapeAndAnalyze(
        url,
        prompt,
        selectedModel,
        modelInfo.provider,
        config.apiKey,
        (chunk) => {
          streamContent += chunk;
          // Live preview could be added here if we had a temporary state
        },
      );

      // Save to History (Stream finished)
      const newItem = await addScrapingTask(url, prompt, streamContent);

      // Reset and show result
      setUrl("");
      setPrompt("");
      if (newItem?.id) {
        setSelectedResultId(newItem.id);
        setSelectedResultText(streamContent);
        setHistoryOffset((prev) => prev + 1);
      } else {
        setSelectedResultId(null);
        setSelectedResultText(streamContent);
      }
    } catch (error) {
      console.error("Scraping failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group models by provider for the dropdown
  const groupedModels = useMemo(() => {
    const groups: Record<
      string,
      { id: string; name: string; provider: string }[]
    > = {};
    availableModels.forEach((model) => {
      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider]!.push(model);
    });
    return groups;
  }, [availableModels]);

  return (
    <div
      className={cn("h-full px-4 pt-1 flex flex-col relative overflow-hidden", {
        "px-0 pt-0": isFullScreen,
      })}
    >
      {/* Header / Mode Switcher */}
      {!isFullScreen && (
        <div className="flex justify-between items-center shrink-0 pointer-events-auto">
          <div className="flex p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setMode("browse")}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                mode === "browse"
                  ? "bg-background animate-shadow-fade text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid size={14} />
              Browse
            </button>
            <button
              onClick={() => setMode("research")}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                mode === "research"
                  ? "bg-background animate-shadow-fade text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Microscope size={14} />
              Research
            </button>
          </div>

          {mode === "browse" ? (
            <div className="flex items-center gap-1">
              <button
                onClick={goBack}
                disabled={!activeTab?.canGoBack}
                className="p-1.5 hover:bg-muted rounded-md disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={goForward}
                disabled={!activeTab?.canGoForward}
                className="p-1.5 hover:bg-muted rounded-md disabled:opacity-30 transition-colors"
              >
                <ArrowRight size={14} />
              </button>
              <button
                onClick={activeTab?.loading ? stop : reload}
                className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center"
              >
                <RotateCcw
                  size={14}
                  className={cn(
                    activeTab?.loading &&
                      "animate-[spin_0.4s_linear_infinite_reverse]",
                  )}
                />
              </button>

              <div className="w-px h-4 bg-border mx-1" />

              {/* Zoom */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    title="Zoom"
                  >
                    <ZoomIn size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-1 bg-background/80 backdrop-blur-md border border-border/50 shadow-lg rounded-full"
                  side="bottom"
                  align="end"
                  sideOffset={8}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={zoomOut}
                      className="w-7 h-7 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-colors"
                      title="Zoom Out"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[10px] font-mono font-medium text-muted-foreground min-w-[3.5ch] text-center select-none tabular-nums">
                      {Math.round((activeTab?.zoom || 1) * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="w-7 h-7 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-colors"
                      title="Zoom In"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => activeTab?.url && open(activeTab.url)}
                disabled={!activeTab?.url}
                className="p-1.5 hover:bg-muted rounded-md disabled:opacity-30 transition-colors"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              {availableModels.length > 0 && selectedModel && (
                <PopoverPrimitive.Root>
                  <PopoverPrimitive.Trigger asChild>
                    <button className="flex items-center gap-1 px-1 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <Cpu size={14} />
                      <span>
                        {
                          availableModels.find((m) => m.id === selectedModel)
                            ?.name
                        }
                      </span>
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground"
                      />
                    </button>
                  </PopoverPrimitive.Trigger>
                  <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                      className="z-50 min-w-[200px] bg-popover rounded-lg border border-border shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200"
                      sideOffset={5}
                    >
                      <div className="max-h-[300px] overflow-y-auto scrollbar-none">
                        {(
                          Object.entries(groupedModels ?? {}) as [
                            string,
                            { id: string; name: string; provider: string }[],
                          ][]
                        ).map(([provider, models]) => {
                          // Ensure models is defined before proceeding
                          const modelList = models || [];
                          if (modelList.length === 0) return null;

                          return (
                            <div key={provider} className="mb-2 last:mb-0">
                              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {PROVIDER_LABELS[provider] || provider}
                              </div>
                              {modelList.map((model) => (
                                <button
                                  key={model.id}
                                  onClick={() => setSelectedModel(model.id)}
                                  className={clsx(
                                    "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between",
                                    selectedModel === model.id
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground hover:bg-muted",
                                  )}
                                >
                                  {model.name}
                                  {selectedModel === model.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </PopoverPrimitive.Content>
                  </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
              )}
            </div>
          )}
        </div>
      )}

      {mode === "browse" ? (
        <WebBlanketView />
      ) : (
        <>
          {/* Input Area */}
          <div className="bg-card p-2 mt-2 rounded-md shadow-lg border border-border flex flex-col gap-1.5 shrink-0 mb-4 relative overflow-hidden pointer-events-auto">
            {isLoading && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary z-10"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
              />
            )}

            <div className="flex items-center px-3 pt-1">
              <Globe size={16} className="text-muted-foreground mr-2" />
              <input
                className="flex-1 h-8 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-xs"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="h-px bg-border mx-3" />

            <div className="flex items-center px-3 pb-1">
              <Bot size={16} className="text-muted-foreground mr-2" />
              <input
                className="flex-1 h-8 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-xs"
                placeholder="What do you want to find?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (isImeComposing(e, isComposingPromptRef)) {
                    return;
                  }
                  if (e.key === "Enter") {
                    if (ignoreNextPromptEnterRef.current) {
                      e.preventDefault();
                      return;
                    }
                    handleScrape();
                  }
                }}
              />
              <button
                onClick={handleScrape}
                disabled={isLoading || !url}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors ml-2"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex gap-3 min-h-0">
            {/* History List */}
            <div
              className={clsx(
                "flex-1 overflow-y-auto scrollbar-none space-y-2 transition-all flex flex-col px-1 -mx-1",
                selectedResultId ? "hidden md:block md:w-1/3" : "w-full",
              )}
            >
              {history.length === 0 && (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3 opacity-50">
                  <FileText size={40} strokeWidth={1} />
                  <p className="text-sm">No research tasks yet.</p>
                </div>
              )}

              {history.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "p-3 rounded-md border cursor-pointer transition-all hover:shadow-md group relative flex flex-col justify-between h-24",
                    selectedResultId === item.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg"
                      : "bg-card text-foreground border-border hover:border-muted-foreground/30",
                  )}
                  onClick={async () => {
                    setSelectedResultId(item.id);
                    setSelectedResultText(null);
                    try {
                      const fullResult = await loadResult(item.id);
                      if (selectedResultIdRef.current === item.id) {
                        setSelectedResultText(fullResult);
                      }
                    } catch (err) {
                      console.error("Failed to load result:", err);
                    }
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span
                        className={clsx(
                          "text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]",
                          selectedResultId === item.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {new URL(item.url).hostname}
                      </span>
                    </div>
                    <p className="font-medium text-xs line-clamp-2 mb-1">
                      {item.prompt || "No prompt provided"}
                    </p>
                  </div>

                  <div className="flex justify-end mt-auto">
                    <span
                      className={clsx(
                        "text-[9px]",
                        selectedResultId === item.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(item.id);
                      if (selectedResultId === item.id) {
                        setSelectedResultId(null);
                        setSelectedResultText(null);
                      }
                    }}
                    className={clsx(
                      "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md",
                      selectedResultId === item.id
                        ? "hover:bg-primary-foreground/20 text-primary-foreground/70"
                        : "hover:bg-muted text-muted-foreground hover:text-destructive",
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {history.length > 0 && (
                <div className="pt-2 flex justify-center mt-auto pb-2 gap-2">
                  {historyHasMore && (
                    <button
                      onClick={async () => {
                        if (isLoadingMore) return;
                        setIsLoadingMore(true);
                        try {
                          const res = await loadHistory({
                            limit: historyPageSize,
                            offset: historyOffset,
                            append: true,
                          });
                          setHistoryOffset((prev) => prev + res.items.length);
                          setHistoryHasMore(res.hasMore);
                        } finally {
                          setIsLoadingMore(false);
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Loading
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} />
                          Load More
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      clearHistory();
                      setSelectedResultId(null);
                      setSelectedResultText(null);
                      setHistoryOffset(0);
                      setHistoryHasMore(false);
                    }}
                    className="text-muted-foreground hover:text-destructive text-[10px] uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
                  >
                    <Trash2 size={12} />
                    Clear All History
                  </button>
                </div>
              )}
            </div>

            {/* Detail View */}
            <AnimatePresence>
              {selectedResultId && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-[2] bg-card rounded-md border border-border shadow-sm overflow-hidden flex flex-col absolute inset-0 md:static z-20"
                >
                  <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wide">
                      Analysis Result
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedResultId(null);
                        setSelectedResultText(null);
                      }}
                      className="p-1.5 hover:bg-muted rounded-full md:hidden"
                    >
                      <ArrowRight
                        size={16}
                        className="rotate-180 text-muted-foreground"
                      />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {!selectedResultText ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs uppercase tracking-wide">
                          Loading
                        </span>
                      </div>
                    ) : (
                      <div
                        className="prose prose-stone dark:prose-invert prose-xs max-w-none font-mono text-xs leading-relaxed break-words
                                    prose-p:text-muted-foreground prose-p:my-2
                                    prose-headings:font-bold prose-headings:text-foreground prose-headings:my-3 prose-headings:tracking-tight
                                    prose-strong:font-bold prose-strong:text-foreground
                                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
                                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
                                    prose-li:my-0.5
                                    prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:italic
                                        prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
                      >
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc pl-4 my-2 space-y-2"
                                {...props}
                              />
                            ),
                            ol: ({ ...props }) => (
                              <ol
                                className="list-decimal pl-7 my-2 space-y-2"
                                {...props}
                              />
                            ),
                            li: ({ ...props }) => (
                              <li className="pl-1" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong
                                className="font-bold text-foreground mt-4 inline-block"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {selectedResultText}
                        </Markdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};
