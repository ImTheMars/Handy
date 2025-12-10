import React, { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { commands } from "@/bindings";
import { useSettings } from "../../hooks/useSettings";
import { Sparkles, Loader2 } from "lucide-react";

type AiStatus = "ready" | "loading" | "pulling" | "error" | "off" | "no_ollama";

interface AiPullProgress {
  model: string;
  status: string;
  completed: number;
  total: number;
  percentage: number;
}

const AiStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<AiStatus>("off");
  const [currentModel, setCurrentModel] = useState<string>("");
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [pullProgress, setPullProgress] = useState<AiPullProgress | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const { getSetting, updateSetting } = useSettings();
  const aiEnabled = getSetting("ai_enhancement_enabled") ?? false;
  const selectedModel = getSetting("ai_selected_model") ?? "";
  
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStatus();
    
    // Listen for AI model pull progress
    const pullProgressUnlisten = listen<AiPullProgress>(
      "ai-model-pull-progress",
      (event) => {
        setPullProgress(event.payload);
        setStatus("pulling");
      }
    );

    // Listen for AI model pull complete
    const pullCompleteUnlisten = listen<string>(
      "ai-model-pull-complete",
      () => {
        setPullProgress(null);
        checkStatus();
      }
    );

    return () => {
      pullProgressUnlisten.then((fn) => fn());
      pullCompleteUnlisten.then((fn) => fn());
    };
  }, [aiEnabled, selectedModel]);

  const checkStatus = async () => {
    try {
      // Check if Ollama is available
      const available = await commands.checkOllamaAvailable();
      const isAvailable = available.status === "ok" && available.data;
      setOllamaAvailable(isAvailable);

      if (!isAvailable) {
        setStatus("no_ollama");
        return;
      }

      if (!aiEnabled) {
        setStatus("off");
        return;
      }

      // Get list of downloaded models
      const models = await commands.listOllamaModels();
      if (models.status === "ok") {
        setDownloadedModels(models.data);
        
        // Check if selected model is downloaded
        if (selectedModel && models.data.includes(selectedModel)) {
          setCurrentModel(selectedModel);
          setStatus("ready");
        } else if (selectedModel) {
          setStatus("loading");
        } else {
          setStatus("off");
        }
      }
    } catch (e) {
      setStatus("error");
    }
  };

  const toggleAi = () => {
    if (!ollamaAvailable) return;
    updateSetting("ai_enhancement_enabled", !aiEnabled);
  };

  const getStatusColor = (): string => {
    switch (status) {
      case "ready":
        return "bg-logo-primary";
      case "loading":
        return "bg-yellow-400 animate-pulse";
      case "pulling":
        return "bg-blue-400 animate-pulse";
      case "error":
        return "bg-red-400";
      case "no_ollama":
        return "bg-red-400/50";
      case "off":
      default:
        return "bg-mid-gray/40";
    }
  };

  const getDisplayText = (): string => {
    if (status === "pulling" && pullProgress) {
      return `${Math.round(pullProgress.percentage)}%`;
    }
    
    switch (status) {
      case "ready":
        return currentModel.split(":")[0] || "AI";
      case "loading":
        return "Loading...";
      case "pulling":
        return "Pulling...";
      case "error":
        return "Error";
      case "no_ollama":
        return "No Ollama";
      case "off":
      default:
        return "AI Off";
    }
  };

  const getTooltipText = (): string => {
    if (status === "pulling" && pullProgress) {
      return `Downloading ${pullProgress.model}: ${Math.round(pullProgress.percentage)}%`;
    }
    
    switch (status) {
      case "ready":
        return `AI Enhancement: ${currentModel} (click to disable)`;
      case "loading":
        return `Loading ${selectedModel}...`;
      case "error":
        return "AI Enhancement error - check Advanced settings";
      case "no_ollama":
        return "Ollama not detected - install from ollama.com";
      case "off":
      default:
        return "AI Enhancement disabled (click to enable)";
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={tooltipRef}>
      <button
        onClick={toggleAi}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={status === "no_ollama" || status === "pulling"}
        className={`flex items-center gap-1.5 hover:text-text/80 transition-colors ${
          status === "no_ollama" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        title={getTooltipText()}
      >
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          {status === "pulling" && (
            <Loader2 className="w-3 h-3 absolute -top-0.5 -left-0.5 animate-spin text-blue-400" />
          )}
        </div>
        <Sparkles className="w-3 h-3" />
        <span className="max-w-16 truncate text-xs">{getDisplayText()}</span>
        {aiEnabled && status === "ready" && (
          <span className="px-1 py-0.5 text-[10px] font-medium bg-logo-primary/20 text-logo-primary rounded">
            BETA
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-dark-gray border border-mid-gray/30 rounded shadow-lg whitespace-nowrap z-50">
          {getTooltipText()}
        </div>
      )}
    </div>
  );
};

export default AiStatusIndicator;

