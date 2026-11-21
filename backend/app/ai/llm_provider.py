import os
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.database import SessionLocal
from app.models.setting import SystemSetting
from app.core.encryption import decrypt_value

def get_llm_provider() -> BaseChatModel:
    # Fetch from database
    db = SessionLocal()
    try:
        provider_setting = db.query(SystemSetting).filter(SystemSetting.key == "llm_provider").first()
        key_setting = db.query(SystemSetting).filter(SystemSetting.key == "llm_api_key").first()
        base_url_setting = db.query(SystemSetting).filter(SystemSetting.key == "llm_base_url").first()
        model_name_setting = db.query(SystemSetting).filter(SystemSetting.key == "llm_model_name").first()
        
        env_provider = os.getenv("LLM_PROVIDER")
        provider = (
            env_provider
            or (provider_setting.value if provider_setting and provider_setting.value else "gemini")
        ).lower()
        env_api_key = (
            os.getenv("NVIDIA_API_KEY", "")
            if provider == "nvidia"
            else os.getenv("GEMINI_API_KEY", "")
        )
        configured_api_key = decrypt_value(key_setting.value) if key_setting and key_setting.value else ""
        api_key = env_api_key or configured_api_key
        base_url = (
            os.getenv("LLM_BASE_URL")
            or (base_url_setting.value if base_url_setting and base_url_setting.value else None)
        )
        model_name = (
            os.getenv("LLM_MODEL_NAME")
            or (model_name_setting.value if model_name_setting and model_name_setting.value else None)
        )
    finally:
        db.close()
    
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-pro", 
            google_api_key=api_key,
            temperature=0.2
        )
    elif provider == "nvidia":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name or "deepseek-ai/deepseek-v4.1-flash",
            api_key=api_key,
            base_url=base_url or "https://integrate.api.nvidia.com/v1",
            temperature=0.2,
            timeout=120,
            max_retries=0,
            max_tokens=2048,
        )
    elif provider in ["openai", "custom"]:
        from langchain_openai import ChatOpenAI
        # For OpenAI, default to gpt-3.5-turbo if no model name provided
        # For custom, default to an empty string or whatever the backend requires
        default_model = "gpt-3.5-turbo" if provider == "openai" else "local-model"
        
        return ChatOpenAI(
            model=model_name or default_model,
            api_key=api_key or "sk-dummy-key-for-local-models",
            base_url=base_url if provider == "custom" else None,
            temperature=0.2
        )
    
    # Fallback to Gemini
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-pro", 
        google_api_key=api_key,
        temperature=0.2
    )
