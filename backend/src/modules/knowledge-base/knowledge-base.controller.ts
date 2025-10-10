import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { RAGService } from './services/rag.service';
import * as dto from './dtos/knowledge-document.dto';

type KnowledgeDocumentCreateDto = dto.KnowledgeDocumentCreateDto;
type KnowledgeDocumentUpdateDto = dto.KnowledgeDocumentUpdateDto;

@ApiTags('knowledge-base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly ragService: RAGService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge document' })
  @ApiResponse({ status: 201, description: 'Successfully created knowledge document' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createDto: KnowledgeDocumentCreateDto) {
    return await this.knowledgeBaseService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all knowledge documents with optional filters' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved knowledge documents' })
  async findAll(
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('query') query?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const options = {
      category,
      tags: tags ? tags.split(',') : undefined,
      query,
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 'asc' as const : 'desc' as const,
    };

    return await this.knowledgeBaseService.findAll(options);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all available knowledge document categories' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved categories' })
  async getCategories() {
    return await this.knowledgeBaseService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find knowledge document by ID' })
  @ApiParam({ name: 'id', description: 'Knowledge document ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved knowledge document' })
  @ApiResponse({ status: 404, description: 'Knowledge document not found' })
  async findById(@Param('id') id: string) {
    try {
      return await this.knowledgeBaseService.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update knowledge document by ID' })
  @ApiParam({ name: 'id', description: 'Knowledge document ID' })
  @ApiResponse({ status: 200, description: 'Successfully updated knowledge document' })
  @ApiResponse({ status: 404, description: 'Knowledge document not found' })
  async update(@Param('id') id: string, @Body() updateDto: KnowledgeDocumentUpdateDto) {
    try {
      return await this.knowledgeBaseService.update(id, updateDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge document by ID' })
  @ApiParam({ name: 'id', description: 'Knowledge document ID' })
  @ApiResponse({ status: 200, description: 'Successfully deleted knowledge document' })
  @ApiResponse({ status: 404, description: 'Knowledge document not found' })
  async remove(@Param('id') id: string) {
    try {
      await this.knowledgeBaseService.remove(id);
      return { message: 'Knowledge document deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Search knowledge documents by content' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved search results' })
  async searchByText(@Body('query') query: string, @Body('limit') limit: number = 10) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }
    
    return await this.knowledgeBaseService.searchByText(query, limit);
  }

  @Post('rag-search')
  @ApiOperation({ summary: 'Perform RAG semantic search' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved RAG search results' })
  async ragSearch(
    @Body('query') query: string, 
    @Body('limit') limit: number = 5,
    @Body('category') category?: string,
    @Body('minSimilarity') minSimilarity: number = 0.5,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }
    
    return await this.ragService.semanticSearch(query, limit, category, minSimilarity);
  }

  @Post('rag-generate')
  @ApiOperation({ summary: 'Generate response using RAG' })
  @ApiResponse({ status: 200, description: 'Successfully generated RAG response' })
  async generateWithRAG(
    @Body('query') query: string,
    @Body('systemPrompt') systemPrompt?: string,
    @Body('category') category?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }
    
    return await this.ragService.generateResponseWithRAG(query, systemPrompt, category);
  }

  @Post('import-from-directory')
  @ApiOperation({ summary: 'Import knowledge documents from a directory' })
  @ApiResponse({ status: 200, description: 'Successfully imported knowledge documents' })
  async importFromDirectory(
    @Body('directoryPath') directoryPath: string,
  ) {
    if (!directoryPath) {
      throw new BadRequestException('Directory path is required');
    }
    
    await this.knowledgeBaseService.importKnowledgeDocumentsFromDirectory(directoryPath);
    return { message: `Successfully imported knowledge documents from ${directoryPath}` };
  }
}