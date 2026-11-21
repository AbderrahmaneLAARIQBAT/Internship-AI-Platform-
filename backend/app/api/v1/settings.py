from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.setting import SystemSetting
from app.api.deps import get_current_user, require_admin

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str
    description: str | None
    
    model_config = {"from_attributes": True}

from app.core.encryption import encrypt_value

@router.get("/", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    """Fetch all public/accessible system settings."""
    settings = db.query(SystemSetting).all()
    # Mask sensitive fields before returning to frontend
    response_list = []
    for s in settings:
        s_dict = {"key": s.key, "value": s.value, "description": s.description}
        if s.key == "llm_api_key" and s.value:
            s_dict["value"] = "sk-" + "*" * 12
        response_list.append(s_dict)
    return response_list

@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str, 
    data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    """Update a specific system setting."""
    # Encrypt if it's an API key
    if key == "llm_api_key" and data.value and not data.value.startswith("sk-************"):
        data.value = encrypt_value(data.value)
    
    # If the user tries to save the masked string, ignore it (they didn't change it)
    if key == "llm_api_key" and data.value.startswith("sk-************"):
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        return {"key": setting.key, "value": "sk-************", "description": setting.description}

    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        # Create it if it doesn't exist
        setting = SystemSetting(key=key, value=data.value, description="Auto-created setting")
        db.add(setting)
    else:
        setting.value = data.value
    
    db.commit()
    db.refresh(setting)
    
    # Mask response if needed
    resp_value = setting.value
    if key == "llm_api_key" and resp_value:
        resp_value = "sk-" + "*" * 12
        
    return {"key": setting.key, "value": resp_value, "description": setting.description}
