import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchKeywordsController } from './search-keywords.controller';
import { SearchKeywordsService } from './search-keywords.service';
import { SearchKeyword, SearchKeywordSchema } from './search-keywords.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SearchKeyword.name, schema: SearchKeywordSchema }
    ])
  ],
  controllers: [SearchKeywordsController],
  providers: [SearchKeywordsService],
  exports: [SearchKeywordsService]
})
export class SearchModule {}