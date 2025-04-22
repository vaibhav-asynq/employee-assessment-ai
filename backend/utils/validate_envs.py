from env_variables import validate_env_vars


def validate_required_env():
    required_envs = [
        "ANTHROPIC_API_KEY",
        # auth
        "CLERK_JWKS_URL",
        # db
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_PASSWORD",
        "DB_USER",
    ]
    validate_env_vars(required_envs, raise_error=True)
