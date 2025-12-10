import React from "react";
import { WarningBanner } from "../../ui/WarningBanner";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { ToggleSwitch } from "../../ui/ToggleSwitch";
import { SettingContainer } from "../../ui/SettingContainer";
import { Button } from "../../ui/Button";
import { Textarea } from "../../ui/Textarea";
import { useSettings } from "../../../hooks/useSettings";
import { commands } from "@/bindings";
import { toast } from "sonner";
import AiModelSelector from "./AiModelSelector";
import { Copy, Loader2 } from "lucide-react";

export const AiEnhancementSettings: React.FC = () => {
  const [ollamaAvailable, setOllamaAvailable] = React.useState(false);
  const [testText, setTestText] = React.useState("");
  const [testResult, setTestResult] = React.useState("");
  const [isTesting, setIsTesting] = React.useState(false);
  const [systemInfo, setSystemInfo] = React.useState<{ total_ram_gb: number } | null>(null);
  
  const { getSetting, updateSetting } = useSettings();
  const aiEnabled = getSetting("ai_enhancement_enabled") ?? false;
  const aiFeatures = getSetting("ai_features") ?? {
    punctuation_and_capitalization: true,
    remove_filler_words: true,
    normalize_numbers: true,
    fix_spelling: true,
  };

  React.useEffect(() => {
    checkOllama();
    loadSystemInfo();
  }, []);

  const checkOllama = async () => {
    try {
      const available = await commands.checkOllamaAvailable();
      setOllamaAvailable(available.status === "ok" ? available.data : false);
    } catch (e) {
      setOllamaAvailable(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const info = await commands.getAiSystemInfo();
      if (info.status === "ok") {
        setSystemInfo(info.data);
      }
    } catch (e) {
      console.error("Failed to load system info:", e);
    }
  };

  const handleTestEnhancement = async () => {
    if (!testText.trim()) {
      toast.error("Please enter some text to test");
      return;
    }

    setIsTesting(true);
    setTestResult("");
    try {
      const result = await commands.testAiEnhancement(testText);
      if (result.status === "ok") {
        setTestResult(result.data);
        toast.success("Enhancement complete!");
      } else {
        toast.error(result.error || "Enhancement failed");
      }
    } catch (e) {
      toast.error("Enhancement failed");
    } finally {
      setIsTesting(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(testResult);
    toast.success("Copied to clipboard!");
  };

  return (
    <>
      <SettingsGroup 
        title={
          <div className="flex items-center gap-2">
            <span>AI Enhancement</span>
            <span className="px-1.5 py-0.5 text-xs font-medium bg-logo-primary/20 text-logo-primary rounded">
              BETA
            </span>
          </div>
        }
      >
        {!ollamaAvailable && (
          <WarningBanner variant="yellow">
            <div>
              <p className="font-semibold mb-1">Ollama Not Detected</p>
              <p>
                AI enhancement requires Ollama to be installed and running.{" "}
                <a 
                  href="https://ollama.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Download Ollama →
                </a>
              </p>
            </div>
          </WarningBanner>
        )}

        <ToggleSwitch
          checked={aiEnabled}
          onChange={(enabled) => updateSetting("ai_enhancement_enabled", enabled)}
          isUpdating={false}
          label="Enable AI Enhancement"
          description="Improve transcriptions with AI-powered corrections"
          descriptionMode="tooltip"
          grouped={true}
          tooltipPosition="bottom"
          disabled={!ollamaAvailable}
        />

        {aiEnabled && (
          <>
            <SettingContainer
              title="AI Model"
              description="Download and manage AI models"
              grouped={true}
            >
              <div className="flex flex-col gap-2">
                <AiModelSelector />
                {systemInfo && (
                  <p className="text-xs text-mid-gray">
                    Your system: {systemInfo.total_ram_gb}GB RAM
                  </p>
                )}
              </div>
            </SettingContainer>

            <div className="border-t border-mid-gray/20 my-2" />

            <ToggleSwitch
              checked={aiFeatures.punctuation_and_capitalization ?? true}
              onChange={(checked) => updateSetting("ai_features", {
                ...aiFeatures,
                punctuation_and_capitalization: checked
              })}
              isUpdating={false}
              label="Punctuation & Capitalization"
              description="Add proper punctuation and sentence casing"
              descriptionMode="tooltip"
              grouped={true}
              tooltipPosition="bottom"
            />

            <ToggleSwitch
              checked={aiFeatures.remove_filler_words ?? true}
              onChange={(checked) => updateSetting("ai_features", {
                ...aiFeatures,
                remove_filler_words: checked
              })}
              isUpdating={false}
              label="Remove Filler Words"
              description="Remove um, uh, like when used as fillers"
              descriptionMode="tooltip"
              grouped={true}
              tooltipPosition="bottom"
            />

            <ToggleSwitch
              checked={aiFeatures.normalize_numbers ?? true}
              onChange={(checked) => updateSetting("ai_features", {
                ...aiFeatures,
                normalize_numbers: checked
              })}
              isUpdating={false}
              label="Normalize Numbers"
              description="Convert spoken numbers to digits (twenty five → 25)"
              descriptionMode="tooltip"
              grouped={true}
              tooltipPosition="bottom"
            />

            <ToggleSwitch
              checked={aiFeatures.fix_spelling ?? true}
              onChange={(checked) => updateSetting("ai_features", {
                ...aiFeatures,
                fix_spelling: checked
              })}
              isUpdating={false}
              label="Fix Spelling"
              description="Correct spelling mistakes and homophones"
              descriptionMode="tooltip"
              grouped={true}
              tooltipPosition="bottom"
            />
          </>
        )}
      </SettingsGroup>

      {aiEnabled && (
        <SettingsGroup title="Test Enhancement">
          <SettingContainer
            title="Try AI Enhancement"
            description="Test how your text will be enhanced"
            grouped={true}
            layout="stacked"
          >
            <div className="space-y-3">
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test enhancement... (e.g., 'um hey like my name is john and i have twenty five dollars')"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleTestEnhancement}
                  disabled={isTesting || !testText.trim()}
                  variant="secondary"
                  size="md"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Enhancement"
                  )}
                </Button>
              </div>
              {testResult && (
                <div className="p-3 bg-mid-gray/10 rounded border border-mid-gray/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-mid-gray">Result:</p>
                    <button
                      onClick={copyResult}
                      className="text-xs text-mid-gray hover:text-text flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <p className="text-sm">{testResult}</p>
                </div>
              )}
            </div>
          </SettingContainer>
        </SettingsGroup>
      )}
    </>
  );
};

