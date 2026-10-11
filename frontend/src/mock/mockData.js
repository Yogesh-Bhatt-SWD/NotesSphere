/**
 * Mock Data for Frontend Visual Development
 * Note: Used solely for layout prototyping and visual verification.
 * Production and integration flows use src/api/ services.
 */

export const mockCurrentUser = {
  id: "u-mock-1",
  name: "Arthur Fen",
  username: "arthurfen",
  email: "arthur.fen@notesphere.io",
  role: "Journalist",
  badge: "PRO",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
};

export const mockFeaturedJournals = [
  {
    id: "j-1",
    title: "Diary",
    snippet: "Reflecting on the tranquil morning meditation and quiet mindfulness moments...",
    createdAt: "08/12/21",
    category: "Mindfulness",
    sentiment: "POSITIVE",
    sentimentScore: 0.85,
    icon: "book",
    color: "#6366F1",
    // Scenic aesthetic illustration
    coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
    tags: ["zen", "daily", "thoughts"],
    isFavorite: true,
    isPinned: true
  },
  {
    id: "j-2",
    title: "Future Plan",
    snippet: "Mapping out milestones for Q4 engineering architecture and creative writing...",
    createdAt: "07/08/21",
    category: "Goals",
    sentiment: "POSITIVE",
    sentimentScore: 0.92,
    icon: "rocket",
    color: "#F59E0B",
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    tags: ["goals", "career", "vision"],
    isFavorite: true,
    isPinned: false
  },
  {
    id: "j-3",
    title: "Day in Life",
    snippet: "Observations along the seaside promenade, coastal breeze and sunset coffee...",
    createdAt: "07/02/20",
    category: "Reflections",
    sentiment: "POSITIVE",
    sentimentScore: 0.78,
    icon: "hourglass",
    color: "#EF4444",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    tags: ["travel", "coastal", "life"],
    isFavorite: false,
    isPinned: true
  }
];

export const mockRecentJournals = [
  {
    id: "j-4",
    title: "Accident on Yeou Gogae",
    category: "Storytelling",
    timeAgo: "2 hours ago",
    readTime: "4 min read",
    sentiment: "NEUTRAL",
    collaborators: 3,
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "j-5",
    title: "Badminton Olympics",
    category: "Health & Sport",
    timeAgo: "Yesterday",
    readTime: "3 min read",
    sentiment: "POSITIVE",
    collaborators: 5,
    thumbnail: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "j-6",
    title: "Indonesian Independence Day",
    category: "Culture",
    timeAgo: "3 days ago",
    readTime: "6 min read",
    sentiment: "POSITIVE",
    collaborators: 2,
    thumbnail: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=200&q=80"
  }
];

export const mockStats = {
  sentimentBalanceScore: 82, // 82% circular progress ring from Image A
  totalJournals: "4.6k",
  activeStreakDays: 14,
  totalWordsWritten: "128.4k",
  sentimentBreakdown: [
    { name: "Positive", value: 68, color: "#10B981" },
    { name: "Neutral", value: 24, color: "#64748B" },
    { name: "Negative", value: 8, color: "#EF4444" }
  ],
  categoryStats: [
    { category: "Mindfulness", count: 32 },
    { category: "Goals", count: 24 },
    { category: "Work", count: 19 },
    { category: "Reflections", count: 15 },
    { category: "Creative", count: 10 }
  ]
};

export const mockTodayActivities = [
  {
    id: "act-1",
    title: "My Diary",
    time: "12 minutes ago",
    icon: "book",
    type: "update"
  },
  {
    id: "act-2",
    title: "Future Plan",
    time: "1 hour ago",
    icon: "rocket",
    type: "new"
  }
];

export const mockUpcomingReminders = [
  {
    id: "rem-1",
    date: "12 October",
    time: "09:00 PM",
    title: "Evening Gratitude Journal",
    tag: "Reflections"
  },
  {
    id: "rem-2",
    date: "14 October",
    time: "08:00 AM",
    title: "Weekly Goals & Focus Check",
    tag: "Planning"
  }
];

export const mockCalendarDatesWithEntries = [3, 7, 8, 11, 12, 16, 21, 26, 28];
