"""
Encryption utilities for sensitive data like API keys.
Uses Fernet (symmetric encryption) from cryptography library.
"""
from cryptography.fernet import Fernet
import base64
import hashlib
from core.config import CONFIG


def _get_fernet_key() -> bytes:
    """
    Generate a Fernet-compatible key from the ENCRYPTION_KEY in config.
    Fernet requires a 32-byte base64-encoded key.
    """
    # Use SHA256 to get a consistent 32-byte key from any length string
    key_bytes = hashlib.sha256(CONFIG.ENCRYPTION_KEY.encode()).digest()
    # Encode to base64 for Fernet
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for storage in the database.
    
    Args:
        api_key: The plaintext API key to encrypt
        
    Returns:
        Encrypted API key as a string (base64 encoded)
    """
    if not api_key:
        return None
    
    fernet = Fernet(_get_fernet_key())
    encrypted_bytes = fernet.encrypt(api_key.encode())
    return encrypted_bytes.decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key retrieved from the database.
    
    Args:
        encrypted_key: The encrypted API key from database
        
    Returns:
        Decrypted API key as plaintext string
    """
    if not encrypted_key:
        return None
    
    fernet = Fernet(_get_fernet_key())
    decrypted_bytes = fernet.decrypt(encrypted_key.encode())
    return decrypted_bytes.decode()

