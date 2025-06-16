from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.encoders import jsonable_encoder
from app.db.collections import blog_collection, team_collection
from app.models.blog_models import BlogPostCreate, BlogPostUpdate, BlogPost

router = APIRouter()


async def populate_blog_authors(blogs):
    """Populate blog authors with team member data."""
    for blog in blogs:
        if blog.get("authors"):
            author_details = []
            for author_id in blog["authors"]:
                team_member = await team_collection.find_one({"_id": author_id})
                if team_member:
                    author_details.append({
                        "id": str(team_member["_id"]),
                        "name": team_member["name"],
                        "role": team_member["role"],
                        "avatar": team_member.get("avatar"),
                        "email": team_member["email"],
                        "linkedin": team_member.get("linkedin"),
                        "twitter": team_member.get("twitter"),
                        "bio": team_member.get("bio")
                    })
                else:
                    # Fallback for string author names
                    author_details.append({"name": author_id, "role": "Author"})
            blog["author_details"] = author_details
    return blogs


@router.get("/blogs", response_model=List[BlogPost])
async def get_blogs():
    """Get all blog posts with populated author details."""
    blogs = await blog_collection.find().to_list(100)
    blogs = await populate_blog_authors(blogs)
    return blogs


@router.get("/blogs/{slug}", response_model=BlogPost)
async def get_blog(slug: str):
    """Get a specific blog post with populated author details."""
    blog = await blog_collection.find_one({"slug": slug})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    blogs = await populate_blog_authors([blog])
    return blogs[0]


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
