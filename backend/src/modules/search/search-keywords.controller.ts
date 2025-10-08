import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchKeyword } from './search-keywords.schema';
import { SearchKeywordsService } from './search-keywords.service';

@ApiTags('search-keywords')
@Controller('search-keywords')
export class SearchKeywordsController {
  constructor(private readonly searchKeywordsService: SearchKeywordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update search keyword' })
  @ApiResponse({ status: 201, description: 'Keyword created or updated successfully' })
  async createOrUpdate(@Body() createKeywordDto: Partial<SearchKeyword>) {
    return this.searchKeywordsService.createOrUpdate(createKeywordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active search keywords' })
  @ApiResponse({ status: 200, description: 'Return all active keywords' })
  async findAll(@Query('category') category?: string) {
    return this.searchKeywordsService.findAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all available categories' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async getCategories() {
    return this.searchKeywordsService.getCategories();
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions for a query' })
  @ApiResponse({ status: 200, description: 'Return search suggestions' })
  async getSuggestions(@Query('q') query: string) {
    return this.searchKeywordsService.getSuggestions(query);
  }

  @Get('expand')
  @ApiOperation({ summary: 'Expand query with related keywords' })
  @ApiResponse({ status: 200, description: 'Return expanded query' })
  async expandQuery(@Query('q') query: string) {
    return this.searchKeywordsService.expandQuery(query);
  }
}