import React from "react";
import { Lightbulb, Github, Heart } from "lucide-react";
import { Button } from "../ui/Button";

interface CompletionScreenProps {
  hasAiEnabled: boolean;
  onComplete: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  hasAiEnabled,
  onComplete,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-logo-primary/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-logo-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            Welcome to Handy{hasAiEnabled ? " Plus" : ""}!
          </h1>
          <p className="text-lg text-mid-gray">
            Thank you for trying Handy
          </p>
        </div>

        {/* Handy Plus Badge */}
        {hasAiEnabled && (
          <div className="bg-logo-primary/10 border border-logo-primary/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-logo-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-logo-primary mb-2">
                  You're using Handy Plus
                </h3>
                <p className="text-sm text-mid-gray">
                  AI-enhanced transcriptions with local processing. Your
                  transcriptions will be automatically improved with smart
                  punctuation, spelling corrections, and more.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-background border border-mid-gray/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">What you get:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-logo-primary">✓</span>
              <span>100% local, privacy-first transcription</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-logo-primary">✓</span>
              <span>No cloud, no tracking, no data collection</span>
            </li>
            {hasAiEnabled && (
              <li className="flex items-start gap-3">
                <span className="text-logo-primary">✓</span>
                <span>AI-powered text corrections (completely local)</span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <span className="text-logo-primary">✓</span>
              <span>Fast and accurate speech-to-text</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-logo-primary">✓</span>
              <span>Works completely offline</span>
            </li>
          </ul>
        </div>

        {/* Open Source Section */}
        <div className="bg-mid-gray/5 border border-mid-gray/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Github className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Handy is open source
              </h3>
              <p className="text-sm text-mid-gray mb-3">
                Built by the community, for the community. View the code,
                contribute, or report issues on GitHub.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  window.open("https://github.com/cjpais/Handy", "_blank")
                }
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <p className="text-sm text-mid-gray mb-3">
            Enjoying Handy? Consider supporting development
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              window.open("https://handy.computer/donate", "_blank")
            }
          >
            <Heart className="w-4 h-4 mr-2" />
            Support Handy
          </Button>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            className="w-full text-lg py-4"
          >
            Start Using Handy
          </Button>
        </div>
      </div>
    </div>
  );
};

