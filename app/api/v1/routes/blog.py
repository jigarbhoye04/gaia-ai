from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.db.collections import blog_collection
from app.models.blog_models import BlogPostCreate, BlogPostUpdate, BlogPost

router = APIRouter()


@router.get("/blogs", response_model=List[BlogPost])
async def get_blogs():
    blogs = await blog_collection.find().to_list(100)
    return blogs


@router.get("/blogs/{slug}", response_model=BlogPost)
async def get_blog(slug: str):
    blog = await blog_collection.find_one({"slug": slug})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog


@router.post("/blogs", response_model=BlogPost, status_code=status.HTTP_201_CREATED)
async def create_blog(blog: BlogPostCreate):
    blog_data = jsonable_encoder(blog)
    result = await blog_collection.insert_one(blog_data)
    created_blog = await blog_collection.find_one({"_id": result.inserted_id})
    return created_blog


@router.put("/blogs/{slug}", response_model=BlogPost)
async def update_blog(slug: str, blog: BlogPostUpdate):
    update_data = {k: v for k, v in blog.dict().items() if v is not None}
    if update_data:
        result = await blog_collection.update_one({"slug": slug}, {"$set": update_data})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Blog post not found")
    updated_blog = await blog_collection.find_one({"slug": slug})
    if not updated_blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return updated_blog


@router.delete("/blogs/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(slug: str):
    result = await blog_collection.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return
