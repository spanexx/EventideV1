import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeBaseService } from '../knowledge-base.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KnowledgeDocumentImportService {
  private readonly logger = new Logger(KnowledgeDocumentImportService.name);

  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  async importDocumentsFromDirectory(dirPath: string): Promise<void> {
    this.logger.log(`Importing knowledge documents from directory: ${dirPath}`);

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        await this.importMarkdownFile(path.join(dirPath, file));
      } else if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
        // Recursively process subdirectories
        await this.importDocumentsFromDirectory(path.join(dirPath, file));
      }
    }
  }

  async importMarkdownFile(filePath: string): Promise<void> {
    this.logger.log(`Importing markdown file: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath, '.md');
    const dirname = path.basename(path.dirname(filePath));

    // Extract title from first line if it starts with #, otherwise use filename
    const lines = content.split('\n');
    let title = filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (lines[0].startsWith('# ')) {
      title = lines[0].substring(2).trim();
    }

    // Create knowledge document
    const createDto = {
      title,
      content,
      category: `page-${dirname}-${filename}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      tags: ['page-specific', dirname],
      isActive: true,
      isPublic: true,
    };

    try {
      await this.knowledgeBaseService.create(createDto);
      this.logger.log(`Successfully imported document: ${title}`);
    } catch (error) {
      this.logger.error(`Error importing document ${title}:`, error);
    }
  }
}