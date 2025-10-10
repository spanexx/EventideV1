import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KnowledgeDocument, KnowledgeDocumentDocument } from './schemas/knowledge-document.schema';
import { EmbeddingService } from './services/embedding.service';
import { KnowledgeDocumentCreateDto, KnowledgeDocumentUpdateDto } from './dtos/knowledge-document.dto';

interface SearchOptions {
  category?: string;
  tags?: string[];
  query?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectModel(KnowledgeDocument.name) 
    private readonly knowledgeDocumentModel: Model<KnowledgeDocumentDocument>,
    @Inject(forwardRef(() => EmbeddingService))
    private readonly embeddingService: EmbeddingService,
  ) {}

  async create(createDto: KnowledgeDocumentCreateDto): Promise<KnowledgeDocument> {
    this.logger.log(`Creating knowledge document: ${createDto.title}`);

    // Generate embedding for the content
    const embedding = await this.embeddingService.generateEmbedding(createDto.content);
    
    const createdDocument = new this.knowledgeDocumentModel({
      ...createDto,
      embedding,
      language: createDto.language || 'en',
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      isPublic: createDto.isPublic !== undefined ? createDto.isPublic : false,
      requiresAuthentication: createDto.requiresAuthentication !== undefined ? createDto.requiresAuthentication : false,
    });

    const savedDocument = await createdDocument.save();
    this.logger.log(`Knowledge document created with ID: ${savedDocument._id}`);
    
    return savedDocument;
  }

  async findAll(options: SearchOptions = {}): Promise<KnowledgeDocument[]> {
    this.logger.log('Finding all knowledge documents');
    
    const query: any = { isActive: true };
    
    if (options.category) {
      query.category = options.category;
    }
    
    if (options.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }
    
    const sort: any = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort by creation date, newest first
    }
    
    const documents = await this.knowledgeDocumentModel
      .find(query)
      .sort(sort)
      .skip(options.skip || 0)
      .limit(options.limit || 50)
      .exec();
    
    return documents;
  }

  async findById(id: string): Promise<KnowledgeDocument> {
    this.logger.log(`Finding knowledge document by ID: ${id}`);
    
    const document = await this.knowledgeDocumentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Knowledge document with ID ${id} not found`);
    }
    
    if (!document.isActive) {
      throw new NotFoundException(`Knowledge document with ID ${id} not found`);
    }
    
    return document;
  }

  async findByCategory(category: string, limit = 10): Promise<KnowledgeDocument[]> {
    this.logger.log(`Finding knowledge documents by category: ${category}`);
    
    return await this.knowledgeDocumentModel
      .find({ category, isActive: true })
      .limit(limit)
      .exec();
  }

  async update(id: string, updateDto: KnowledgeDocumentUpdateDto): Promise<KnowledgeDocument> {
    this.logger.log(`Updating knowledge document with ID: ${id}`);
    
    // Get the existing document to access its content if not provided in update
    const existingDocument = await this.knowledgeDocumentModel.findById(id).exec();
    if (!existingDocument) {
      throw new NotFoundException(`Knowledge document with ID ${id} not found`);
    }
    
    // If content is being updated, regenerate the embedding
    let contentForEmbedding = updateDto.content !== undefined ? updateDto.content : existingDocument.content;
    let embedding: number[] | undefined = undefined;
    
    if (updateDto.content) {
      embedding = await this.embeddingService.generateEmbedding(contentForEmbedding);
    }
    
    const updateData: any = { ...updateDto };
    if (embedding) {
      updateData.embedding = embedding;
    }
    
    const updatedDocument = await this.knowledgeDocumentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!updatedDocument) {
      throw new NotFoundException(`Knowledge document with ID ${id} not found`);
    }
    
    return updatedDocument;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing knowledge document with ID: ${id}`);
    
    const deletedDocument = await this.knowledgeDocumentModel
      .findByIdAndDelete(id)
      .exec();
    
    if (!deletedDocument) {
      throw new NotFoundException(`Knowledge document with ID ${id} not found`);
    }
  }

  async searchByText(query: string, limit = 10): Promise<KnowledgeDocument[]> {
    this.logger.log(`Searching knowledge documents by text: ${query}`);
    
    return await this.knowledgeDocumentModel
      .find({
        $text: { $search: query },
        isActive: true,
      })
      .limit(limit)
      .exec();
  }

  async getCategories(): Promise<string[]> {
    this.logger.log('Getting all knowledge document categories');
    
    const categories = await this.knowledgeDocumentModel
      .distinct('category', { isActive: true })
      .exec();
    
    return categories as string[];
  }

  async bulkCreate(documents: KnowledgeDocumentCreateDto[]): Promise<KnowledgeDocument[]> {
    this.logger.log(`Bulk creating ${documents.length} knowledge documents`);
    
    const documentsToInsert: any[] = [];
    for (const doc of documents) {
      const embedding = await this.embeddingService.generateEmbedding(doc.content);
      
      const documentToInsert = {
        ...doc,
        embedding,
        language: doc.language || 'en',
        isActive: doc.isActive !== undefined ? doc.isActive : true,
        isPublic: doc.isPublic !== undefined ? doc.isPublic : false,
        requiresAuthentication: doc.requiresAuthentication !== undefined ? doc.requiresAuthentication : false,
      };
      
      documentsToInsert.push(documentToInsert);
    }
    
    const savedDocuments: any = await this.knowledgeDocumentModel.insertMany(documentsToInsert);
    this.logger.log(`Bulk created ${savedDocuments.length} knowledge documents`);
    
    // Cast to KnowledgeDocument[] as the return type from insertMany doesn't match exactly
    return savedDocuments as unknown as KnowledgeDocument[];
  }

  async importKnowledgeDocumentsFromDirectory(directoryPath: string): Promise<void> {
    this.logger.log(`Importing knowledge documents from directory: ${directoryPath}`);
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Read all files from the directory recursively
      const files = await this.readFilesRecursively(directoryPath);
      
      // Filter only markdown files
      const markdownFiles = files.filter(file => 
        path.extname(file).toLowerCase() === '.md' && 
        path.basename(file) !== 'README.md' // Exclude README files
      );
      
      this.logger.log(`Found ${markdownFiles.length} markdown files to import`);
      
      // Process each markdown file
      for (const filePath of markdownFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          
          // Extract title from the first heading in the document
          const titleMatch = content.match(/^# (.+)$/m);
          let title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
          
          // Extract category from the directory path
          // e.g., /docs/knowledge_documents/auth/login.md -> category: 'auth-login'
          const relativePath = path.relative(directoryPath, filePath);
          let category = path.dirname(relativePath);
          
          // If the file is in the root of the knowledge_documents directory, use filename as category
          if (category === '.') {
            category = path.basename(filePath, '.md');
          } else {
            // Replace path separators with hyphens for the category
            category = category.replace(/\\/g, '-').replace(/\//g, '-');
          }
          
          // If category is empty, use a default
          if (!category || category === '') {
            category = 'general';
          }
          
          // Create or update the knowledge document
          const documentData: KnowledgeDocumentCreateDto = {
            title,
            content,
            category,
            language: 'en',
            isActive: true,
            isPublic: true,
            requiresAuthentication: false,
            tags: [category] // Add category as a tag for easier filtering
          };
          
          // Check if a document with this title and category already exists
          const existingDocument = await this.knowledgeDocumentModel.findOne({
            title: documentData.title,
            category: documentData.category,
          }).exec();
          
          if (existingDocument) {
            // Update the existing document
            await this.update((existingDocument._id as Types.ObjectId).toString(), {
              ...documentData,
              content: documentData.content, // Explicitly include content to regenerate embedding
            });
            this.logger.log(`Updated existing document: ${title} in category: ${category}`);
          } else {
            // Create a new document
            await this.create(documentData);
            this.logger.log(`Created new document: ${title} in category: ${category}`);
          }
          
        } catch (error) {
          this.logger.error(`Error processing file ${filePath}:`, error);
        }
      }
      
      this.logger.log(`Successfully imported knowledge documents from ${directoryPath}`);
      
    } catch (error) {
      this.logger.error(`Error importing knowledge documents from ${directoryPath}:`, error);
      throw error;
    }
  }

  private async readFilesRecursively(dir: string): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    
    for (const dirent of dirents) {
      const fullPath = path.join(dir, dirent.name);
      
      if (dirent.isDirectory()) {
        files.push(...await this.readFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}