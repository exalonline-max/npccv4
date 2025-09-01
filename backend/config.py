import os

class Settings:
    APP_SECRET = os.getenv("APP_SECRET", "change-me")
    DATABASE_URL = os.getenv("DATABASE_URL", "")

    # Clerk
    CLERK_ISSUER = os.getenv("CLERK_ISSUER", "")
    CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
    # Optional alternate JWKS URL to tolerate short migrations / rotated projects
    CLERK_JWKS_URL_ALT = os.getenv("CLERK_JWKS_URL_ALT", "")

    # Ably
    ABLY_API_KEY = os.getenv("ABLY_API_KEY", "")

settings = Settings()
