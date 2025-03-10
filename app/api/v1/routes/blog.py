from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.db.collections import blog_collection
from bson import ObjectId
from fastapi.encoders import jsonable_encoder

router = APIRouter()


# Custom ObjectId type for Pydantic models.
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):  # Accept extra parameter to prevent errors.
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


# Base model for blog posts.
class BlogPostBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    authors: List[str]
    readTime: Optional[str] = None
    category: Optional[str] = None
    content: str


# Model for creating a blog post.
class BlogPostCreate(BlogPostBase):
    slug: str


# Model for updating a blog post.
class BlogPostUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    date: Optional[str]
    authors: Optional[List[str]]
    readTime: Optional[str]
    category: Optional[str]
    content: Optional[str]


# Model representing a blog post as stored in MongoDB.
class BlogPost(BlogPostBase):
    slug: str
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True


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


# @router.get("/dummy", response_model=BlogPost)
# async def insert_dummy_blog():
#     dummy = BlogPostCreate(
#         slug="saas-long-blog-post",
#         title="Scaling Your SaaS Business: The Ultimate Guide",
#         description="A comprehensive guide to scaling your SaaS business from startup to enterprise success.",
#         date="April 1, 2025",
#         authors=["Aryan Randeriya", "Sankalpa Acharya", "Dhruv Maradiya"],
#         readTime="15 min read",
#         category="SaaS",
#         content="""# Scaling Your SaaS Business: The Ultimate Guide

# In today's digital era, scaling a SaaS business is not just about acquiring new customers; it's about building a resilient, adaptable platform that grows with your customers' needs. In this ultimate guide, we delve deep into the strategies, technologies, and processes that drive sustainable growth in the SaaS industry.

# ## Understanding the SaaS Ecosystem

# The Software-as-a-Service model has disrupted traditional software distribution. With cloud-based solutions, businesses can access powerful tools without the upfront costs of traditional software licenses. However, this shift also brings challenges in terms of scalability, performance, and customer retention.

# ## Building a Robust Technology Infrastructure

# At the heart of any successful SaaS platform is a reliable, scalable infrastructure. Investing in cloud services, distributed databases, and a microservices architecture ensures that your platform can handle increased demand and deliver a seamless user experience.

# - **Cloud Platforms:** Leverage providers like AWS, Google Cloud, or Azure for scalable resources.
# - **Database Scalability:** Use distributed databases and caching mechanisms to manage high traffic.
# - **Monitoring & Logging:** Implement robust monitoring tools to detect and resolve issues proactively.

# ## Prioritizing Customer Success

# Customer success is the lifeblood of any SaaS business. A proactive support team, combined with an intuitive onboarding process, can significantly reduce churn and drive long-term satisfaction. Focus on building strong relationships through regular communication, feedback loops, and personalized support.

# ## Data-Driven Decision Making

# Successful SaaS companies rely on data to drive every aspect of their business, from product development to marketing. Utilize analytics tools to track user behavior, measure performance, and identify growth opportunities. Data insights help fine-tune strategies and make informed decisions that propel your business forward.

# ## Marketing and Sales Strategies

# Effective marketing and sales strategies are crucial for scaling your SaaS business. Invest in digital marketing, content creation, and SEO to attract new customers. Complement these efforts with a knowledgeable sales team that can communicate your product's value to potential clients.

# ## Innovation and Continuous Improvement

# The technology landscape is constantly evolving. To stay ahead, your SaaS platform must be agile and open to innovation. Regularly update your product, experiment with new features, and listen to customer feedback. This commitment to continuous improvement not only enhances your product but also builds trust with your user base.

# ## Conclusion

# Scaling a SaaS business is a multifaceted endeavor that requires a delicate balance of technology, customer focus, and strategic planning. By investing in robust infrastructure, prioritizing customer success, and leveraging data for decision-making, you can build a platform that not only grows with your customers but also sets you apart in a competitive market.
# """,
#     )
#     existing = await blog_collection.find_one({"slug": dummy.slug})
#     if existing:
#         return existing
#     result = await blog_collection.insert_one(jsonable_encoder(dummy))
#     created = await blog_collection.find_one({"_id": result.inserted_id})
#     return created
