import { Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ChatMarkdownService } from './chat-markdown.service';

@Injectable({ providedIn: 'root' })
export class MarkdownRenderService {
  constructor(private chatMd: ChatMarkdownService) {}
  render(markdown: string | null | undefined): SafeHtml {
    return this.chatMd.render(markdown);
  }
}
