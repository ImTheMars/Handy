use crate::ai_toolkit::{get_available_models, get_system_info, recommend_ai_model, AiModelInfo, SystemInfo};
use crate::managers::ai_enhancement::AiEnhancementManager;
use crate::settings::{get_settings, write_settings, AiFeatures};
use std::sync::Arc;
use tauri::{AppHandle, State};
use tokio::sync::Mutex;

type SharedAiManager = Arc<Mutex<AiEnhancementManager>>;

#[tauri::command]
#[specta::specta]
pub async fn get_ai_system_info() -> Result<SystemInfo, String> {
    Ok(get_system_info())
}

#[tauri::command]
#[specta::specta]
pub async fn get_recommended_ai_model() -> Result<String, String> {
    let system_info = get_system_info();
    Ok(recommend_ai_model(&system_info).to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_available_ai_models() -> Result<Vec<AiModelInfo>, String> {
    Ok(get_available_models())
}

#[tauri::command]
#[specta::specta]
pub async fn check_ollama_available(
    ai_manager: State<'_, SharedAiManager>,
) -> Result<bool, String> {
    let manager = ai_manager.lock().await;
    Ok(manager.is_available().await)
}

#[tauri::command]
#[specta::specta]
pub async fn list_ollama_models(
    ai_manager: State<'_, SharedAiManager>,
) -> Result<Vec<String>, String> {
    let manager = ai_manager.lock().await;
    manager
        .list_models()
        .await
        .map_err(|e| format!("Failed to list models: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn pull_ollama_model(
    app: AppHandle,
    ai_manager: State<'_, SharedAiManager>,
    model: String,
) -> Result<(), String> {
    let manager = ai_manager.lock().await;
    manager
        .pull_model(&model, &app)
        .await
        .map_err(|e| format!("Failed to pull model: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn delete_ollama_model(
    ai_manager: State<'_, SharedAiManager>,
    model: String,
) -> Result<(), String> {
    let manager = ai_manager.lock().await;
    manager
        .delete_model(&model)
        .await
        .map_err(|e| format!("Failed to delete model: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn test_ai_enhancement(
    ai_manager: State<'_, SharedAiManager>,
    app_handle: AppHandle,
    text: String,
) -> Result<String, String> {
    let settings = get_settings(&app_handle);
    
    if !settings.ai_enhancement_enabled {
        return Err("AI enhancement is not enabled".to_string());
    }

    let model = settings
        .ai_selected_model
        .ok_or("No AI model selected")?;

    let features = AiFeatures {
        punctuation_and_capitalization: settings.ai_features.punctuation_and_capitalization,
        remove_filler_words: settings.ai_features.remove_filler_words,
        normalize_numbers: settings.ai_features.normalize_numbers,
        fix_spelling: settings.ai_features.fix_spelling,
    };

    let mut manager = ai_manager.lock().await;
    manager
        .test_enhancement(&text, &model, &features)
        .await
        .map_err(|e| format!("Enhancement failed: {}", e))
}

// Settings commands
#[tauri::command]
#[specta::specta]
pub fn change_ai_enhancement_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut settings = get_settings(&app);
    settings.ai_enhancement_enabled = enabled;
    write_settings(&app, settings);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn change_ai_model(app: AppHandle, model: String) -> Result<(), String> {
    let mut settings = get_settings(&app);
    settings.ai_selected_model = Some(model);
    write_settings(&app, settings);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn change_ai_features(
    app: AppHandle,
    features: AiFeatures,
) -> Result<(), String> {
    let mut settings = get_settings(&app);
    settings.ai_features = features;
    write_settings(&app, settings);
    Ok(())
}

