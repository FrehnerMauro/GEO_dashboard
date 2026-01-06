/**
 * Category generation module
 * Derives thematic categories from website content
 */

import type { WebsiteContent, Category } from "../types.js";

export class CategoryGenerator {
  private readonly categoryTemplates = [
    {
      name: "Product",
      keywords: ["product", "feature", "solution", "offering", "service"],
      description: "Product features and capabilities",
    },
    {
      name: "Pricing",
      keywords: ["price", "cost", "pricing", "plan", "subscription", "fee"],
      description: "Pricing information and plans",
    },
    {
      name: "Comparison",
      keywords: ["compare", "vs", "versus", "alternative", "competitor"],
      description: "Comparisons with alternatives",
    },
    {
      name: "Use Cases",
      keywords: ["use case", "example", "scenario", "application", "how to"],
      description: "Use cases and applications",
    },
    {
      name: "Industry",
      keywords: ["industry", "sector", "vertical", "market", "domain"],
      description: "Industry-specific information",
    },
    {
      name: "Problems / Solutions",
      keywords: ["problem", "solution", "challenge", "issue", "solve"],
      description: "Problems addressed and solutions provided",
    },
    {
      name: "Integration",
      keywords: ["integrate", "api", "connection", "compatible", "works with"],
      description: "Integration capabilities",
    },
    {
      name: "Support",
      keywords: ["support", "help", "documentation", "guide", "tutorial"],
      description: "Support and documentation",
    },
  ];

  generateCategories(
    content: WebsiteContent,
    minConfidence: number = 0.5,
    maxCategories: number = 10
  ): Category[] {
    const categories: Category[] = [];
    const contentText = content.normalizedContent.toLowerCase();
    const allPages = content.pages.map((p) => p.url);

    for (const template of this.categoryTemplates) {
      const confidence = this.calculateCategoryConfidence(
        template,
        contentText,
        content.pages
      );

      if (confidence >= minConfidence) {
        const sourcePages = this.findRelevantPages(template, content.pages);

        categories.push({
          id: this.generateCategoryId(template.name),
          name: template.name,
          description: template.description,
          confidence,
          sourcePages: sourcePages.map((p) => p.url),
        });
      }
    }

    // Sort by confidence and limit
    return categories
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCategories);
  }

  private calculateCategoryConfidence(
    template: { keywords: string[] },
    contentText: string,
    pages: WebsiteContent["pages"]
  ): number {
    let keywordMatches = 0;
    let totalKeywords = template.keywords.length;

    for (const keyword of template.keywords) {
      if (contentText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }

    // Base confidence from keyword matches
    let confidence = keywordMatches / totalKeywords;

    // Boost confidence if found in multiple pages
    const pagesWithKeywords = pages.filter((page) => {
      const pageText = page.content.toLowerCase();
      return template.keywords.some((kw) => pageText.includes(kw.toLowerCase()));
    }).length;

    if (pages.length > 0) {
      confidence += (pagesWithKeywords / pages.length) * 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  private findRelevantPages(
    template: { keywords: string[] },
    pages: WebsiteContent["pages"]
  ): WebsiteContent["pages"] {
    return pages.filter((page) => {
      const pageText = (
        page.title +
        " " +
        page.headings.join(" ") +
        " " +
        page.content
      ).toLowerCase();

      return template.keywords.some((kw) =>
        pageText.includes(kw.toLowerCase())
      );
    });
  }

  private generateCategoryId(name: string): string {
    return `cat_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  }
}







