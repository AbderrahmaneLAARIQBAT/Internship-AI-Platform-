import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

# Derive a 32-byte URL-safe base64-encoded key from the application's SECRET_KEY
def _get_fernet_key() -> bytes:
    # Hash the SECRET_KEY to ensure it is exactly 32 bytes
    key_hash = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)

_fernet = Fernet(_get_fernet_key())

def encrypt_value(plain_text: str) -> str:
    """Encrypts a string into a Fernet cipher token."""
    if not plain_text:
        return plain_text
    return _fernet.encrypt(plain_text.encode()).decode()

def decrypt_value(cipher_text: str) -> str:
    """Decrypts a Fernet cipher token back into a string."""
    if not cipher_text:
        return cipher_text
    try:
        return _fernet.decrypt(cipher_text.encode()).decode()
    except Exception:
        # If decryption fails (e.g. key rotated or plaintext was stored previously)
        # return the raw text or handle appropriately. For safety, return empty or raise.
        # In this implementation, if it fails decryption, we assume it's corrupt.
        return ""
