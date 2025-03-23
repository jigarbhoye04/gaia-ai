from app.utils.logging_util import get_logger
from celery.utils.log import get_task_logger


llm_logger = get_logger(name="llm", log_file="llm.log")
app_logger = get_logger(name="main", log_file="app.log")
audio_logger = get_logger(name="audio", log_file="audio.log")
goals_logger = get_logger(name="goals", log_file="goals.log")
auth_logger = get_logger(name="auth", log_file="auth.log")
cloudinary_logger = get_logger(name="cloudinary", log_file="cloudinary.log")
mongo_logger = get_logger(name="mongodb", log_file="mongodb.log")
redis_logger = get_logger(name="redis", log_file="redis.log")
calendar_logger = get_logger("calendar", "calendar.log")
chat_logger = get_logger(name="chat", log_file="chat.log")
image_logger = get_logger(name="image", log_file="image.log")
llm_logger = get_logger(name="llm", log_file="llm.log")
notes_logger = get_logger(name="notes", log_file="notes.log")
search_logger = get_logger(name="search", log_file="search.log")
profiler_logger = get_logger(name="profiler", log_file="profiler.log")
general_logger = get_logger(name="general", log_file="general.log")
celery_logger = get_task_logger(__name__)
