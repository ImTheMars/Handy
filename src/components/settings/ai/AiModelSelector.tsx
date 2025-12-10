import React, { useState, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { commands } from "@/bindings";
import { useSettings } from "../../../hooks/useSettings";
import { toast } from "sonner";
import AiModelStatusButton from "./AiModelStatusButton";
import AiModelDropdown from "./AiModelDropdown";

type AiModelStatus = "ready" | "pulling" | "error" | "not_installed" | "ollama_unavailable";

interface AiModel {
  id: string;
  size_mb: number;
  speed: string;
  quality: string;
  notes: string;
}

interface PullProgress {
  model_id: string;
  status: string;
  completed: number | null;
  total: number | null;
  percentage: number;
}

const AiModelSelector: React.FC = () => {
  const { getSetting, updateSetting } = useSettings();
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [modelStatus, setModelStatus] = useState<AiModelStatus>("not_installed");
  const [showDropdown, setShowDropdown] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [pullProgress, setPullProgress] = useState<Map<string, PullProgress>>(new Map());
  const [recommendedModel, setRecommendedModel] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = getSetting("ai_selected_model") || "";

  useEffect(() => {
    loadModels();
    checkOllama();
    loadRecommendation();

    // Listen for pull progress
    const progressUnlisten = listen<PullProgress>("ai-model-pull-progress", (event) => {
      const progress = event.payload;
      setPullProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(progress.model_id, progress);
        return newMap;
      });
      setModelStatus("pulling");
    });

    // Listen for pull completion
    const completeUnlisten = listen<string>("ai-model-pull-complete", (event) => {
      const modelId = event.payload;
      setPullProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(modelId);
        return newMap;
      });
      loadModels();
      toast.success(`${modelId} downloaded successfully!`);
      setModelStatus("ready");
    });

    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      progressUnlisten.then((fn) => fn());
      completeUnlisten.then((fn) => fn());
    };
  }, []);

  const loadRecommendation = async () => {
    try {
      const result = await commands.getRecommendedAiModel();
      if (result.status === "ok" && result.data) {
        setRecommendedModel(result.data);
      }
    } catch (err) {
      console.error("Failed to get recommended model:", err);
    }
  };

  const checkOllama = async () => {
    try {
      const result = await commands.checkOllamaAvailable();
      const available = result.status === "ok" ? result.data : false;
      setOllamaAvailable(available);
      
      if (!available) {
        setModelStatus("ollama_unavailable");
      } else if (selectedModel) {
        setModelStatus("ready");
      } else {
        setModelStatus("not_installed");
      }
    } catch (e) {
      setOllamaAvailable(false);
      setModelStatus("ollama_unavailable");
    }
  };

  const loadModels = async () => {
    try {
      // Get available models
      const availResult = await commands.getAvailableAiModels();
      if (availResult.status === "ok") {
        setAvailableModels(availResult.data);
      }

      // Get downloaded models from Ollama
      const downloadedResult = await commands.listOllamaModels();
      if (downloadedResult.status === "ok") {
        setDownloadedModels(downloadedResult.data);
      }
    } catch (err) {
      console.error("Failed to load AI models:", err);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    try {
      await updateSetting("ai_selected_model", modelId);
      setModelStatus("ready");
      setShowDropdown(false);
      toast.success(`Switched to ${modelId}`);
    } catch (err) {
      toast.error("Failed to select model");
    }
  };

  const handleModelPull = async (modelId: string) => {
    try {
      setModelStatus("pulling");
      toast.info(`Pulling ${modelId}... This may take a few minutes.`);
      
      const result = await commands.pullOllamaModel(modelId);
      if (result.status === "ok") {
        // Success toast and model selection handled by event listener
        await handleModelSelect(modelId);
      } else {
        toast.error(result.error || "Failed to pull model");
        setModelStatus("error");
        setPullProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(modelId);
          return newMap;
        });
      }
    } catch (err) {
      toast.error("Failed to pull model");
      setModelStatus("error");
      setPullProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(modelId);
        return newMap;
      });
    }
  };

  const handleModelDelete = async (modelId: string) => {
    const confirmed = confirm(`Delete ${modelId}? This will remove it from Ollama.`);
    if (!confirmed) return;

    try {
      const result = await commands.deleteOllamaModel(modelId);
      if (result.status === "ok") {
        toast.success(`${modelId} deleted`);
        await loadModels();
        
        // If we deleted the selected model, clear selection
        if (selectedModel === modelId) {
          await updateSetting("ai_selected_model", null);
          setModelStatus("not_installed");
        }
      } else {
        toast.error(result.error || "Failed to delete model");
      }
    } catch (err) {
      toast.error("Failed to delete model");
    }
  };

  const getDisplayText = (): string => {
    // Check if any model is being pulled
    if (pullProgress.size > 0) {
      const [progress] = Array.from(pullProgress.values());
      if (progress.percentage > 0) {
        return `Pulling ${Math.round(progress.percentage)}%`;
      }
      return `Pulling ${progress.status}...`;
    }

    switch (modelStatus) {
      case "ready":
        return selectedModel || "No Model Selected";
      case "pulling":
        return "Pulling model...";
      case "error":
        return "Error";
      case "not_installed":
        return "No Model - Pull Required";
      case "ollama_unavailable":
        return "Ollama Not Running";
      default:
        return "Select Model";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <AiModelStatusButton
        status={modelStatus}
        displayText={getDisplayText()}
        isDropdownOpen={showDropdown}
        onClick={() => setShowDropdown(!showDropdown)}
      />

      {showDropdown && (
        <AiModelDropdown
          models={availableModels}
          downloadedModels={downloadedModels}
          selectedModel={selectedModel}
          recommendedModel={recommendedModel}
          pullProgress={pullProgress}
          onModelSelect={handleModelSelect}
          onModelPull={handleModelPull}
          onModelDelete={handleModelDelete}
        />
      )}
    </div>
  );
};

export default AiModelSelector;

