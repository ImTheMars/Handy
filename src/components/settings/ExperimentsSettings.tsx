import React from "react";
import { WarningBanner } from "../ui/WarningBanner";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingContainer } from "../ui/SettingContainer";
import { Button } from "../ui/Button";
import { useSettings } from "../../hooks/useSettings";
import { commands } from "@/bindings";
import { toast } from "sonner";

export const ExperimentsSettings: React.FC = () => {
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

  if (!developerMode) {
    return (
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <WarningBanner variant="purple">
          <div>
            <p className="font-semibold mb-1">🧪 Experiments</p>
            <p>
              Developer mode is not enabled. Set the <code className="bg-mid-gray/20 px-1 rounded">HANDY_DEV=TRUE</code> environment variable to access developer tools.
            </p>
          </div>
        </WarningBanner>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
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
    </div>
  );
};
