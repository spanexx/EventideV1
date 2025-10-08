import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole, SubscriptionTier } from '../../modules/users/user.schema';
import { parseLocation } from '../../modules/users/location.helper';

@Injectable()
export class UsersSeeder {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Generate a realistic rating between 3.5 and 5.0
   * Distribution: 70% high (4.5-5.0), 25% good (4.0-4.4), 5% average (3.5-3.9)
   */
  private generateRating(): number {
    const rand = Math.random();
    let rating: number;
    
    if (rand < 0.70) {
      // 70% chance: High rating (4.5-5.0)
      rating = 4.5 + Math.random() * 0.5;
    } else if (rand < 0.95) {
      // 25% chance: Good rating (4.0-4.4)
      rating = 4.0 + Math.random() * 0.4;
    } else {
      // 5% chance: Average rating (3.5-3.9)
      rating = 3.5 + Math.random() * 0.4;
    }
    
    // Round to 1 decimal place
    return Math.round(rating * 10) / 10;
  }

  /**
   * Generate a realistic review count based on rating
   * Higher ratings tend to have more reviews
   */
  private generateReviewCount(rating: number): number {
    const baseCount = Math.floor(Math.random() * 200) + 50; // 50-250 base
    const ratingBonus = Math.floor((rating - 3.5) * 100); // Higher rating = more reviews
    return baseCount + ratingBonus;
  }

  async seed() {
    console.log('🌱 Seeding users...');

    // Check if users already exist
    const existingUsers = await this.userModel.countDocuments();
    if (existingUsers > 0) {
      console.log('⚠️  Users already exist. Skipping seeding.');
      return;
    }

    // Pre-hashed password for "Test123!@#" (bcrypt hash)
    const hashedPassword = '$2b$10$rBV2kHYW7mXFZGv8tT5rKe5Y.Zx7QqJ8vK9mN1pL2oP3qR4sT5uV6';

    // Profile pictures
    const femalePicture = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg';
    const malePicture = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg';

    // Generate ratings for all users
    const generateUserRatings = () => {
      const rating = this.generateRating();
      const reviewCount = this.generateReviewCount(rating);
      return { rating, reviewCount };
    };

    const users = [
      {
        email: 'sarah.johnson@eventide.com',
        username: 'sarahjohnson',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        businessName: 'Johnson Consulting Group',
        bio: 'Strategic business consultant with 15+ years of experience helping companies scale and optimize operations. Specialized in digital transformation and process improvement.',
        location: 'San Francisco, CA, USA',
        locationDetails: parseLocation('San Francisco, CA, USA') as any,
        contactPhone: '+1-415-555-0101',
        services: ['Business Strategy', 'Digital Transformation', 'Process Optimization', 'Change Management'],
        categories: ['Business Consulting', 'Management Consulting', 'Strategy Consulting'],
        availableDurations: [30, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
        picture: femalePicture,
      } as any,
      {
        email: 'michael.chen@eventide.com',
        username: 'michaelchen',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Chen',
        businessName: 'Chen Tech Solutions',
        bio: 'Full-stack developer and technology consultant specializing in cloud architecture, microservices, and modern web applications. Passionate about building scalable solutions.',
        location: 'Seattle, WA, USA',
        locationDetails: parseLocation('Seattle, WA, USA') as any,
        contactPhone: '+1-206-555-0102',
        services: ['Web Development', 'Cloud Architecture', 'DevOps', 'Technical Consulting'],
        categories: ['Software Development', 'Web Development', 'IT Consulting', 'Cloud Services'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
        picture: malePicture,
      } as any,
      {
        email: 'emily.rodriguez@eventide.com',
        username: 'emilyrodriguez',
        password: hashedPassword,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        businessName: 'Rodriguez Marketing Agency',
        bio: 'Digital marketing strategist with expertise in SEO, content marketing, and social media management. Helping brands grow their online presence and reach their target audience.',
        location: 'Austin, TX, USA',
        locationDetails: parseLocation('Austin, TX, USA') as any,
        contactPhone: '+1-512-555-0103',
        categories: ['Digital Marketing', 'SEO/SEM', 'Content Creation', 'Social Media'],
        availableDurations: [30, 60],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
        picture: femalePicture,
      } as any,
      {
        email: 'david.kim@eventide.com',
        username: 'davidkim',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Kim',
        businessName: 'Kim Financial Advisors',
        bio: 'Certified financial planner helping individuals and businesses achieve their financial goals. Specializing in retirement planning, investment strategies, and wealth management.',
        location: 'New York, NY, USA',
        locationDetails: parseLocation('New York, NY, USA') as any,
        contactPhone: '+1-212-555-0104',
        services: ['Financial Planning', 'Investment Advisory', 'Retirement Planning', 'Tax Strategy'],
        categories: ['Financial Services', 'Accounting', 'Tax Consulting'],
        availableDurations: [45, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'jennifer.williams@eventide.com',
        username: 'jenniferwilliams',
        password: hashedPassword,
        firstName: 'Jennifer',
        lastName: 'Williams',
        businessName: 'Williams Design Studio',
        bio: 'Award-winning graphic designer and brand strategist. Creating memorable visual identities and marketing materials that help businesses stand out in competitive markets.',
        location: 'Los Angeles, CA, USA',
        locationDetails: parseLocation('Los Angeles, CA, USA') as any,
        contactPhone: '+1-310-555-0105',
        services: ['Graphic Design', 'Brand Identity', 'UI/UX Design', 'Print Design'],
        categories: ['Graphic Design', 'Branding', 'Web Development'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'robert.taylor@eventide.com',
        username: 'roberttaylor',
        password: hashedPassword,
        firstName: 'Robert',
        lastName: 'Taylor',
        businessName: 'Taylor Legal Services',
        bio: 'Business attorney with 20+ years of experience in corporate law, contract negotiation, and intellectual property. Providing practical legal solutions for startups and established businesses.',
        location: 'Boston, MA, USA',
        locationDetails: parseLocation('Boston, MA, USA') as any,
        contactPhone: '+1-617-555-0106',
        services: ['Business Law', 'Contract Review', 'Intellectual Property', 'Corporate Compliance'],
        categories: ['Legal Services'],
        availableDurations: [60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'amanda.martinez@eventide.com',
        username: 'amandamartinez',
        password: hashedPassword,
        firstName: 'Amanda',
        lastName: 'Martinez',
        businessName: 'Martinez Wellness Coaching',
        bio: 'Certified life coach and wellness expert helping professionals achieve work-life balance and personal growth. Specializing in stress management and mindfulness practices.',
        location: 'Denver, CO, USA',
        locationDetails: parseLocation('Denver, CO, USA') as any,
        contactPhone: '+1-303-555-0107',
        services: ['Life Coaching', 'Wellness Consulting', 'Stress Management', 'Career Coaching'],
        categories: ['Life Coaching', 'Health & Wellness', 'Career Coaching'],
        availableDurations: [30, 45, 60],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'james.anderson@eventide.com',
        username: 'jamesanderson',
        password: hashedPassword,
        firstName: 'James',
        lastName: 'Anderson',
        businessName: 'Anderson Data Analytics',
        bio: 'Data scientist and analytics consultant helping businesses make data-driven decisions. Expert in machine learning, predictive modeling, and business intelligence.',
        location: 'Chicago, IL, USA',
        locationDetails: parseLocation('Chicago, IL, USA') as any,
        contactPhone: '+1-312-555-0108',
        services: ['Data Analytics', 'Machine Learning', 'Business Intelligence', 'Data Visualization'],
        categories: ['Data Analytics', 'IT Consulting'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'lisa.thompson@eventide.com',
        username: 'lisathompson',
        password: hashedPassword,
        firstName: 'Lisa',
        lastName: 'Thompson',
        businessName: 'Thompson HR Solutions',
        bio: 'Human resources consultant specializing in talent acquisition, employee engagement, and organizational development. Helping companies build strong teams and positive cultures.',
        location: 'Atlanta, GA, USA',
        locationDetails: parseLocation('Atlanta, GA, USA') as any,
        contactPhone: '+1-404-555-0109',
        services: ['HR Consulting', 'Talent Acquisition', 'Employee Training', 'Performance Management'],
        categories: ['HR Consulting', 'Recruitment', 'Training & Development'],
        availableDurations: [45, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'christopher.lee@eventide.com',
        username: 'christopherlee',
        password: hashedPassword,
        firstName: 'Christopher',
        lastName: 'Lee',
        businessName: 'Lee Cybersecurity',
        bio: 'Cybersecurity expert protecting businesses from digital threats. Specializing in security audits, penetration testing, and compliance consulting.',
        location: 'Washington, DC, USA',
        locationDetails: parseLocation('Washington, DC, USA') as any,
        contactPhone: '+1-202-555-0110',
        services: ['Cybersecurity', 'Security Audits', 'Penetration Testing', 'Compliance Consulting'],
        categories: ['Cybersecurity', 'IT Consulting'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'michelle.garcia@eventide.com',
        username: 'michellegarcia',
        password: hashedPassword,
        firstName: 'Michelle',
        lastName: 'Garcia',
        businessName: 'Garcia Real Estate Consulting',
        bio: 'Real estate consultant and investment advisor with expertise in commercial properties and market analysis. Helping clients make informed real estate decisions.',
        location: 'Miami, FL, USA',
        locationDetails: parseLocation('Miami, FL, USA') as any,
        contactPhone: '+1-305-555-0111',
        services: ['Real Estate Consulting', 'Investment Analysis', 'Property Management', 'Market Research'],
        categories: ['Real Estate', 'Property Management'],
        availableDurations: [60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'daniel.white@eventide.com',
        username: 'danielwhite',
        password: hashedPassword,
        firstName: 'Daniel',
        lastName: 'White',
        businessName: 'White Photography Studio',
        bio: 'Professional photographer specializing in corporate headshots, product photography, and event coverage. Creating stunning visuals that tell your brand story.',
        location: 'Portland, OR, USA',
        locationDetails: parseLocation('Portland, OR, USA') as any,
        contactPhone: '+1-503-555-0112',
        services: ['Corporate Photography', 'Product Photography', 'Event Coverage', 'Photo Editing'],
        categories: ['Photography'],
        availableDurations: [90, 120, 180],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'patricia.harris@eventide.com',
        username: 'patriciaharris',
        password: hashedPassword,
        firstName: 'Patricia',
        lastName: 'Harris',
        businessName: 'Harris Content Writing',
        bio: 'Professional content writer and copywriter creating compelling content for websites, blogs, and marketing materials. Specializing in B2B and tech industries.',
        location: 'Nashville, TN, USA',
        locationDetails: parseLocation('Nashville, TN, USA') as any,
        contactPhone: '+1-615-555-0113',
        services: ['Content Writing', 'Copywriting', 'Blog Writing', 'Technical Writing'],
        categories: ['Writing', 'Content Creation'],
        availableDurations: [30, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'kevin.clark@eventide.com',
        username: 'kevinclark',
        password: hashedPassword,
        firstName: 'Kevin',
        lastName: 'Clark',
        businessName: 'Clark Mobile Development',
        bio: 'Mobile app developer specializing in iOS and Android applications. Building user-friendly mobile experiences that drive engagement and business growth.',
        location: 'San Diego, CA, USA',
        locationDetails: parseLocation('San Diego, CA, USA') as any,
        contactPhone: '+1-619-555-0114',
        services: ['iOS Development', 'Android Development', 'Mobile UI/UX', 'App Consulting'],
        categories: ['Mobile Development', 'Software Development'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'stephanie.lewis@eventide.com',
        username: 'stephanielewis',
        password: hashedPassword,
        firstName: 'Stephanie',
        lastName: 'Lewis',
        businessName: 'Lewis Event Planning',
        bio: 'Professional event planner creating memorable corporate events, conferences, and team-building experiences. Attention to detail and flawless execution guaranteed.',
        location: 'Las Vegas, NV, USA',
        locationDetails: parseLocation('Las Vegas, NV, USA') as any,
        contactPhone: '+1-702-555-0115',
        services: ['Event Planning', 'Conference Management', 'Team Building', 'Venue Selection'],
        categories: ['Event Planning', 'Hospitality'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'brian.walker@eventide.com',
        username: 'brianwalker',
        password: hashedPassword,
        firstName: 'Brian',
        lastName: 'Walker',
        businessName: 'Walker Supply Chain Solutions',
        bio: 'Supply chain consultant optimizing logistics and operations for businesses. Expert in inventory management, procurement, and distribution strategies.',
        location: 'Dallas, TX, USA',
        locationDetails: parseLocation('Dallas, TX, USA') as any,
        contactPhone: '+1-214-555-0116',
        services: ['Supply Chain Management', 'Logistics Consulting', 'Inventory Optimization', 'Procurement'],
        categories: ['Logistics', 'Supply Chain', 'Transportation'],
        availableDurations: [60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'nicole.hall@eventide.com',
        username: 'nicolehall',
        password: hashedPassword,
        firstName: 'Nicole',
        lastName: 'Hall',
        businessName: 'Hall Public Relations',
        bio: 'PR specialist helping brands build and maintain positive public image. Expert in media relations, crisis management, and strategic communications.',
        location: 'Philadelphia, PA, USA',
        locationDetails: parseLocation('Philadelphia, PA, USA') as any,
        contactPhone: '+1-215-555-0117',
        services: ['Public Relations', 'Media Relations', 'Crisis Management', 'Press Release Writing'],
        categories: ['Digital Marketing', 'Content Creation'],
        availableDurations: [45, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'thomas.allen@eventide.com',
        username: 'thomasallen',
        password: hashedPassword,
        firstName: 'Thomas',
        lastName: 'Allen',
        businessName: 'Allen Business Intelligence',
        bio: 'Business intelligence consultant helping organizations leverage data for strategic decision-making. Specializing in BI tools, dashboards, and reporting solutions.',
        location: 'Phoenix, AZ, USA',
        locationDetails: parseLocation('Phoenix, AZ, USA') as any,
        contactPhone: '+1-602-555-0118',
        services: ['Business Intelligence', 'Data Warehousing', 'Dashboard Development', 'Reporting Solutions'],
        categories: ['Data Analytics', 'IT Consulting'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'rebecca.young@eventide.com',
        username: 'rebeccayoung',
        password: hashedPassword,
        firstName: 'Rebecca',
        lastName: 'Young',
        businessName: 'Young Translation Services',
        bio: 'Professional translator and localization expert fluent in 5 languages. Helping businesses expand globally with accurate and culturally appropriate translations.',
        location: 'Houston, TX, USA',
        locationDetails: parseLocation('Houston, TX, USA') as any,
        contactPhone: '+1-713-555-0119',
        services: ['Translation', 'Localization', 'Interpretation', 'Cultural Consulting'],
        categories: ['Translation'],
        availableDurations: [30, 60, 90],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
      picture: malePicture,
      } as any,
      {
        email: 'steven.king@eventide.com',
        username: 'stevenking',
        password: hashedPassword,
        firstName: 'Steven',
        lastName: 'King',
        businessName: 'King Sales Training',
        bio: 'Sales coach and trainer helping teams improve their sales performance and close more deals. Expert in consultative selling and negotiation strategies.',
        location: 'Minneapolis, MN, USA',
        locationDetails: parseLocation('Minneapolis, MN, USA') as any,
        contactPhone: '+1-612-555-0120',
        services: ['Sales Training', 'Sales Coaching', 'Negotiation Skills', 'Team Development'],
        categories: ['Sales Training', 'Business Development', 'Training & Development'],
        availableDurations: [60, 90, 120],
        ...generateUserRatings(),
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.PREMIUM,
        isActive: true,
        isEmailVerified: true,
        picture: malePicture,
      },
    ];

    // Add 30 more diverse providers
    const additionalProviders = [
      { firstName: 'Maria', lastName: 'Santos', business: 'Santos Architecture', category: 'Architecture', services: ['Architectural Design', 'Interior Design', 'Project Management'], gender: 'female' },
      { firstName: 'John', lastName: 'Miller', business: 'Miller Tax Services', category: 'Tax Consulting', services: ['Tax Preparation', 'Tax Planning', 'IRS Representation'], gender: 'male' },
      { firstName: 'Angela', lastName: 'Davis', business: 'Davis Fitness Studio', category: 'Fitness', services: ['Personal Training', 'Nutrition Coaching', 'Group Classes'], gender: 'female' },
      { firstName: 'Carlos', lastName: 'Rodriguez', business: 'Rodriguez Catering', category: 'Catering', services: ['Event Catering', 'Menu Planning', 'Corporate Events'], gender: 'male' },
      { firstName: 'Linda', lastName: 'Brown', business: 'Brown Videography', category: 'Videography', services: ['Corporate Videos', 'Event Coverage', 'Video Editing'], gender: 'female' },
      { firstName: 'Michael', lastName: 'Wilson', business: 'Wilson Security', category: 'Cybersecurity', services: ['Security Consulting', 'Network Security', 'Compliance'], gender: 'male' },
      { firstName: 'Jessica', lastName: 'Moore', business: 'Moore Social Media', category: 'Social Media', services: ['Social Media Management', 'Content Creation', 'Analytics'], gender: 'female' },
      { firstName: 'David', lastName: 'Taylor', business: 'Taylor Cloud Solutions', category: 'Cloud Services', services: ['Cloud Migration', 'AWS Consulting', 'DevOps'], gender: 'male' },
      { firstName: 'Sarah', lastName: 'Anderson', business: 'Anderson Branding', category: 'Branding', services: ['Brand Strategy', 'Logo Design', 'Brand Guidelines'], gender: 'female' },
      { firstName: 'Robert', lastName: 'Thomas', business: 'Thomas Data Science', category: 'Data Analytics', services: ['Data Analysis', 'Predictive Modeling', 'Data Visualization'], gender: 'male' },
      { firstName: 'Michelle', lastName: 'Jackson', business: 'Jackson Recruitment', category: 'Recruitment', services: ['Executive Search', 'Talent Acquisition', 'Screening'], gender: 'female' },
      { firstName: 'James', lastName: 'White', business: 'White Mobile Apps', category: 'Mobile Development', services: ['iOS Development', 'Android Development', 'App Design'], gender: 'male' },
      { firstName: 'Jennifer', lastName: 'Harris', business: 'Harris Health Coaching', category: 'Health & Wellness', services: ['Health Coaching', 'Wellness Programs', 'Nutrition'], gender: 'female' },
      { firstName: 'William', lastName: 'Martin', business: 'Martin Supply Chain', category: 'Supply Chain', services: ['Supply Chain Optimization', 'Logistics', 'Procurement'], gender: 'male' },
      { firstName: 'Elizabeth', lastName: 'Thompson', business: 'Thompson SEO', category: 'SEO/SEM', services: ['SEO Optimization', 'SEM Campaigns', 'Keyword Research'], gender: 'female' },
      { firstName: 'Richard', lastName: 'Garcia', business: 'Garcia Financial Planning', category: 'Financial Services', services: ['Financial Planning', 'Investment Strategy', 'Retirement'], gender: 'male' },
      { firstName: 'Barbara', lastName: 'Martinez', business: 'Martinez Event Planning', category: 'Event Planning', services: ['Wedding Planning', 'Corporate Events', 'Venue Selection'], gender: 'female' },
      { firstName: 'Joseph', lastName: 'Robinson', business: 'Robinson Legal', category: 'Legal Services', services: ['Contract Law', 'Business Law', 'Legal Consulting'], gender: 'male' },
      { firstName: 'Susan', lastName: 'Clark', business: 'Clark Writing Services', category: 'Writing', services: ['Content Writing', 'Copywriting', 'Editing'], gender: 'female' },
      { firstName: 'Thomas', lastName: 'Rodriguez', business: 'Rodriguez Photography', category: 'Photography', services: ['Portrait Photography', 'Commercial Photography', 'Editing'], gender: 'male' },
      { firstName: 'Karen', lastName: 'Lewis', business: 'Lewis HR Consulting', category: 'HR Consulting', services: ['HR Strategy', 'Employee Relations', 'Compliance'], gender: 'female' },
      { firstName: 'Charles', lastName: 'Lee', business: 'Lee Web Development', category: 'Web Development', services: ['Website Development', 'E-commerce', 'Web Design'], gender: 'male' },
      { firstName: 'Nancy', lastName: 'Walker', business: 'Walker Translation', category: 'Translation', services: ['Document Translation', 'Interpretation', 'Localization'], gender: 'female' },
      { firstName: 'Daniel', lastName: 'Hall', business: 'Hall Business Development', category: 'Business Development', services: ['Sales Strategy', 'Market Research', 'Partnership Development'], gender: 'male' },
      { firstName: 'Lisa', lastName: 'Allen', business: 'Allen Property Management', category: 'Property Management', services: ['Property Management', 'Tenant Relations', 'Maintenance'], gender: 'female' },
      { firstName: 'Paul', lastName: 'Young', business: 'Young Training', category: 'Training & Development', services: ['Corporate Training', 'Leadership Development', 'Workshops'], gender: 'male' },
      { firstName: 'Betty', lastName: 'Hernandez', business: 'Hernandez Accounting', category: 'Accounting', services: ['Bookkeeping', 'Tax Preparation', 'Financial Statements'], gender: 'female' },
      { firstName: 'Mark', lastName: 'King', business: 'King IT Consulting', category: 'IT Consulting', services: ['IT Strategy', 'System Integration', 'Tech Support'], gender: 'male' },
      { firstName: 'Sandra', lastName: 'Wright', business: 'Wright Career Coaching', category: 'Career Coaching', services: ['Career Counseling', 'Resume Writing', 'Interview Prep'], gender: 'female' },
      { firstName: 'Steven', lastName: 'Lopez', business: 'Lopez Logistics', category: 'Logistics', services: ['Freight Management', 'Warehouse Solutions', 'Distribution'], gender: 'male' },
    ];

    // Generate additional users from template
    additionalProviders.forEach((provider, index) => {
      const baseNumber = 21 + index;
      const username = `${provider.firstName.toLowerCase()}${provider.lastName.toLowerCase()}`;
      const email = `${username}@eventide.com`;
      const phone = `+1-${(200 + Math.floor(index / 10)).toString().padStart(3, '0')}-555-${(baseNumber * 10).toString().padStart(4, '0')}`;
      const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Austin, TX'];
      const locationString = locations[index % locations.length] + ', USA';
      
      // Generate ratings for this user
      const { rating, reviewCount } = generateUserRatings();
      
      users.push({
        email,
        username,
        password: hashedPassword,
        firstName: provider.firstName,
        lastName: provider.lastName,
        businessName: provider.business,
        bio: `Professional ${provider.category.toLowerCase()} specialist providing top-quality services. Experienced in ${provider.services.join(', ').toLowerCase()}.`,
        location: locationString,
        locationDetails: parseLocation(locationString) as any,
        contactPhone: phone,
        services: provider.services,
        categories: [provider.category],
        availableDurations: [30, 60, 90],
        rating,
        reviewCount,
        role: UserRole.PROVIDER,
        subscriptionTier: rating >= 4.7 ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE,
        isActive: true,
        isEmailVerified: true,
        picture: provider.gender === 'female' ? femalePicture : malePicture,
      } as any);
    });

    console.log(`📝 Prepared ${users.length} users for seeding...`);

    const createdUsers = await this.userModel.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    return createdUsers;
  }

  async clear() {
    console.log('🗑️  Clearing users...');
    await this.userModel.deleteMany({});
    console.log('✅ Users cleared');
  }
}
