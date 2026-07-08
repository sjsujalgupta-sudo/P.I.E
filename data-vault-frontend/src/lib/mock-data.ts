/*
 * 🎭 Analogy: This file is the "Prop Room" — it stores all the
 *   fake data (sessions, analytics, contracts, logs) used to
 *   make every page look populated before real data arrives.
 * ✅ Safe to change:
 *    1. Any mockSessions entry — edit titles, domains, or keywords
 *    2. The mockAnalytics numbers — change totals and percentages
 *    3. The mockContracts reward amounts and descriptions
 * ❌ Never touch: The exported type names (SessionData, Contract, etc.)
 *   — pages import these types. Renaming them breaks TypeScript.
 */

// Comprehensive realistic mock data for all DataVault pages

export interface SessionData {
    id: string;
    title: string;
    domain: string;
    url: string;
    keywords: string[];
    topics: string[];
    sensitivity: "low" | "medium" | "high";
    capturedAt: string;
    summary: string;
    searchQueries: string[];
    interests: string[];
    favicon: string;
}

export interface AnalyticsData {
    totalSessions: number;
    pagesCaptured: number;
    dataQualityScore: number;
    sensitivityLevel: string;
    weeklyInterests: { name: string; count: number }[];
    topTopics: { name: string; count: number }[];
}

export interface Contract {
    id: string;
    company: string;
    logo: string;
    categories: string[];
    reward: string;
    rewardAmount: number;
    expiry: string;
    status: "pending" | "accepted" | "declined";
    description: string;
}

export interface LogEntry {
    id: string;
    type: "session_started" | "page_captured" | "data_exported" | "contract_accepted" | "contract_revoked";
    description: string;
    timestamp: string;
    metadata?: Record<string, string>;
}

export const mockSessions: SessionData[] = [
    {
        id: "sess_001",
        title: "Understanding Machine Learning Fundamentals",
        domain: "towardsdatascience.com",
        url: "https://towardsdatascience.com/ml-fundamentals",
        keywords: ["machine learning", "neural networks", "deep learning", "AI"],
        topics: ["Artificial Intelligence", "Technology", "Education"],
        sensitivity: "low",
        capturedAt: "2026-04-07T08:30:00Z",
        summary: "An introductory article covering the basics of machine learning, including supervised and unsupervised learning paradigms, neural network architectures, and practical applications in industry.",
        searchQueries: ["machine learning basics", "how neural networks work"],
        interests: ["AI & Machine Learning", "Tech Education"],
        favicon: "https://cdn.icon-icons.com/icons2/2407/PNG/32/towards_data_science_icon_146322.png",
    },
    {
        id: "sess_002",
        title: "Best Noise-Cancelling Headphones 2026",
        domain: "wirecutter.com",
        url: "https://wirecutter.com/best-noise-cancelling-headphones",
        keywords: ["headphones", "noise cancelling", "audio", "review"],
        topics: ["Consumer Electronics", "Product Reviews"],
        sensitivity: "low",
        capturedAt: "2026-04-07T07:45:00Z",
        summary: "A comprehensive review of top noise-cancelling headphones including Sony WH-1000XM6, Apple AirPods Max 2, and Bose QuietComfort Ultra with detailed comparison charts.",
        searchQueries: ["best headphones 2026", "sony vs bose headphones"],
        interests: ["Consumer Electronics", "Audio Equipment"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_003",
        title: "React Server Components Deep Dive",
        domain: "react.dev",
        url: "https://react.dev/blog/server-components",
        keywords: ["react", "server components", "RSC", "next.js", "web development"],
        topics: ["Web Development", "JavaScript", "Frontend"],
        sensitivity: "low",
        capturedAt: "2026-04-06T22:15:00Z",
        summary: "Official React documentation explaining server components architecture, streaming SSR, and how to optimize data fetching patterns in modern React applications.",
        searchQueries: ["react server components tutorial", "RSC vs client components"],
        interests: ["Web Development", "React Ecosystem"],
        favicon: "https://react.dev/favicon-32x32.png",
    },
    {
        id: "sess_004",
        title: "Planning a Trip to Kyoto in Spring",
        domain: "lonelyplanet.com",
        url: "https://lonelyplanet.com/japan/kyoto",
        keywords: ["kyoto", "japan", "travel", "cherry blossom", "temples"],
        topics: ["Travel", "Japan", "Culture"],
        sensitivity: "medium",
        capturedAt: "2026-04-06T20:00:00Z",
        summary: "Travel guide for visiting Kyoto during cherry blossom season, covering top temples, traditional ryokan stays, local cuisine recommendations, and a suggested 5-day itinerary.",
        searchQueries: ["kyoto cherry blossom season 2026", "best temples kyoto"],
        interests: ["Travel & Tourism", "Japanese Culture"],
        favicon: "https://cdn.icon-icons.com/icons2/3053/PNG/32/lonely_planet_macos_bigsur_icon_190279.png",
    },
    {
        id: "sess_005",
        title: "Home Loan Interest Rates Comparison",
        domain: "bankrate.com",
        url: "https://bankrate.com/mortgages/rates",
        keywords: ["mortgage", "interest rates", "home loan", "refinance"],
        topics: ["Personal Finance", "Real Estate"],
        sensitivity: "high",
        capturedAt: "2026-04-06T18:30:00Z",
        summary: "Comparison of current mortgage rates from major lenders including 30-year fixed, 15-year fixed, and adjustable-rate options with APR breakdowns and estimated monthly payments.",
        searchQueries: ["current mortgage rates", "should I refinance 2026"],
        interests: ["Personal Finance", "Real Estate"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_006",
        title: "Healthy Meal Prep Ideas for the Week",
        domain: "budgetbytes.com",
        url: "https://budgetbytes.com/meal-prep",
        keywords: ["meal prep", "healthy eating", "recipes", "budget cooking"],
        topics: ["Health & Wellness", "Cooking", "Lifestyle"],
        sensitivity: "low",
        capturedAt: "2026-04-06T16:00:00Z",
        summary: "Collection of budget-friendly meal prep recipes including Mediterranean chicken bowls, lentil soup, and teriyaki tofu stir-fry with nutritional information and prep time estimates.",
        searchQueries: ["easy meal prep recipes", "healthy lunch ideas work"],
        interests: ["Cooking & Recipes", "Health & Wellness"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_007",
        title: "Tesla Model Y 2026 Review",
        domain: "caranddriver.com",
        url: "https://caranddriver.com/tesla/model-y-2026",
        keywords: ["tesla", "model y", "electric vehicle", "EV review"],
        topics: ["Automotive", "Electric Vehicles", "Technology"],
        sensitivity: "low",
        capturedAt: "2026-04-06T14:20:00Z",
        summary: "In-depth review of the refreshed 2026 Tesla Model Y covering range improvements, interior upgrades, autonomous driving capabilities, and comparison with competitors.",
        searchQueries: ["tesla model y 2026 review", "best electric SUV"],
        interests: ["Electric Vehicles", "Automotive"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_008",
        title: "Introduction to Kubernetes Orchestration",
        domain: "kubernetes.io",
        url: "https://kubernetes.io/docs/tutorials/",
        keywords: ["kubernetes", "k8s", "containers", "orchestration", "devops"],
        topics: ["DevOps", "Cloud Computing", "Infrastructure"],
        sensitivity: "low",
        capturedAt: "2026-04-05T21:45:00Z",
        summary: "Official Kubernetes tutorial covering pod deployment, service creation, scaling applications, and setting up a local development cluster with Minikube.",
        searchQueries: ["kubernetes tutorial beginners", "k8s vs docker swarm"],
        interests: ["DevOps", "Cloud Infrastructure"],
        favicon: "https://kubernetes.io/images/favicon.png",
    },
    {
        id: "sess_009",
        title: "Best Ergonomic Standing Desks",
        domain: "nytimes.com",
        url: "https://nytimes.com/wirecutter/standing-desks",
        keywords: ["standing desk", "ergonomic", "office furniture", "home office"],
        topics: ["Home Office", "Ergonomics", "Product Reviews"],
        sensitivity: "low",
        capturedAt: "2026-04-05T19:10:00Z",
        summary: "Expert-reviewed standing desk recommendations covering motorized vs manual options, height ranges, weight capacity, and value picks for different budgets.",
        searchQueries: ["best standing desk 2026", "uplift vs flexispot"],
        interests: ["Home Office Setup", "Ergonomics"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_010",
        title: "Understanding Crypto Tax Regulations",
        domain: "coindesk.com",
        url: "https://coindesk.com/crypto-tax-guide-2026",
        keywords: ["cryptocurrency", "tax", "regulations", "IRS", "capital gains"],
        topics: ["Cryptocurrency", "Tax Planning", "Finance"],
        sensitivity: "high",
        capturedAt: "2026-04-05T17:30:00Z",
        summary: "Guide to cryptocurrency tax obligations in 2026 covering capital gains reporting, DeFi income, NFT transactions, and available tax-loss harvesting strategies.",
        searchQueries: ["crypto tax rules 2026", "how to report bitcoin gains"],
        interests: ["Cryptocurrency", "Tax Planning"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_011",
        title: "Yoga for Beginners: 30-Day Challenge",
        domain: "yogajournal.com",
        url: "https://yogajournal.com/30-day-challenge",
        keywords: ["yoga", "fitness", "meditation", "flexibility", "wellness"],
        topics: ["Fitness", "Wellness", "Mindfulness"],
        sensitivity: "low",
        capturedAt: "2026-04-05T15:00:00Z",
        summary: "A structured 30-day yoga program for beginners covering basic poses, breathing techniques, and daily meditation practices with video demonstrations.",
        searchQueries: ["yoga for beginners", "morning yoga routine"],
        interests: ["Fitness & Wellness", "Mindfulness"],
        favicon: "https://cdn.icon-icons.com/icons2/1996/PNG/32/document_documents_file_icon_123260.png",
    },
    {
        id: "sess_012",
        title: "TypeScript 5.5 New Features",
        domain: "devblogs.microsoft.com",
        url: "https://devblogs.microsoft.com/typescript-5-5",
        keywords: ["typescript", "javascript", "programming", "type safety"],
        topics: ["Programming Languages", "Web Development"],
        sensitivity: "low",
        capturedAt: "2026-04-05T12:30:00Z",
        summary: "Overview of TypeScript 5.5 features including inferred type predicates, control flow narrowing improvements, and new declaration emit enhancements.",
        searchQueries: ["typescript 5.5 features", "typescript vs javascript 2026"],
        interests: ["Programming", "TypeScript"],
        favicon: "https://cdn.icon-icons.com/icons2/2415/PNG/32/typescript_original_icon_146317.png",
    },
];

export const mockAnalytics: AnalyticsData = {
    totalSessions: 147,
    pagesCaptured: 1284,
    dataQualityScore: 87,
    sensitivityLevel: "Medium",
    weeklyInterests: [
        { name: "Web Development", count: 34 },
        { name: "AI & Machine Learning", count: 28 },
        { name: "Consumer Electronics", count: 22 },
        { name: "Personal Finance", count: 18 },
        { name: "Travel & Tourism", count: 15 },
        { name: "Fitness & Wellness", count: 12 },
        { name: "Automotive", count: 9 },
        { name: "Cooking & Recipes", count: 7 },
    ],
    topTopics: [
        { name: "Technology", count: 45 },
        { name: "Programming", count: 38 },
        { name: "Finance", count: 22 },
        { name: "Health", count: 18 },
        { name: "Travel", count: 15 },
        { name: "Education", count: 14 },
        { name: "Entertainment", count: 11 },
        { name: "Science", count: 9 },
    ],
};

export const mockContracts: Contract[] = [
    {
        id: "contract_001",
        company: "AdTech Corp",
        logo: "AT",
        categories: ["Browsing Interests", "Content Preferences", "Device Type"],
        reward: "$2.50 / month",
        rewardAmount: 2.5,
        expiry: "2026-06-30",
        status: "pending",
        description: "AdTech Corp requests access to your anonymized browsing interest profiles to improve ad relevance across their partner network. Only aggregated category data is shared.",
    },
    {
        id: "contract_002",
        company: "RetailInsights",
        logo: "RI",
        categories: ["Shopping Interests", "Product Research", "Price Sensitivity"],
        reward: "$3.75 / month",
        rewardAmount: 3.75,
        expiry: "2026-07-15",
        status: "pending",
        description: "RetailInsights uses anonymized shopping behavior data to help retailers optimize product recommendations. Your identity is never revealed.",
    },
    {
        id: "contract_003",
        company: "MediaPulse",
        logo: "MP",
        categories: ["Content Consumption", "Media Preferences", "Engagement Patterns"],
        reward: "$1.80 / month",
        rewardAmount: 1.8,
        expiry: "2026-08-01",
        status: "pending",
        description: "MediaPulse aggregates content consumption patterns to help publishers create better content. Only topic-level data is used, no specific URLs.",
    },
    {
        id: "contract_004",
        company: "TravelIQ",
        logo: "TQ",
        categories: ["Travel Interests", "Destination Research", "Booking Patterns"],
        reward: "$4.20 / month",
        rewardAmount: 4.2,
        expiry: "2026-09-15",
        status: "pending",
        description: "TravelIQ uses anonymized travel interest data to helps airlines and hotels improve pricing and availability. Only destination categories are shared.",
    },
];

export const mockAcceptedContracts: Contract[] = [
    {
        id: "contract_005",
        company: "DataStream Analytics",
        logo: "DS",
        categories: ["General Interests", "Topic Preferences"],
        reward: "$1.50 / month",
        rewardAmount: 1.5,
        expiry: "2026-12-31",
        status: "accepted",
        description: "DataStream Analytics uses broad interest category data for market research reports. Fully anonymized.",
    },
];

export const mockLogs: LogEntry[] = [
    {
        id: "log_001",
        type: "session_started",
        description: "New browsing session started",
        timestamp: "2026-04-07T08:00:00Z",
    },
    {
        id: "log_002",
        type: "page_captured",
        description: "Captured page: Understanding Machine Learning Fundamentals from towardsdatascience.com",
        timestamp: "2026-04-07T08:30:00Z",
    },
    {
        id: "log_003",
        type: "page_captured",
        description: "Captured page: Best Noise-Cancelling Headphones 2026 from wirecutter.com",
        timestamp: "2026-04-07T07:45:00Z",
    },
    {
        id: "log_004",
        type: "data_exported",
        description: "Exported session data as CSV for session sess_003",
        timestamp: "2026-04-06T23:00:00Z",
    },
    {
        id: "log_005",
        type: "page_captured",
        description: "Captured page: React Server Components Deep Dive from react.dev",
        timestamp: "2026-04-06T22:15:00Z",
    },
    {
        id: "log_006",
        type: "contract_accepted",
        description: "Accepted data contract with DataStream Analytics — $1.50/month",
        timestamp: "2026-04-06T21:00:00Z",
    },
    {
        id: "log_007",
        type: "page_captured",
        description: "Captured page: Planning a Trip to Kyoto in Spring from lonelyplanet.com",
        timestamp: "2026-04-06T20:00:00Z",
    },
    {
        id: "log_008",
        type: "session_started",
        description: "New browsing session started",
        timestamp: "2026-04-06T19:30:00Z",
    },
    {
        id: "log_009",
        type: "page_captured",
        description: "Captured page: Home Loan Interest Rates Comparison from bankrate.com",
        timestamp: "2026-04-06T18:30:00Z",
    },
    {
        id: "log_010",
        type: "contract_revoked",
        description: "Revoked data contract with MarketScope Inc",
        timestamp: "2026-04-06T17:00:00Z",
    },
    {
        id: "log_011",
        type: "page_captured",
        description: "Captured page: Healthy Meal Prep Ideas for the Week from budgetbytes.com",
        timestamp: "2026-04-06T16:00:00Z",
    },
    {
        id: "log_012",
        type: "data_exported",
        description: "Exported interest profile as JSON for session sess_007",
        timestamp: "2026-04-06T15:00:00Z",
    },
    {
        id: "log_013",
        type: "page_captured",
        description: "Captured page: Tesla Model Y 2026 Review from caranddriver.com",
        timestamp: "2026-04-06T14:20:00Z",
    },
    {
        id: "log_014",
        type: "session_started",
        description: "New browsing session started",
        timestamp: "2026-04-06T14:00:00Z",
    },
    {
        id: "log_015",
        type: "page_captured",
        description: "Captured page: Understanding Crypto Tax Regulations from coindesk.com",
        timestamp: "2026-04-05T17:30:00Z",
    },
];

export const mockUserProfile = {
    topInterests: [
        { subject: "Web Development", value: 92 },
        { subject: "AI & Machine Learning", value: 78 },
        { subject: "Personal Finance", value: 65 },
        { subject: "Consumer Electronics", value: 58 },
        { subject: "Travel & Tourism", value: 45 },
        { subject: "Fitness & Wellness", value: 38 },
        { subject: "Automotive", value: 30 },
        { subject: "Cooking", value: 25 },
    ],
    topTopics: [
        "React", "TypeScript", "Machine Learning", "Kubernetes", "Travel",
        "Electric Vehicles", "Cryptocurrency", "Meal Prep", "Yoga",
        "Standing Desks", "Server Components", "Deep Learning", "Japan",
        "Headphones", "Mortgage Rates", "DevOps", "Cloud Computing",
    ],
    mostVisitedDomains: [
        { domain: "github.com", visits: 245 },
        { domain: "stackoverflow.com", visits: 189 },
        { domain: "react.dev", visits: 67 },
        { domain: "youtube.com", visits: 56 },
        { domain: "medium.com", visits: 43 },
    ],
    peakHours: [
        { hour: "6AM", sessions: 2 },
        { hour: "8AM", sessions: 8 },
        { hour: "10AM", sessions: 15 },
        { hour: "12PM", sessions: 12 },
        { hour: "2PM", sessions: 18 },
        { hour: "4PM", sessions: 14 },
        { hour: "6PM", sessions: 10 },
        { hour: "8PM", sessions: 16 },
        { hour: "10PM", sessions: 20 },
        { hour: "12AM", sessions: 5 },
    ],
    contentCategories: [
        { category: "Technology", percentage: 45 },
        { category: "Finance", percentage: 20 },
        { category: "Health & Wellness", percentage: 15 },
        { category: "Travel", percentage: 10 },
        { category: "Entertainment", percentage: 10 },
    ],
    anonymizedProfile: {
        profile_id: "anon_8f4a2b1c",
        generated_at: "2026-04-07T09:00:00Z",
        interest_categories: [
            { category: "technology.web_development", confidence: 0.92, weight: "high" },
            { category: "technology.artificial_intelligence", confidence: 0.78, weight: "high" },
            { category: "finance.personal", confidence: 0.65, weight: "medium" },
            { category: "electronics.consumer", confidence: 0.58, weight: "medium" },
            { category: "travel.asia", confidence: 0.45, weight: "low" },
            { category: "health.fitness", confidence: 0.38, weight: "low" },
        ],
        engagement_level: "high",
        content_depth: "detailed",
        session_frequency: "daily",
        data_quality_score: 87,
    },
};
