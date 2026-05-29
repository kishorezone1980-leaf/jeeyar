/**
 * Explore topics — Apps-style browse data (featured carousel + grid).
 */
const EXPLORE_TOPICS = {
  title: "Explore topics",
  subtitle: "Browse teachings from HH Sri Chinnajeeyar Swamiji's discourses",
  categories: [
    { id: "featured", label: "Featured" },
    { id: "scripture", label: "Scripture" },
    { id: "life", label: "Life & dharma" },
    { id: "devotion", label: "Devotion" },
  ],
  featured: [
    {
      topic: "gita",
      title: "Bhagavad Gita",
      subtitle: "Chapter-wise discourses & teachings",
      cta: "View",
      gradient: "linear-gradient(125deg, #6ec4e8 0%, #c8e8f0 38%, #f5e8b0 72%, #fff9ee 100%)",
      icon: "📖",
      previewImage: "Images/bhagavad-gita-hero.png",
      previewText:
        "Ask about karma yoga, dharma, and each chapter as taught in Swamiji's discourses.",
    },
    {
      topic: "devotion",
      title: "Bhakti & Devotion",
      subtitle: "Living bhakti every day",
      cta: "View",
      gradient: "linear-gradient(125deg, #e8b86a 0%, #f5dcc0 45%, #f9f0e6 100%)",
      icon: "🪷",
      previewText:
        "Learn how Swamiji describes true devotion, surrender, and nama sankirtan in daily life.",
    },
    {
      topic: "ramanuja",
      title: "Sri Ramanujacharya",
      subtitle: "Visishtadvaita & acharya teachings",
      cta: "View",
      gradient: "linear-gradient(125deg, #b8a0d8 0%, #e8dff5 50%, #f9f4ee 100%)",
      icon: "🙏",
      previewText:
        "Explore Swamiji's talks on Ramanuja's life, philosophy, and the path of sharanagati.",
    },
  ],
  topics: [
    {
      topic: "gita",
      title: "Bhagavad Gita",
      description: "Discourses on all 18 chapters",
      category: "scripture",
      featured: true,
      icon: "📖",
      iconBg: "#b23a1e",
    },
    {
      topic: "ramanuja",
      title: "Sri Ramanujacharya",
      description: "Visishtadvaita & acharya teachings",
      category: "scripture",
      featured: true,
      icon: "🙏",
      iconBg: "#7a4a8f",
    },
    {
      topic: "life",
      title: "Life & Religion",
      description: "Righteous living & dharma",
      category: "life",
      icon: "☸",
      iconBg: "#2e4061",
    },
    {
      topic: "rituals",
      title: "Our Rituals",
      description: "Meaning behind sacred practices",
      category: "life",
      icon: "🪔",
      iconBg: "#5d6d3e",
    },
    {
      topic: "devotion",
      title: "Bhakti & Devotion",
      description: "True devotion in daily life",
      category: "devotion",
      featured: true,
      icon: "🪷",
      iconBg: "#8b5a2b",
    },
  ],
};
