import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Injectable({ providedIn: 'root' })
export class ChatMarkdownService {
  constructor(private sanitizer: DomSanitizer) {
    marked.setOptions({ gfm: true, breaks: true });
  }

  render(markdown: string | null | undefined): SafeHtml {
    if (!markdown) return '' as unknown as SafeHtml;

    // 1) Normalize and convert route-like artifacts to spans BEFORE markdown
    const normalized = this.normalizeRouteArtifacts(markdown);

    // 2) Parse markdown
    const html = marked.parse(normalized) as string;

    // 3) Sanitize and trust so data-* attributes are preserved for routing
    const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    return this.sanitizer.bypassSecurityTrustHtml(safe);
  }

  private normalizeRouteArtifacts(input: string): string {
    let s = String(input);

    // <route-link text="Text" route="/path">Text</route-link>
    const tagRegex = /<route-link\s+text="([^"]+)"\s+route="([^"]+)">([^<]*)<\/route-link>/g;
    s = s.replace(tagRegex, (_m, text, route) => {
      const cleanText = String(text || '').trim();
      let cleanRoute = String(route || '').trim();
      if (cleanRoute && !cleanRoute.startsWith('/')) cleanRoute = '/' + cleanRoute;
      return this.span(cleanText, cleanRoute);
    });

    // [Text](/route)
    const bracketRegex = /\[([^\]]+)\]\((\/[a-zA-Z0-9_\-\/]+)\)/g;
    s = s.replace(bracketRegex, (_m, text, route) => {
      const cleanText = String(text || '').trim();
      const cleanRoute = String(route || '').trim();
      return this.span(cleanText, cleanRoute);
    });

    // /route(link)
    const linkArtifact = /(\/[a-zA-Z0-9_\-\/]+)\(link\)/g;
    s = s.replace(linkArtifact, (_m, route) => this.span(this.label(route), route));

    // /route(l ink) or spaced variants of "link"
    const linkArtifactSpaced = /(\/[a-zA-Z0-9_\-\/]+)\(l\s*i\s*n\s*k\)/gi;
    s = s.replace(linkArtifactSpaced, (_m, route) => this.span(this.label(route), route));

    // Duplicate: /route(/route)
    const dupParen = /(\/[a-zA-Z0-9_\-\/]+)\s*\(\s*\1\s*\)/g;
    s = s.replace(dupParen, (_m, route) => this.span(this.label(route), route));

    // Trailing: /route)
    const trailingParen = /(\/[a-zA-Z0-9_\-\/]+)\s*\)/g;
    s = s.replace(trailingParen, (_m, route) => this.span(this.label(route), route));

    return s;
  }

  private span(text: string, route: string): string {
    const cleanText = String(text || '').trim();
    const cleanRoute = String(route || '').trim();
    const fixedRoute = cleanRoute.startsWith('/') ? cleanRoute : ('/' + cleanRoute);
    return `<span class="route-link clickable-route" data-route="${fixedRoute}" data-text="${cleanText}" tabindex="0" role="link">${cleanText}</span>`;
  }

  private label(route: string): string {
    const r = String(route || '').trim();
    const map: Record<string, string> = {
      '/auth/login': 'Login',
      '/auth/signup': 'Sign up',
      '/dashboard/overview': 'Overview',
      '/dashboard/bookings': 'Bookings',
      '/providers': 'Providers',
    };
    return map[r] || r;
  }
}
