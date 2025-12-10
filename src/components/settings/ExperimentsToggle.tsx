import React from "react";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useSettings } from "../../hooks/useSettings";

interface ExperimentsToggleProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const ExperimentsToggle: React.FC<ExperimentsToggleProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const experimentsEnabled = getSetting("experiments_enabled") ?? false;

    return (
      <ToggleSwitch
        checked={experimentsEnabled}
        onChange={(enabled) => updateSetting("experiments_enabled", enabled)}
        isUpdating={isUpdating("experiments_enabled")}
        label="Experiments"
        description="Enable experimental features that are still in development. These features may be unstable or change in future releases."
        descriptionMode={descriptionMode}
        grouped={grouped}
        tooltipPosition="bottom"
      />
    );
  },
);

