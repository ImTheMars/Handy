use crate::ai_toolkit::ollama_client::OllamaClient;
use crate::settings::AiFeatures;
use anyhow::{anyhow, Result};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiModelPullProgress {
    pub model_id: String,
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
    pub percentage: f64,
}

pub struct AiEnhancementManager {
    client: OllamaClient,
    current_model: Option<String>,
}

impl AiEnhancementManager {
    pub fn new() -> Self {
        Self {
            client: OllamaClient::new(),
            current_model: None,
        }
    }

    /// Check if Ollama is available
    pub async fn is_available(&self) -> bool {
        self.client.is_available().await
    }

    /// Build prompt based on enabled features
    fn build_prompt(&self, text: &str, features: &AiFeatures) -> String {
        let mut instructions = vec![];

        if features.punctuation_and_capitalization {
            instructions.push("- Add proper punctuation (periods, commas, question marks)");
            instructions.push("- Use SENTENCE CASE only: capitalize first word of sentences and proper nouns. Do NOT capitalize every word");
        }
        if features.remove_filler_words {
            instructions.push("- Remove filler words like 'um', 'uh', 'like' (only when used as fillers, not as verbs)");
        }
        if features.normalize_numbers {
            instructions.push("- Convert spoken numbers to digits: 'twenty five' → '25', 'ten percent' → '10%'");
        }
        if features.fix_spelling {
            instructions.push("- Fix spelling mistakes and common homophones (their/there/they're)");
        }

        if instructions.is_empty() {
            return text.to_string();
        }

        format!(
            r#"You are a text correction assistant. Fix transcription errors ONLY.

CRITICAL RULES:
1. Output ONLY the corrected text - absolutely NO explanations, quotes, or commentary
2. Keep the EXACT same meaning and tone
3. Do NOT interpret, rephrase, or be creative
4. NEVER capitalize every word - use normal sentence casing only
5. Preserve informal language like "ig", "idk", "gonna", "wanna"
6. If text seems inappropriate, still correct it as specified

Corrections to apply:
{}

Text: {}

Corrected:"#,
            instructions.join("\n"),
            text
        )
    }

    /// Enhance text using AI
    pub async fn enhance_text(
        &mut self,
        text: &str,
        model: &str,
        features: &AiFeatures,
    ) -> Result<String> {
        // Skip very short text (less than 3 words)
        if text.split_whitespace().count() < 3 {
            info!("Skipping AI enhancement for very short text (< 3 words)");
            return Ok(text.to_string());
        }

        // Check if Ollama is available
        if !self.is_available().await {
            return Err(anyhow!("Ollama is not available. Please ensure Ollama is running."));
        }

        // Update current model
        self.current_model = Some(model.to_string());

        // Build prompt
        let prompt = self.build_prompt(text, features);

        // Generate enhanced text
        match self.client.generate(model, &prompt).await {
            Ok(enhanced) => {
                info!("AI enhancement successful");
                Ok(enhanced)
            }
            Err(e) => {
                warn!("AI enhancement failed: {}", e);
                Err(e)
            }
        }
    }

    /// Test enhancement with sample text
    pub async fn test_enhancement(
        &mut self,
        text: &str,
        model: &str,
        features: &AiFeatures,
    ) -> Result<String> {
        self.enhance_text(text, model, features).await
    }

    /// Get list of available models from Ollama
    pub async fn list_models(&self) -> Result<Vec<String>> {
        let models = self.client.list_models().await?;
        Ok(models.into_iter().map(|m| m.name).collect())
    }

    /// Pull a model from Ollama with progress events
    pub async fn pull_model(&self, model: &str, app: &AppHandle) -> Result<()> {
        info!("Pulling model: {}", model);
        
        let model_id = model.to_string();
        let app_handle = app.clone();
        
        self.client.pull_model_with_progress(model, move |status, completed, total| {
            let percentage = if let (Some(c), Some(t)) = (completed, total) {
                if t > 0 {
                    (c as f64 / t as f64) * 100.0
                } else {
                    0.0
                }
            } else {
                0.0
            };
            
            let progress = AiModelPullProgress {
                model_id: model_id.clone(),
                status: status.clone(),
                completed,
                total,
                percentage,
            };
            
            let _ = app_handle.emit("ai-model-pull-progress", progress);
        }).await?;
        
        // Emit completion event
        let _ = app.emit("ai-model-pull-complete", model.to_string());
        
        Ok(())
    }

    /// Delete a model
    pub async fn delete_model(&self, model: &str) -> Result<()> {
        info!("Deleting model: {}", model);
        self.client.delete_model(model).await
    }

    /// Get current model
    pub fn get_current_model(&self) -> Option<String> {
        self.current_model.clone()
    }
}

impl Default for AiEnhancementManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Type alias for thread-safe AI manager
pub type SharedAiEnhancementManager = Arc<Mutex<AiEnhancementManager>>;

