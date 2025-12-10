import React from "react";
import { Button } from "../../ui/Button";
import { Download, Trash2, Check, Star } from "lucide-react";

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

interface AiModelDropdownProps {
  models: AiModel[];
  downloadedModels: string[];
  selectedModel: string;
  recommendedModel?: string;
  pullProgress: Map<string, PullProgress>;
  onModelSelect: (modelId: string) => void;
  onModelPull: (modelId: string) => void;
  onModelDelete: (modelId: string) => void;
}

const AiModelDropdown: React.FC<AiModelDropdownProps> = ({
  models,
  downloadedModels,
  selectedModel,
  recommendedModel,
  pullProgress,
  onModelSelect,
  onModelPull,
  onModelDelete,
}) => {
  const isModelDownloaded = (modelId: string) => {
    return downloadedModels.some((m) => m.startsWith(modelId));
  };

  const getModelProgress = (modelId: string): PullProgress | undefined => {
    return pullProgress.get(modelId);
  };

  const isRecommended = (modelId: string) => {
    return recommendedModel === modelId;
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-background border border-mid-gray/20 rounded-lg shadow-lg z-50 max-h-[32rem] overflow-y-auto">
      <div className="p-3 border-b border-mid-gray/20">
        <p className="text-xs font-medium text-mid-gray uppercase">
          AI Enhancement Models
        </p>
      </div>

      <div className="p-2 space-y-2">
        {models.map((model) => {
          const isDownloaded = isModelDownloaded(model.id);
          const isSelected = selectedModel === model.id;
          const progress = getModelProgress(model.id);
          const isPulling = progress !== undefined;
          const recommended = isRecommended(model.id);

          return (
            <div
              key={model.id}
              className={`p-2.5 rounded-lg border ${
                isSelected
                  ? "border-logo-primary bg-logo-primary/5"
                  : recommended
                    ? "border-yellow-500/50 bg-yellow-500/5"
                    : "border-mid-gray/20 hover:bg-mid-gray/5"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-sm truncate">{model.id}</h4>
                    {recommended && !isSelected && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded">
                        <Star className="w-3 h-3" />
                        Recommended
                      </div>
                    )}
                    {isDownloaded && !isPulling && (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {isSelected && (
                      <div className="px-1.5 py-0.5 bg-logo-primary/20 text-logo-primary text-xs rounded">
                        Active
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-mid-gray mb-1.5 line-clamp-2">{model.notes}</p>
                  
                  {isPulling && progress ? (
                    <div className="mb-1.5">
                      <div className="flex justify-between text-xs text-mid-gray mb-1">
                        <span>{progress.status}</span>
                        {progress.percentage > 0 && (
                          <span>{Math.round(progress.percentage)}%</span>
                        )}
                      </div>
                      <div className="w-full bg-mid-gray/20 rounded-full h-1.5">
                        <div
                          className="bg-logo-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progress.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-xs text-mid-gray">
                      <span>{model.size_mb}MB</span>
                      <span>•</span>
                      <span>{model.speed}</span>
                      <span>•</span>
                      <span>{model.quality}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  {isPulling ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                    >
                      Pulling...
                    </Button>
                  ) : isDownloaded ? (
                    <>
                      <Button
                        size="sm"
                        variant={isSelected ? "primary" : "secondary"}
                        onClick={() => onModelSelect(model.id)}
                        disabled={isSelected}
                      >
                        {isSelected ? "Active" : "Use"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onModelDelete(model.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onModelPull(model.id)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Pull
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-mid-gray/20 bg-mid-gray/5">
        <p className="text-xs text-mid-gray">
          Models are managed by Ollama. Use Pull to download.
        </p>
      </div>
    </div>
  );
};

export default AiModelDropdown;

