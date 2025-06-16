from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.models.blog_models import BlogPostCreate, BlogPostUpdate, BlogPost
from app.services.blog_service import BlogService

router = APIRouter()


@router.get("/blogs", response_model=List[BlogPost])
async def get_blogs(
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    limit: int = Query(
        20, ge=1, le=100, description="Number of blogs per page (1-100)"
    ),
    search: Optional[str] = Query(
        None, description="Search query for title, content, or tags"
    ),
    include_content: bool = Query(
        False,
        description="Include blog content in response (for list views, set to false for better performance)",
    ),
):
    """Get all blog posts with pagination and populated author details."""
    if search:
        return await BlogService.search_blogs(
            search, page=page, limit=limit, include_content=include_content
        )
    return await BlogService.get_all_blogs(
        page=page, limit=limit, include_content=include_content
    )


@router.get("/blogs/{slug}", response_model=BlogPost)
async def get_blog(slug: str):
    """Get a specific blog post with populated author details."""
    return await BlogService.get_blog_by_slug(slug)


@router.post("/blogs", response_model=BlogPost, status_code=status.HTTP_201_CREATED)
async def create_blog(blog: BlogPostCreate):
    """Create a new blog post."""
    return await BlogService.create_blog(blog)


@router.put("/blogs/{slug}", response_model=BlogPost)
async def update_blog(slug: str, blog: BlogPostUpdate):
    """Update a blog post."""
    return await BlogService.update_blog(slug, blog)


@router.delete("/blogs/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(slug: str):
    """Delete a blog post."""
    await BlogService.delete_blog(slug)
    return


@router.get("/blogs/count", response_model=dict)
async def get_blog_count():
    """Get total count of blog posts."""
    count = await BlogService.get_blog_count()
    return {"count": count}
