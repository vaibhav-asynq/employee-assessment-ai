import os

from dotenv import load_dotenv

load_dotenv()

## ENVIRONMENT VARIABLES
RELOAD_MODE = os.getenv("RELOAD_MODE", False)  # true || false
if RELOAD_MODE in ["yes", "Yes", "YES", "true", "True", "TRUE"]:
    RELOAD_MODE = True
else:
    RELOAD_MODE = False

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# auth
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

# database
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT"))
DB_NAME = os.getenv("DB_NAME")
DB_USER =os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")


# VALIDATOR FUNCTION
def validate_env_vars(
    required_vars: list[str],
    raise_error: bool = False,
    logMsg: str = "Missing required environment variables:",
):
    """
    Validate that required environment variables are set.
    Returns:
        bool: True if all required variables are set, False otherwise
    """
    missing_vars = []
    for var in required_vars:
        if globals().get(var) is None:
            missing_vars.append(var)

    if missing_vars:
        msg = f"{logMsg} {', '.join(missing_vars)}"
        print(msg)
        if raise_error:
            raise Exception(msg)
        return False
    return True
