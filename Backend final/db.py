import sqlite3
import os
import hashlib
import secrets
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "valenba.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa las tablas de usuarios y favoritos si no existen."""
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                station_id TEXT NOT NULL,
                custom_name TEXT,
                added_at TEXT NOT NULL,
                UNIQUE(user_email, station_id)
            );
        """)
    conn.close()

def _hash_password(password: str, salt: str) -> str:
    """Genera hash seguro PBKDF2-HMAC-SHA256."""
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations=100000
    ).hex()

def register_user(name: str, email: str, password: str):
    """Registra un nuevo usuario con contraseña cifrada."""
    email_clean = email.strip().lower()
    name_clean = name.strip()
    
    salt = secrets.token_hex(16)
    pwd_hash = _hash_password(password.strip(), salt)
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO users (name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
                (name_clean, email_clean, pwd_hash, salt, created_at)
            )
        return {
            "name": name_clean,
            "email": email_clean,
            "created_at": created_at
        }
    except sqlite3.IntegrityError:
        raise ValueError("Ya existe una cuenta con este correo electrónico.")
    finally:
        conn.close()

def authenticate_user(email: str, password: str):
    """Autentica las credenciales de un usuario."""
    email_clean = email.strip().lower()
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,)).fetchone()
    conn.close()

    if not user:
        return None

    expected_hash = _hash_password(password.strip(), user["salt"])
    if secrets.compare_digest(user["password_hash"], expected_hash):
        return {
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    return None

def get_user_favorites(email: str):
    """Devuelve la lista de estaciones favoritas del usuario."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT station_id, custom_name FROM user_favorites WHERE user_email = ? ORDER BY id DESC",
        (email.strip().lower(),)
    ).fetchall()
    conn.close()
    return [{"id": r["station_id"], "customName": r["custom_name"]} for r in rows]

def toggle_user_favorite(email: str, station_id: str, custom_name: str = None):
    """Añade o elimina una estación de favoritos."""
    email_clean = email.strip().lower()
    station_clean = str(station_id).strip()
    conn = get_connection()
    with conn:
        exists = conn.execute(
            "SELECT id FROM user_favorites WHERE user_email = ? AND station_id = ?",
            (email_clean, station_clean)
        ).fetchone()

        if exists:
            conn.execute(
                "DELETE FROM user_favorites WHERE user_email = ? AND station_id = ?",
                (email_clean, station_clean)
            )
            is_favorite = False
        else:
            conn.execute(
                "INSERT INTO user_favorites (user_email, station_id, custom_name, added_at) VALUES (?, ?, ?, ?)",
                (email_clean, station_clean, custom_name, datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
            )
            is_favorite = True
    conn.close()
    return is_favorite
