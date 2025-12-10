use serde::{Deserialize, Serialize};
use specta::Type;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SystemInfo {
    pub total_ram_gb: f64,
    pub available_ram_gb: f64,
    pub cpu_cores: usize,
    pub os: String,
}

pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_ram = sys.total_memory() as f64 / 1_073_741_824.0; // Convert bytes to GB
    let available_ram = sys.available_memory() as f64 / 1_073_741_824.0;
    let cpu_cores = sys.cpus().len();

    SystemInfo {
        total_ram_gb: (total_ram * 10.0).round() / 10.0,  // Round to 1 decimal
        available_ram_gb: (available_ram * 10.0).round() / 10.0,
        cpu_cores,
        os: std::env::consts::OS.to_string(),
    }
}

pub fn recommend_ai_model(info: &SystemInfo) -> &'static str {
    // Recommendations based on total RAM
    if info.total_ram_gb < 8.0 {
        // Low RAM systems
        if info.available_ram_gb > 2.0 {
            "gemma2:2b"
        } else {
            "qwen2.5:0.5b"
        }
    } else if info.total_ram_gb < 16.0 {
        // Mid-range systems (8-16GB) - DEFAULT
        "llama3.2:1b"
    } else {
        // High-end systems (16GB+)
        // On high RAM systems, use the best quality model
        "qwen2.5:1.5b"
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AiModelInfo {
    pub id: String,
    pub size_mb: u32,
    pub speed: String,
    pub quality: String,
    pub notes: String,
}

pub fn get_available_models() -> Vec<AiModelInfo> {
    vec![
        AiModelInfo {
            id: "gemma2:2b".to_string(),
            size_mb: 270,
            speed: "Fastest".to_string(),
            quality: "Good".to_string(),
            notes: "Best for low RAM systems (< 8GB)".to_string(),
        },
        AiModelInfo {
            id: "qwen2.5:0.5b".to_string(),
            size_mb: 500,
            speed: "Very Fast".to_string(),
            quality: "Good".to_string(),
            notes: "Ultra lightweight option".to_string(),
        },
        AiModelInfo {
            id: "llama3.2:1b".to_string(),
            size_mb: 1000,
            speed: "Fast".to_string(),
            quality: "Excellent".to_string(),
            notes: "Recommended default - best balance".to_string(),
        },
        AiModelInfo {
            id: "gemma2:1b".to_string(),
            size_mb: 1000,
            speed: "Fast".to_string(),
            quality: "Very Good".to_string(),
            notes: "Alternative 1B model".to_string(),
        },
        AiModelInfo {
            id: "qwen2.5:1.5b".to_string(),
            size_mb: 1500,
            speed: "Moderate".to_string(),
            quality: "Best".to_string(),
            notes: "Highest quality (16GB+ RAM recommended)".to_string(),
        },
    ]
}

