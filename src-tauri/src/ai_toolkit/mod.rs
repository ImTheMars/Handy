pub mod ollama_client;
pub mod system_info;

pub use ollama_client::OllamaClient;
pub use system_info::{get_available_models, get_system_info, recommend_ai_model, AiModelInfo, SystemInfo};

