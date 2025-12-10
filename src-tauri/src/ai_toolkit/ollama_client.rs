use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use specta::Type;

const OLLAMA_BASE_URL: &str = "http://localhost:11434";

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaGenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaOptions {
    temperature: f32,
    num_predict: i32,
}

#[derive(Debug, Clone, Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

#[derive(Debug, Clone, Deserialize)]
struct OllamaListResponse {
    models: Vec<OllamaModelInfo>,
}

#[derive(Debug, Clone, Deserialize)]
struct OllamaModelInfo {
    name: String,
    size: u64,
    modified_at: String,
}

pub struct OllamaClient {
    base_url: String,
    client: reqwest::Client,
}

impl OllamaClient {
    pub fn new() -> Self {
        Self {
            base_url: OLLAMA_BASE_URL.to_string(),
            client: reqwest::Client::new(),
        }
    }

    /// Check if Ollama is running
    pub async fn is_available(&self) -> bool {
        self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await
            .is_ok()
    }

    /// List all downloaded models
    pub async fn list_models(&self) -> Result<Vec<OllamaModel>> {
        let response = self
            .client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await?
            .json::<OllamaListResponse>()
            .await?;

        Ok(response
            .models
            .into_iter()
            .map(|m| OllamaModel {
                name: m.name,
                size: m.size,
                modified_at: m.modified_at,
            })
            .collect())
    }

    /// Generate text completion
    pub async fn generate(&self, model: &str, prompt: &str) -> Result<String> {
        let request = OllamaGenerateRequest {
            model: model.to_string(),
            prompt: prompt.to_string(),
            stream: false,
            options: OllamaOptions {
                temperature: 0.1,  // Low temperature for consistent corrections
                num_predict: 512,  // Limit output length
            },
        };

        let response = self
            .client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
            .map_err(|e| anyhow!("Failed to generate: {}", e))?;

        if !response.status().is_success() {
            return Err(anyhow!("Ollama returned error: {}", response.status()));
        }

        let result = response
            .json::<OllamaGenerateResponse>()
            .await
            .map_err(|e| anyhow!("Failed to parse response: {}", e))?;

        Ok(result.response.trim().to_string())
    }

    /// Pull a model from Ollama library with progress callback
    pub async fn pull_model_with_progress<F>(&self, model: &str, progress_callback: F) -> Result<()>
    where
        F: Fn(String, Option<u64>, Option<u64>) + Send + 'static,
    {
        use futures_util::StreamExt;
        
        #[derive(Serialize)]
        struct PullRequest {
            name: String,
        }

        #[derive(Deserialize)]
        struct PullProgress {
            status: String,
            #[serde(default)]
            completed: Option<u64>,
            #[serde(default)]
            total: Option<u64>,
        }

        let request = PullRequest {
            name: model.to_string(),
        };

        let response = self
            .client
            .post(format!("{}/api/pull", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to pull model: {}", response.status()));
        }

        // Stream the response and report progress
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let bytes = chunk?;
            // Try to parse each line as JSON
            if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                for line in text.lines() {
                    if let Ok(progress) = serde_json::from_str::<PullProgress>(line) {
                        progress_callback(progress.status, progress.completed, progress.total);
                    }
                }
            }
        }

        // Give Ollama a moment to finalize
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        Ok(())
    }

    /// Pull a model from Ollama library (simple version without progress)
    pub async fn pull_model(&self, model: &str) -> Result<()> {
        self.pull_model_with_progress(model, |_status, _completed, _total| {
            // No-op callback
        }).await
    }

    /// Delete a model
    pub async fn delete_model(&self, model: &str) -> Result<()> {
        #[derive(Serialize)]
        struct DeleteRequest {
            name: String,
        }

        let request = DeleteRequest {
            name: model.to_string(),
        };

        let response = self
            .client
            .delete(format!("{}/api/delete", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to delete model: {}", response.status()));
        }

        Ok(())
    }
}

impl Default for OllamaClient {
    fn default() -> Self {
        Self::new()
    }
}

