# credentials_exception = HTTPException(
#     status_code=status.HTTP_401_UNAUTHORIZED,
#     detail="Could not validate credentials",
# )

# async def is_user_valid(request: Request):
#     try:
#         token=request.cookies.get("access_token")
#         payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=[os.getenv('JWT_ALGORITHM')])
#         username: str = payload.get("sub")
#         if username is None:
#             raise credentials_exception

#     except InvalidTokenError:
#         raise credentials_exception
    
#     user = get_user(username=username)
#     if user is None:
#         raise credentials_exception
#     return user


# @router.post("/login")
# async def login_for_access_token(formdata: LoginData) -> JSONResponse:
#     print(formdata)
    
#     user = await authenticate_user(formdata.email, formdata.password)


#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect Email or password",
#         )
    
#     access_token_expires = timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')))
#     access_token = create_access_token(
#         data={"sub": str(user["_id"])}, expires_delta=access_token_expires
#     )
#     response = JSONResponse(content={"message": "Successfully logged in!"})
#     response.set_cookie(
#         key="access_token",
#         value=access_token,
#         samesite="Lax",
#         secure=True,
#         httponly=True,
#         expires=datetime.now(timezone.utc) + timedelta(days=60)
#     )
#     return response


# @router.get("/users/me/", response_model=UserModel)
# async def read_users_me(
#     current_user: Annotated[UserModel, Depends(is_user_valid)],
# ):
#     return current_user



# @router.get("/users/me/items/")
# async def read_own_items(
#     current_user: Annotated[User, Depends(get_current_user)],
# ):
#     return [{"item_id": "Foo", "owner": current_user.username}]