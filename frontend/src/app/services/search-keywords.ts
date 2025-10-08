/**
 * Comprehensive keyword mappings for natural language search
 * Organized by industry categories for better maintainability
 */

export interface ServiceKeywordMapping {
  keywords: string[];
  category?: string;
}

/**
 * Technology & Development Services
 */
export const TECH_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'developer', 'programmer', 'coder', 'software engineer',
    'web developer', 'frontend', 'backend', 'full stack', 'fullstack',
    'mobile developer', 'app developer', 'ios developer', 'android developer',
    'software', 'programming', 'coding', 'development',
    'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript',
    'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'database', 'sql', 'mongodb', 'postgresql', 'mysql',
    'devops', 'cloud engineer', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'api', 'rest', 'graphql', 'microservices',
    'qa', 'tester', 'quality assurance', 'automation'
  ],
  category: 'Software Development'
};

/**
 * Design & Creative Services
 */
export const DESIGN_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'designer', 'graphic designer', 'ui designer', 'ux designer', 'ui/ux',
    'web designer', 'product designer', 'visual designer',
    'illustrator', 'artist', 'creative', 'branding',
    'logo', 'brand identity', 'design',
    'photoshop', 'figma', 'sketch', 'adobe', 'illustrator',
    'motion graphics', 'animation', 'animator',
    'interior designer', 'architect', 'architectural design',
    '3d designer', 'cad', 'modeling'
  ],
  category: 'Design'
};

/**
 * Marketing & Advertising Services
 */

/*
* TODO
 - create a schema that holds all keywords and categories
 -  create an Api that returns all keywords and categories
 - The api fetches all keywords and categories from the database, if any keyword does not exist they 
 * will be added to the database
 - The api will also return all categories and keywords
 - the api will be brought to the frontend and used in this file

*/ 
export const MARKETING_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'marketer', 'marketing', 'digital marketing', 'social media marketing',
    'seo', 'sem', 'search engine optimization', 'google ads', 'ppc',
    'content marketing', 'email marketing', 'growth hacking',
    'social media manager', 'community manager',
    'copywriter', 'content writer', 'blogger',
    'advertising', 'ad campaign', 'media buyer',
    'brand strategist', 'marketing strategist',
    'influencer', 'affiliate marketing'
  ],
  category: 'Marketing'
};

/**
 * Business & Consulting Services
 */
export const BUSINESS_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'consultant', 'business consultant', 'management consultant',
    'strategy', 'strategist', 'business strategy', 'strategic planning',
    'business analyst', 'data analyst', 'analytics',
    'project manager', 'product manager', 'scrum master', 'agile coach',
    'operations', 'operations manager', 'process improvement',
    'business development', 'sales', 'sales consultant',
    'entrepreneur', 'startup advisor', 'business coach',
    'change management', 'transformation', 'business consulting'
  ],
  category: 'Business Consulting'
};

/**
 * Finance & Accounting Services
 */
export const FINANCE_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'accountant', 'bookkeeper', 'cpa', 'certified public accountant',
    'tax', 'tax advisor', 'tax consultant', 'tax preparer',
    'financial advisor', 'financial planner', 'wealth manager',
    'investment', 'investment advisor', 'portfolio manager',
    'auditor', 'audit', 'financial analyst',
    'payroll', 'accounting', 'finance',
    'quickbooks', 'xero', 'sage'
  ],
  category: 'Financial Services'
};

/**
 * Legal Services
 */
export const LEGAL_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'lawyer', 'attorney', 'legal', 'counsel', 'advocate',
    'corporate lawyer', 'business lawyer', 'contract lawyer',
    'family lawyer', 'divorce lawyer', 'immigration lawyer',
    'criminal lawyer', 'defense attorney',
    'intellectual property', 'patent', 'trademark', 'copyright',
    'legal advisor', 'legal consultant', 'paralegal',
    'notary', 'legal services'
  ],
  category: 'Legal Services'
};

/**
 * Health & Wellness Services
 */
export const HEALTH_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'doctor', 'physician', 'nurse', 'medical',
    'therapist', 'psychologist', 'counselor', 'mental health',
    'nutritionist', 'dietitian', 'health coach', 'wellness coach',
    'personal trainer', 'fitness trainer', 'gym trainer', 'coach',
    'yoga', 'yoga instructor', 'pilates', 'meditation',
    'massage', 'massage therapist', 'physiotherapist', 'chiropractor',
    'dentist', 'dental', 'orthodontist',
    'veterinarian', 'vet', 'animal doctor'
  ],
  category: 'Health & Wellness'
};

/**
 * Education & Training Services
 */
export const EDUCATION_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'teacher', 'tutor', 'instructor', 'educator', 'trainer',
    'professor', 'lecturer', 'coach', 'mentor',
    'language teacher', 'english teacher', 'math tutor',
    'music teacher', 'piano teacher', 'guitar teacher',
    'driving instructor', 'driving school',
    'training', 'workshop', 'course', 'class',
    'corporate trainer', 'leadership coach', 'executive coach'
  ],
  category: 'Education'
};

/**
 * Media & Entertainment Services
 */
export const MEDIA_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'photographer', 'photography', 'photo', 'portrait photographer',
    'wedding photographer', 'event photographer', 'product photographer',
    'videographer', 'video', 'video production', 'filmmaker',
    'editor', 'video editor', 'photo editor',
    'voice over', 'voice actor', 'narrator',
    'musician', 'dj', 'music producer', 'sound engineer',
    'entertainer', 'performer', 'actor', 'comedian',
    'event planner', 'wedding planner', 'party planner'
  ],
  category: 'Media & Entertainment'
};

/**
 * Writing & Content Services
 */
export const WRITING_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'writer', 'content writer', 'copywriter', 'technical writer',
    'blogger', 'journalist', 'author', 'ghostwriter',
    'editor', 'proofreader', 'copy editor',
    'translator', 'translation', 'interpreter', 'localization',
    'transcription', 'transcriber',
    'seo writer', 'content creator'
  ],
  category: 'Writing'
};

/**
 * Real Estate & Property Services
 */
export const REALESTATE_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'real estate', 'realtor', 'real estate agent', 'broker',
    'property', 'property manager', 'property management',
    'landlord', 'leasing', 'rental',
    'home inspector', 'appraiser', 'valuation'
  ],
  category: 'Real Estate'
};

/**
 * HR & Recruitment Services
 */
export const HR_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'hr', 'human resources', 'hr consultant', 'hr manager',
    'recruiter', 'recruitment', 'headhunter', 'talent acquisition',
    'career coach', 'career counselor', 'resume writer',
    'employee', 'staffing', 'hiring'
  ],
  category: 'HR Consulting'
};

/**
 * Logistics & Transportation Services
 */
export const LOGISTICS_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'logistics', 'supply chain', 'warehouse', 'distribution',
    'transportation', 'shipping', 'freight', 'delivery',
    'driver', 'courier', 'mover', 'moving company',
    'trucking', 'fleet management'
  ],
  category: 'Logistics'
};

/**
 * Hospitality & Food Services
 */
export const HOSPITALITY_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'chef', 'cook', 'personal chef', 'catering', 'caterer',
    'baker', 'pastry chef', 'bartender',
    'restaurant', 'food', 'culinary',
    'hotel', 'hospitality', 'concierge',
    'event planning', 'event coordinator'
  ],
  category: 'Hospitality'
};

/**
 * Cybersecurity & IT Services
 */
export const CYBERSECURITY_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'cybersecurity', 'security', 'infosec', 'information security',
    'penetration tester', 'ethical hacker', 'security analyst',
    'it', 'it support', 'tech support', 'help desk',
    'network', 'network engineer', 'system administrator', 'sysadmin',
    'it consultant', 'technology consultant'
  ],
  category: 'Cybersecurity'
};

/**
 * Data & Analytics Services
 */
export const DATA_KEYWORDS: ServiceKeywordMapping = {
  keywords: [
    'data scientist', 'data analyst', 'data engineer',
    'machine learning', 'ml', 'ai', 'artificial intelligence',
    'data analytics', 'big data', 'data mining',
    'business intelligence', 'bi', 'tableau', 'power bi',
    'statistician', 'statistics', 'research analyst'
  ],
  category: 'Data Analytics'
};

/**
 * All service keywords combined
 */
export const ALL_SERVICE_KEYWORDS: string[] = [
  ...TECH_KEYWORDS.keywords,
  ...DESIGN_KEYWORDS.keywords,
  ...MARKETING_KEYWORDS.keywords,
  ...BUSINESS_KEYWORDS.keywords,
  ...FINANCE_KEYWORDS.keywords,
  ...LEGAL_KEYWORDS.keywords,
  ...HEALTH_KEYWORDS.keywords,
  ...EDUCATION_KEYWORDS.keywords,
  ...MEDIA_KEYWORDS.keywords,
  ...WRITING_KEYWORDS.keywords,
  ...REALESTATE_KEYWORDS.keywords,
  ...HR_KEYWORDS.keywords,
  ...LOGISTICS_KEYWORDS.keywords,
  ...HOSPITALITY_KEYWORDS.keywords,
  ...CYBERSECURITY_KEYWORDS.keywords,
  ...DATA_KEYWORDS.keywords
];

/**
 * Location keywords for parsing
 */
export const LOCATION_KEYWORDS = [
  'in', 'at', 'from', 'located in', 'based in', 'near', 'around'
];

/**
 * Rating keywords for parsing
 */
export const RATING_KEYWORDS = [
  'star', 'stars', 'rated', 'rating', 'top rated', 'highly rated'
];

/**
 * Get category for a matched keyword with smarter matching
 */
export function getCategoryForKeyword(keyword: string): string | null {
  const lowerKeyword = keyword.toLowerCase().trim();
  const allMappings = [
    TECH_KEYWORDS,
    DESIGN_KEYWORDS,
    MARKETING_KEYWORDS,
    BUSINESS_KEYWORDS,
    FINANCE_KEYWORDS,
    LEGAL_KEYWORDS,
    HEALTH_KEYWORDS,
    EDUCATION_KEYWORDS,
    MEDIA_KEYWORDS,
    WRITING_KEYWORDS,
    REALESTATE_KEYWORDS,
    HR_KEYWORDS,
    LOGISTICS_KEYWORDS,
    HOSPITALITY_KEYWORDS,
    CYBERSECURITY_KEYWORDS,
    DATA_KEYWORDS
  ];

  for (const mapping of allMappings) {
    // Exact match
    if (mapping.keywords.some(k => k.toLowerCase() === lowerKeyword)) {
      return mapping.category || null;
    }
    
    // Partial match
    if (mapping.keywords.some(k => k.toLowerCase().includes(lowerKeyword) || lowerKeyword.includes(k.toLowerCase()))) {
      return mapping.category || null;
    }
  }

  // Handle common variations and synonyms
  const categoryMappings: { [key: string]: string } = {
    'consulting': 'Business Consulting',
    'consultant': 'Business Consulting',
    'business': 'Business Consulting',
    'marketing': 'Marketing',
    'developer': 'Software Development',
    'designer': 'Design',
    'photographer': 'Media & Entertainment',
    'lawyer': 'Legal Services',
    'doctor': 'Health & Wellness',
    'teacher': 'Education',
    'financial': 'Financial Services',
    'accountant': 'Financial Services',
    'it': 'Software Development',
    'web': 'Web Development',
    'software': 'Software Development'
  };

  for (const [key, category] of Object.entries(categoryMappings)) {
    if (lowerKeyword.includes(key)) {
      return category;
    }
  }

  return null;
}