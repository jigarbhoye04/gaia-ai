from passlib.context import CryptContext
from config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI
GOOGLE_CALLBACK_URL = settings.HOST + "/api/v1/oauth/google/callback"


# oauth = OAuth()

# Register the Google OAuth client.
# Authlib will automatically handle state validation for CSRF protection.
# oauth.register(
#     name="google",
#     client_id=GOOGLE_CLIENT_ID,
#     client_secret=GOOGLE_CLIENT_SECRET,
#     access_token_url=GOOGLE_TOKEN_URL,
#     access_token_params=None,
#     authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
#     authorize_params=None,
#     api_base_url="https://www.googleapis.com/oauth2/v3/",
#     client_kwargs={"scope": "openid email profile"},
# )

# oauth.register(
#     name="google",
#     client_id=GOOGLE_CLIENT_ID,
#     client_secret=GOOGLE_CLIENT_SECRET,
#     server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
#     client_kwargs={"scope": "openid email profile"},
# )
