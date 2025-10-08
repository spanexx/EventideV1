import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchKeyword, SearchKeywordDocument } from './search-keywords.schema';

@Injectable()
export class SearchKeywordsService {
  private readonly logger = new Logger(SearchKeywordsService.name);

  constructor(
    @InjectModel(SearchKeyword.name) private searchKeywordModel: Model<SearchKeywordDocument>,
  ) {}

  async createOrUpdate(createKeywordDto: Partial<SearchKeyword>) {
    try {
      const existing = await this.searchKeywordModel.findOne({ 
        keyword: createKeywordDto.keyword 
      }).exec();
      
      if (existing) {
        // Update existing keyword
        Object.assign(existing, createKeywordDto);
        return existing.save();
      } else {
        // Create new keyword
        const createdKeyword = new this.searchKeywordModel(createKeywordDto);
        return createdKeyword.save();
      }
    } catch (error) {
      this.logger.error('Error creating/updating keyword:', error);
      throw error;
    }
  }

  async findAll(category?: string) {
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    return this.searchKeywordModel.find(query).sort({ weight: -1 }).exec();
  }

  async getCategories() {
    return this.searchKeywordModel.distinct('category', { isActive: true }).exec();
  }

  async getSuggestions(query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const regex = new RegExp(query, 'i');
    return this.searchKeywordModel
      .find({ 
        isActive: true,
        $or: [
          { keyword: regex },
          { synonyms: regex }
        ]
      })
      .limit(10)
      .sort({ weight: -1 })
      .select('keyword category')
      .exec();
  }

  async expandQuery(query: string) {
    if (!query) return query;
    
    const keywords = query.toLowerCase().split(/\s+/);
    const expandedKeywords = new Set<string>(keywords);
    
    // Find related keywords for each term
    for (const keyword of keywords) {
      const dbKeyword = await this.searchKeywordModel.findOne({ 
        isActive: true,
        $or: [
          { keyword: new RegExp(`^${keyword}$`, 'i') },
          { synonyms: new RegExp(`^${keyword}$`, 'i') }
        ]
      }).exec();
      
      if (dbKeyword) {
        // Add related keywords
        dbKeyword.relatedKeywords.forEach(related => expandedKeywords.add(related));
        // Add synonyms
        dbKeyword.synonyms.forEach(synonym => expandedKeywords.add(synonym));
      }
    }
    
    return Array.from(expandedKeywords).join(' ');
  }

  async initializeDefaultKeywords() {
    this.logger.log('Initializing default search keywords...');
    
    // Import the static keywords from the existing file
    const defaultKeywords = [
      // Technology & Development
      ...this.createKeywordsForCategory('Software Development', [
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
      ]),
      
      // Design & Creative
      ...this.createKeywordsForCategory('Design', [
        'designer', 'graphic designer', 'ui designer', 'ux designer', 'ui/ux',
        'web designer', 'product designer', 'visual designer',
        'illustrator', 'artist', 'creative', 'branding',
        'logo', 'brand identity', 'design',
        'photoshop', 'figma', 'sketch', 'adobe', 'illustrator',
        'motion graphics', 'animation', 'animator',
        'interior designer', 'architect', 'architectural design',
        '3d designer', 'cad', 'modeling'
      ]),
      
      // Business & Consulting
      ...this.createKeywordsForCategory('Business Consulting', [
        'consultant', 'business consultant', 'management consultant',
        'strategy', 'strategist', 'business strategy', 'strategic planning',
        'business analyst', 'data analyst', 'analytics',
        'project manager', 'product manager', 'scrum master', 'agile coach',
        'operations', 'operations manager', 'process improvement',
        'business development', 'sales', 'sales consultant',
        'entrepreneur', 'startup advisor', 'business coach',
        'change management', 'transformation', 'business consulting'
      ]),
      
      // Add more categories as needed...
    ];
    
    for (const keywordData of defaultKeywords) {
      await this.createOrUpdate(keywordData);
    }
    
    this.logger.log('Default search keywords initialized');
  }

  private createKeywordsForCategory(category: string, keywords: string[]) {
    return keywords.map(keyword => ({
      keyword,
      category,
      weight: 1,
      isActive: true,
      synonyms: [],
      relatedKeywords: []
    }));
  }
}