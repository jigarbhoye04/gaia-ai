import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Calendar, ChevronLeft } from "lucide-react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { useParams } from "next/navigation";
import Link from "next/link";

const blogs = [
  {
    slug: "introducing-our-new-api",
    title: "Introducing Our New API: Build Better Integrations",
    description:
      "Learn how our new API can help you build better integrations with your existing tools and workflows.",
    date: "March 2, 2025",
    authors: ["Sarah Johnson", "John Doe"],
    readTime: "4 min read",
    category: "Product",
    content: `
      <p>Today, we're excited to announce the launch of our new API, designed to make integrations easier and more powerful than ever before.</p>
      <h2>Why We Built This</h2>
      <p>We've heard from many of you that integrations are critical to your workflow. You want to connect our platform with the other tools you use daily. Our new API makes this possible with a clean, RESTful interface and comprehensive documentation.</p>
      <h2>Key Features</h2>
      <ul>
        <li>RESTful endpoints for all core functionality</li>
        <li>Webhook support for real-time updates</li>
        <li>OAuth 2.0 authentication</li>
        <li>Rate limits that scale with your plan</li>
        <li>Detailed error messages and logging</li>
      </ul>
      <h2>Getting Started</h2>
      <p>To get started with our new API, visit the <a href="#">Developer Portal</a> and create your API keys. We've also prepared several sample applications to help you understand how to use the API effectively.</p>
      <h2>What's Next</h2>
      <p>This is just the beginning. We're already working on expanding the API with more endpoints and features. Stay tuned for updates!</p>
    `,
  },
  {
    slug: "scaling-your-saas-business",
    title: "Scaling Your SaaS Business: Lessons We've Learned",
    description:
      "Discover the key lessons we've learned while scaling our SaaS business from 10 to 10,000 customers.",
    date: "February 15, 2025",
    authors: ["Michael Chen"],
    readTime: "6 min read",
    category: "Business",
    content: `
      <p>Scaling a SaaS business is no small feat. Here are some of the most important lessons we've learned along the way.</p>
      <h2>Focus on Customer Success</h2>
      <p>The single most important factor in our growth has been our focus on customer success. When our customers succeed, we succeed. This means investing in support, education, and continuous improvement of our product.</p>
      <h2>Build a Strong Foundation</h2>
      <p>Technical debt can kill your ability to move quickly. We've learned to balance speed with quality, ensuring that our foundation remains strong as we grow.</p>
      <h2>Measure What Matters</h2>
      <p>Not all metrics are created equal. We focus on a small set of key performance indicators that truly reflect the health of our business and the value we provide to customers.</p>
      <h2>Hire for Culture and Potential</h2>
      <p>As we've grown, we've found that hiring for culture fit and potential has served us better than hiring solely for experience. Skills can be taught, but values and drive are inherent.</p>
    `,
  },
  {
    slug: "the-future-of-remote-work",
    title: "The Future of Remote Work: Tools and Strategies",
    description:
      "Explore the tools and strategies that will define the future of remote work in a post-pandemic world.",
    date: "January 28, 2025",
    authors: ["Alex Rivera", "Jane Smith"],
    readTime: "5 min read",
    category: "Workplace",
    content: `
      <p>Remote work is here to stay, but how it evolves will depend on the tools and strategies we develop to support it.</p>
      <h2>Beyond Video Calls</h2>
      <p>While video calls have been the backbone of remote collaboration, we're seeing a shift toward asynchronous communication tools that respect time zones and personal work rhythms.</p>
      <h2>Digital Headquarters</h2>
      <p>Companies are creating digital headquarters that serve as central hubs for communication, documentation, and collaboration. These spaces help maintain company culture and keep everyone aligned.</p>
      <h2>Work-Life Integration</h2>
      <p>The line between work and personal life continues to blur. Smart companies are implementing policies that support work-life integration rather than fighting against it.</p>
      <h2>The Role of AI</h2>
      <p>Artificial intelligence is playing an increasingly important role in remote work, from scheduling assistants to content generation tools that help teams work more efficiently.</p>
    `,
  },
  {
    slug: "security-best-practices",
    title: "Security Best Practices for SaaS Companies in 2025",
    description:
      "Learn the essential security practices that every SaaS company should implement to protect their data and customers.",
    date: "January 10, 2025",
    authors: ["Elena Patel", "Robert Brown"],
    readTime: "7 min read",
    category: "Security",
    content: `
      <p>Security is not a feature—it's a foundation. Here are the security practices we recommend for all SaaS companies in 2025.</p>
      <h2>Zero Trust Architecture</h2>
      <p>The perimeter-based security model is dead. Zero Trust assumes that threats exist both inside and outside traditional network boundaries and requires verification for all access requests.</p>
      <h2>Regular Security Audits</h2>
      <p>Regular security audits help identify vulnerabilities before they can be exploited. We recommend quarterly internal audits and annual external audits by specialized security firms.</p>
      <h2>Employee Training</h2>
      <p>Your team is both your greatest asset and your greatest vulnerability. Regular security training helps ensure that everyone understands their role in maintaining security.</p>
      <h2>Data Encryption</h2>
      <p>All data should be encrypted both in transit and at rest. This provides an essential layer of protection even if other security measures fail.</p>
      <h2>Incident Response Plan</h2>
      <p>No security system is perfect. Having a well-documented and regularly tested incident response plan helps minimize damage when breaches occur.</p>
    `,
  },
];

export default function BlogPost() {
  const { blogPost } = useParams();
  const blog = blogs.find((blog) => blog.slug === blogPost);

  if (!blog) {
    return <></>;
  }

  return (
    <div className="pt-28 flex items-center justify-center w-screen min-h-screen h-fit overflow-y-auto">
      <div className="max-w-screen-md mx-auto">
        <div className="mb-8">
          <Button
            variant="light"
            className="mb-4 px-0 font-medium"
            as={Link}
            href="/blog"
            size="sm"
          >
            <ChevronLeft />
            Blog
          </Button>

          <h1 className="text-2xl font-bold tracking-tight mb-4">
            {blog.title}
          </h1>

          <div className="flex items-center space-x-4 mb-6">
            <AvatarGroup>
              {blog.authors.map((author) => (
                <Tooltip
                  key={author}
                  content={author}
                  classNames={{ content: "text-nowrap" }}
                >
                  <Avatar></Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
            <div>
              <p className="font-medium">{blog.authors.join(", ")}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span className="text-foreground-500">{blog.date}</span>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-zinc-700" />

          <div
            className="prose prose-sm max-w-none space-y-6"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div
            className="prose prose-sm max-w-none space-y-6"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </div>
    </div>
  );
}
