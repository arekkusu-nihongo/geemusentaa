import hashlib
import os
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def decrypt(data: bytes, key: bytes) -> bytes:
    nonce = data[:12]
    encrypted = data[12:]

    aes = AESGCM(key)

    return aes.decrypt(
        nonce,
        encrypted,
        None
    )


github_key = hashlib.sha256(
    os.environ["DECRYPT_KEY"].encode("utf-8")
).digest()

double_file = Path("vocab.double.enc").read_bytes()

runtime_file = decrypt(
    double_file,
    github_key
)

Path("vocab.runtime.enc").write_bytes(
    runtime_file
)