export interface Blog {
  slug: string;
  title: string;
  category: string;
  date: string;
  image: string;
  authors: {
    name: string;
    role: string;
    avatar: string;
    linkedin?: string;
    twitter?: string;
  }[];
}

export const dummyBlogData: Blog[] = [
  {
    slug: "introducing-gaia-v2",
    title: "Introducing GAIA v2.0: The Future of AI Personal Assistants",
    category: "Product Update",
    date: "2025-06-15",
    image: "/media/glass.png",
    authors: [
      {
        name: "Sarah Chen",
        role: "Lead Designer",
        avatar: "https://i.pravatar.cc/150?u=SarahChen",
        linkedin: "https://linkedin.com/in/sarahchen",
        twitter: "https://twitter.com/sarahchen",
      },
      {
        name: "Alex Rodriguez",
        role: "Engineering Manager",
        avatar: "https://i.pravatar.cc/150?u=AlexRodriguez",
        linkedin: "https://linkedin.com/in/alexrodriguez",
        twitter: "https://twitter.com/alexrodriguez",
      },
    ],
  },
  {
    slug: "ai-productivity-tips",
    title: "10 Ways AI Can Supercharge Your Daily Productivity",
    category: "Tips & Tricks",
    date: "2025-06-10",
    image: "/media/glass.png",
    authors: [
      {
        name: "Maya Patel",
        role: "Product Manager",
        avatar: "https://i.pravatar.cc/150?u=MayaPatel",
        linkedin: "https://linkedin.com/in/mayapatel",
        twitter: "https://twitter.com/mayapatel",
      },
    ],
  },
  {
    slug: "privacy-first-ai",
    title: "Privacy-First AI: How GAIA Keeps Your Data Secure",
    category: "Security",
    date: "2025-06-05",
    image: "/media/glass.png",
    authors: [
      {
        name: "David Kim",
        role: "Chief Security Officer",
        avatar: "https://i.pravatar.cc/150?u=DavidKim",
        linkedin: "https://linkedin.com/in/davidkim",
        twitter: "https://twitter.com/davidkim",
      },
      {
        name: "Lisa Thompson",
        role: "AI Researcher",
        avatar: "https://i.pravatar.cc/150?u=LisaThompson",
        linkedin: "https://linkedin.com/in/lisathompson",
        twitter: "https://twitter.com/lisathompson",
      },
    ],
  },
  {
    slug: "natural-language-processing",
    title: "The Evolution of Natural Language Processing in Personal AI",
    category: "AI Technology",
    date: "2025-05-28",
    image: "/media/glass.png",
    authors: [
      {
        name: "James Wilson",
        role: "NLP Engineer",
        avatar: "https://i.pravatar.cc/150?u=JamesWilson",
        linkedin: "https://linkedin.com/in/jameswilson",
        twitter: "https://twitter.com/jameswilson",
      },
      {
        name: "Emma Zhang",
        role: "AI Scientist",
        avatar: "https://i.pravatar.cc/150?u=EmmaZhang",
        linkedin: "https://linkedin.com/in/emmazhang",
        twitter: "https://twitter.com/emmazhang",
      },
      {
        name: "Ryan O'Connor",
        role: "Software Engineer",
        avatar: "https://i.pravatar.cc/150?u=RyanOConnor",
        linkedin: "https://linkedin.com/in/ryanoconnor",
        twitter: "https://twitter.com/ryanoconnor",
      },
    ],
  },
  {
    slug: "future-of-ai-assistants",
    title: "The Future of AI Assistants: Beyond Simple Commands",
    category: "AI Research",
    date: "2025-05-20",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Jennifer Martinez",
        role: "AI Research Director",
        avatar: "https://i.pravatar.cc/150?u=JenniferMartinez",
        linkedin: "https://linkedin.com/in/jennifermartinez",
        twitter: "https://twitter.com/jennifermartinez",
      },
    ],
  },
  {
    slug: "ai-ethics-responsibility",
    title: "Building Responsible AI: Our Commitment to Ethical Development",
    category: "AI Ethics",
    date: "2025-05-15",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Amelia Foster",
        role: "Head of AI Ethics",
        avatar: "https://i.pravatar.cc/150?u=AmeliaFoster",
        linkedin: "https://linkedin.com/in/ameliafoster",
        twitter: "https://twitter.com/ameliafoster",
      },
      {
        name: "Marcus Johnson",
        role: "Policy Advisor",
        avatar: "https://i.pravatar.cc/150?u=MarcusJohnson",
        linkedin: "https://linkedin.com/in/marcusjohnson",
        twitter: "https://twitter.com/marcusjohnson",
      },
    ],
  },
  {
    slug: "voice-recognition-breakthrough",
    title: "Breaking Barriers: Our Latest Voice Recognition Technology",
    category: "Technology",
    date: "2025-05-08",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Sophia Lee",
        role: "Senior Audio Engineer",
        avatar: "https://i.pravatar.cc/150?u=SophiaLee",
        linkedin: "https://linkedin.com/in/sophialee",
        twitter: "https://twitter.com/sophialee",
      },
    ],
  },
  {
    slug: "gaia-mobile-app-launch",
    title: "GAIA Goes Mobile: Introducing Our New iOS and Android Apps",
    category: "Product Update",
    date: "2025-04-30",
    image: "/media/glass.png",
    authors: [
      {
        name: "Kevin Park",
        role: "Mobile Development Lead",
        avatar: "https://i.pravatar.cc/150?u=KevinPark",
        linkedin: "https://linkedin.com/in/kevinpark",
        twitter: "https://twitter.com/kevinpark",
      },
      {
        name: "Isabella Rodriguez",
        role: "UX Designer",
        avatar: "https://i.pravatar.cc/150?u=IsabellaRodriguez",
        linkedin: "https://linkedin.com/in/isabellarodriguez",
        twitter: "https://twitter.com/isabellarodriguez",
      },
    ],
  },
  {
    slug: "ai-workplace-transformation",
    title: "How AI is Transforming the Modern Workplace",
    category: "Industry Insights",
    date: "2025-04-22",
    image: "/media/glass.png",
    authors: [
      {
        name: "Thomas Anderson",
        role: "Business Analyst",
        avatar: "https://i.pravatar.cc/150?u=ThomasAnderson",
        linkedin: "https://linkedin.com/in/thomasanderson",
        twitter: "https://twitter.com/thomasanderson",
      },
    ],
  },
  {
    slug: "machine-learning-models",
    title: "Under the Hood: The Machine Learning Models Powering GAIA",
    category: "AI Technology",
    date: "2025-04-15",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Rachel Green",
        role: "ML Research Scientist",
        avatar: "https://i.pravatar.cc/150?u=RachelGreen",
        linkedin: "https://linkedin.com/in/rachelgreen",
        twitter: "https://twitter.com/rachelgreen",
      },
      {
        name: "Ahmed Hassan",
        role: "Data Engineer",
        avatar: "https://i.pravatar.cc/150?u=AhmedHassan",
        linkedin: "https://linkedin.com/in/ahmedhassan",
        twitter: "https://twitter.com/ahmedhassan",
      },
    ],
  },
  {
    slug: "customer-success-stories",
    title: "Real Stories: How GAIA is Changing Lives Around the World",
    category: "Customer Stories",
    date: "2025-04-08",
    image: "/media/glass.png",
    authors: [
      {
        name: "Maria Santos",
        role: "Customer Success Manager",
        avatar: "https://i.pravatar.cc/150?u=MariaSantos",
        linkedin: "https://linkedin.com/in/mariasantos",
        twitter: "https://twitter.com/mariasantos",
      },
    ],
  },
  {
    slug: "ai-accessibility-features",
    title: "Making AI Accessible: Our Commitment to Inclusive Design",
    category: "Accessibility",
    date: "2025-04-01",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Michael Thompson",
        role: "Accessibility Lead",
        avatar: "https://i.pravatar.cc/150?u=MichaelThompson",
        linkedin: "https://linkedin.com/in/michaelthompson",
        twitter: "https://twitter.com/michaelthompson",
      },
      {
        name: "Priya Sharma",
        role: "Inclusive Design Specialist",
        avatar: "https://i.pravatar.cc/150?u=PriyaSharma",
        linkedin: "https://linkedin.com/in/priyasharma",
        twitter: "https://twitter.com/priyasharma",
      },
    ],
  },
  {
    slug: "gaia-enterprise-solutions",
    title: "GAIA for Enterprise: Scaling AI Assistance for Large Organizations",
    category: "Enterprise",
    date: "2025-03-25",
    image: "/media/glass.png",
    authors: [
      {
        name: "Robert Chen",
        role: "Enterprise Solutions Director",
        avatar: "https://i.pravatar.cc/150?u=RobertChen",
        linkedin: "https://linkedin.com/in/robertchen",
        twitter: "https://twitter.com/robertchen",
      },
    ],
  },
  {
    slug: "ai-safety-measures",
    title: "Keeping AI Safe: Our Multi-Layered Approach to AI Safety",
    category: "Safety",
    date: "2025-03-18",
    image: "/media/glass.png",
    authors: [
      {
        name: "Dr. Elena Vasquez",
        role: "AI Safety Engineer",
        avatar: "https://i.pravatar.cc/150?u=ElenaVasquez",
        linkedin: "https://linkedin.com/in/elenavasquez",
        twitter: "https://twitter.com/elenavasquez",
      },
      {
        name: "Jonathan Wright",
        role: "Security Architect",
        avatar: "https://i.pravatar.cc/150?u=JonathanWright",
        linkedin: "https://linkedin.com/in/jonathanwright",
        twitter: "https://twitter.com/jonathanwright",
      },
    ],
  },
  {
    slug: "developer-api-release",
    title: "Empowering Developers: GAIA API Now Available in Public Beta",
    category: "Developer Tools",
    date: "2025-03-10",
    image: "/media/glass.png",
    authors: [
      {
        name: "Samuel Kim",
        role: "Developer Relations Manager",
        avatar: "https://i.pravatar.cc/150?u=SamuelKim",
        linkedin: "https://linkedin.com/in/samuelkim",
        twitter: "https://twitter.com/samuelkim",
      },
      {
        name: "Anna Kowalski",
        role: "API Engineer",
        avatar: "https://i.pravatar.cc/150?u=AnnaKowalski",
        linkedin: "https://linkedin.com/in/annakowalski",
        twitter: "https://twitter.com/annakowalski",
      },
    ],
  },
];
