# from asgiref.sync import async_to_sync
# from celery import shared_task

# from app.api.v1.dependencies.oauth_dependencies import get_valid_access_token
# from app.config.loggers import celery_logger as logger
# from app.db.collections import users_collection
# from app.db.redis import get_cache, set_cache
# from app.services.mail_service import (
#     get_gmail_service,
# )


# @shared_task(name="process.email", rate_limit="5/s")
# def process_email(history_id: str, email: str):
#     return async_to_sync(_process_email_async)(history_id, email)


# async def _process_email_async(history_id: str, email: str):
#     try:
#         if not email or not history_id:
#             logger.error("Email address or history ID is missing")
#             return {
#                 "error": "Email address or history ID is missing",
#                 "status": "failed",
#             }

#         logger.info(f"Processing emails for {email} with history ID: {history_id}")

#         history_id, history_found = await _get_history_id(email, history_id)
#         if not history_found:
#             return {"error": "User not found", "status": "failed"}

#         await _update_history_id(email, history_id)

#         access_token, refresh_token, tokens_valid = await _get_tokens(email)
#         if not tokens_valid:
#             return {"error": "Authentication failed", "status": "failed"}

#         messages = await _fetch_messages(access_token, refresh_token, history_id)

#         logger.info(f"Fetched {len(messages.get('history', []))} history items")

#         # TODO: Process the messages here

#         return {
#             "status": "success",
#             "message": "Email history processed successfully",
#             "history_count": len(messages.get("history", [])),
#         }

#     except Exception as e:
#         logger.error(f"Error processing email: {e}", exc_info=True)
#         return {"error": str(e), "status": "failed"}


# async def _get_history_id(email: str, history_id: str) -> tuple[str, bool]:
#     """
#     Retrieve and validate the history ID from cache or database.

#     Args:
#         email: The user's email address
#         history_id: The initial history ID passed to the function

#     Returns:
#         tuple: (history_id, success_flag)
#     """
#     cache_key = f"gmail_history_id:{email}"

#     # Try to get history ID from cache first
#     cached_history_id = await get_cache(cache_key)
#     if cached_history_id:
#         return str(cached_history_id), True

#     # If not in cache, try to get from database
#     user = await users_collection.find_one({"email": email})
#     if not user:
#         logger.error(f"No user found with email: {email}")
#         return "", False

#     db_history_id = user.get("gmail_history_id")
#     return db_history_id or history_id, bool(db_history_id)


# async def _update_history_id(email: str, history_id: str) -> None:
#     """
#     Update the history ID in both database and cache.

#     Args:
#         email: The user's email address
#         history_id: The history ID to update
#     """
#     cache_key = f"gmail_history_id:{email}"

#     # Update in database
#     await users_collection.update_one(
#         {"email": email},
#         {"$set": {"gmail_history_id": history_id}},
#     )

#     # Update in cache
#     await set_cache(cache_key, history_id)


# async def _get_tokens(email: str) -> tuple[str, str, bool]:
#     """
#     Get valid access and refresh tokens for the user.

#     Args:
#         email: The user's email address

#     Returns:
#         tuple: (access_token, refresh_token, success_flag)
#     """
#     # Get refresh token from cache
#     refresh_token = await get_cache(f"refresh_token:{email}")
#     if not refresh_token:
#         logger.error(f"Refresh token not found for email: {email}")
#         return "", "", False

#     # Get access token using the refresh token
#     access_token, _ = await get_valid_access_token(
#         user_email=email,
#         refresh_token=refresh_token,
#     )

#     if not access_token:
#         logger.error(f"Failed to get access token for email: {email}")
#         return "", refresh_token, False

#     return access_token, refresh_token, True


# async def _fetch_messages(
#     access_token: str, refresh_token: str, history_id: str
# ) -> dict:
#     """
#     Fetch messages from Gmail API using the history ID.

#     Args:
#         access_token: The user's access token
#         refresh_token: The user's refresh token
#         history_id: The history ID to use for fetching messages

#     Returns:
#         dict: The messages response from Gmail API
#     """
#     service = get_gmail_service(
#         access_token=access_token,
#         refresh_token=refresh_token,
#     )

#     return (
#         service.users()
#         .history()
#         .list(
#             userId="me",
#             startHistoryId=history_id,
#         )
#         .execute()
#     )


# # @shared_task(name="fetch.last_week_emails")
# # @profile_celery_task()
# # def fetch_last_week_emails(user_dict: dict):
# #     """
# #     Fetch all emails from the last week using pagination and queue them for processing.
# #     Implements rate limiting, logging, and error handling.
# #     """
# #     try:
# #         access_token = user_dict.get("access_token")
# #         if not access_token:
# #             logger.error("Access token is required to fetch emails")
# #             return {"error": "Access token is required"}

# #         refresh_token = user_dict.get("refresh_token")
# #         if not refresh_token:
# #             logger.error("Refresh token is required to fetch emails")
# #             return {"error": "Refresh token is required"}

# #         service = get_gmail_service(
# #             access_token=access_token,
# #             refresh_token=refresh_token,
# #         )

# #         now = datetime.now(timezone.utc)
# #         last_week = now - timedelta(days=7)
# #         query = f"after:{int(last_week.timestamp())}"

# #         all_messages = []
# #         next_page_token = None

# #         logger.info("Fetching emails from Gmail...")

# #         while True:
# #             try:
# #                 results = (
# #                     service.users()
# #                     .messages()
# #                     .list(userId="me", q=query, pageToken=next_page_token)
# #                     .execute()
# #                 )

# #                 if isinstance(results, dict):
# #                     messages = results.get("messages", [])
# #                     all_messages.extend(messages)

# #                     logger.info(
# #                         f"Fetched {len(messages)} messages (Total: {len(all_messages)})"
# #                     )

# #                     next_page_token = results.get("nextPageToken")
# #                     if not next_page_token:
# #                         break
# #                 else:
# #                     logger.error("Unexpected result type from Gmail API")
# #                     break

# #                 time.sleep(3)

# #             except HttpError as e:
# #                 logger.error(f"Gmail API Error: {e}", exc_info=True)
# #                 time.sleep(5)
# #                 continue

# #         if not all_messages:
# #             logger.info("No new emails found in the last week.")
# #             return {"result": "No emails to process."}

# #         detailed_messages = fetch_detailed_messages(service, all_messages)
# #         transformed_messages = [
# #             transform_gmail_message(msg) for msg in detailed_messages
# #         ]

# #         for _, email in enumerate(transformed_messages):
# #             process_email.delay(email, user_dict)

# #         result = f"Queued {len(transformed_messages)} emails for processing."

# #         logger.info(result)

# #         return {
# #             "result": result,
# #             "total_messages": len(all_messages),
# #         }

# #     except Exception as e:
# #         logger.error(f"Unexpected error fetching emails: {e}", exc_info=True)
# #         return {"error": str(e)}
