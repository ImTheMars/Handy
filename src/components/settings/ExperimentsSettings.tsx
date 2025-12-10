import React from "react";
import { WarningBanner } from "../ui/WarningBanner";
import { SettingsGroup } from "../ui/SettingsGroup";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { SettingContainer } from "../ui/SettingContainer";
import { Button } from "../ui/Button";
import { useSettings } from "../../hooks/useSettings";
import { commands } from "@/bindings";
import { toast } from "sonner";

export const ExperimentsSettings: React.FC = () => {
  // Placeholder state for experimental features
  const [exampleFeature1, setExampleFeature1] = React.useState(false);
  const [exampleFeature2, setExampleFeature2] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  
  const { getSetting } = useSettings();
  const developerMode = getSetting("developer_mode") ?? false;

  const handleResetOnboarding = async () => {
    if (!developerMode) {
      toast.error("Developer mode is not enabled");
      return;
    }

    const confirmed = confirm(
      "This will delete all downloaded models and restart the onboarding flow. Are you sure?"
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      await commands.resetOnboarding();
      toast.success("Onboarding reset! Reloading...");
      // Reload the app after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
      toast.error("Failed to reset onboarding");
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <WarningBanner variant="purple">
        <div>
          <p className="font-semibold mb-1">⚠️ Experimental Features</p>
          <p>
            These features are still in development and not meant for production
            use. They may be unstable, change without notice, or be removed in
            future releases. Use at your own risk.
          </p>
        </div>
      </WarningBanner>

      <SettingsGroup title="Experimental Features">
        <ToggleSwitch
          checked={exampleFeature1}
          onChange={setExampleFeature1}
          isUpdating={false}
          label="Example Feature 1"
          description="This is a placeholder experimental feature. It doesn't do anything yet."
          descriptionMode="tooltip"
          grouped={true}
          tooltipPosition="bottom"
        />
        <ToggleSwitch
          checked={exampleFeature2}
          onChange={setExampleFeature2}
          isUpdating={false}
          label="Example Feature 2"
          description="Another placeholder experimental feature for demonstration purposes."
          descriptionMode="tooltip"
          grouped={true}
          tooltipPosition="bottom"
        />
      </SettingsGroup>

      {developerMode && (
        <>
          <WarningBanner variant="yellow">
            <div>
              <p className="font-semibold mb-1">🔧 Developer Mode Active</p>
              <p>
                Developer mode is enabled via the HANDY_DEV environment variable.
                Additional development tools are available below.
              </p>
            </div>
          </WarningBanner>

          <SettingsGroup title="Developer Tools">
            <SettingContainer
              title="Reset Onboarding"
              description="Delete all models and restart the onboarding flow. Useful for testing the first-run experience."
              grouped={true}
              layout="stacked"
            >
              <Button
                variant="secondary"
                size="md"
                onClick={handleResetOnboarding}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Reset Onboarding"}
              </Button>
            </SettingContainer>
          </SettingsGroup>
        </>
      )}
    </div>
  );
};

