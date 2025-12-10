import React from "react";
import { Lightbulb } from "lucide-react";

interface WarningBannerProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "purple" | "yellow" | "blue";
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  children,
  icon,
  variant = "purple",
}) => {
  const variantStyles = {
    purple: "bg-logo-primary/10 border-logo-primary/30 text-logo-primary",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${variantStyles[variant]}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon || <Lightbulb className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
};

