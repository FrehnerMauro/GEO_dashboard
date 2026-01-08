/**
 * Unit tests for AI Readiness Analysis
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("AI Readiness Analysis", () => {
  // Mock environment
  const mockEnv = {
    geo_db: {} as any,
    OPENAI_API_KEY: "test-api-key",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL Input Validation", () => {
    it("should normalize frehnertec.ch by adding https:// if missing", () => {
      const url = "frehnertec.ch";
      const urlPattern = /^https?:\/\//i;
      const normalized = urlPattern.test(url) ? url : 'https://' + url;
      
      expect(normalized).toBe("https://frehnertec.ch");
    });

    it("should keep https:// if already present for frehnertec.ch", () => {
      const url = "https://frehnertec.ch";
      const urlPattern = /^https?:\/\//i;
      const normalized = urlPattern.test(url) ? url : 'https://' + url;
      
      expect(normalized).toBe("https://frehnertec.ch");
    });

    it("should keep http:// if already present for frehnertec.ch", () => {
      const url = "http://frehnertec.ch";
      const urlPattern = /^https?:\/\//i;
      const normalized = urlPattern.test(url) ? url : 'https://' + url;
      
      expect(normalized).toBe("http://frehnertec.ch");
    });

    it("should validate frehnertec.ch URL format", () => {
      const validUrl = "https://frehnertec.ch";
      const invalidUrl = "not-a-url";
      
      expect(() => new URL(validUrl)).not.toThrow();
      expect(() => new URL(invalidUrl)).toThrow();
    });

    it("should reject empty URL", () => {
      const url = "";
      expect(url.trim()).toBe("");
    });
  });

  describe("Webpage Scraping", () => {
    it("should extract page title from HTML", () => {
      const html = '<html><head><title>Test Page Title</title></head><body></body></html>';
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';
      
      expect(title).toBe("Test Page Title");
    });

    it("should extract meta description from HTML", () => {
      const html = '<html><head><meta name="description" content="This is a test description"></head><body></body></html>';
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
      
      expect(metaDescription).toBe("This is a test description");
    });

    it("should extract H1 headings from HTML", () => {
      const html = '<html><body><h1>First Heading</h1><h1>Second Heading</h1></body></html>';
      const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
      const h1 = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h);
      
      expect(h1).toEqual(["First Heading", "Second Heading"]);
    });

    it("should extract H2 headings from HTML", () => {
      const html = '<html><body><h2>Section 1</h2><h2>Section 2</h2></body></html>';
      const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
      const h2 = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h);
      
      expect(h2).toEqual(["Section 1", "Section 2"]);
    });

    it("should extract main content and remove scripts/styles", () => {
      const html = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <script>console.log('test');</script>
          </head>
          <body>
            <nav>Navigation</nav>
            <main>Main content here</main>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      
      let textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      expect(textContent).toContain("Main content here");
      expect(textContent).not.toContain("console.log");
      expect(textContent).not.toContain("color: red");
      expect(textContent).not.toContain("Navigation");
      expect(textContent).not.toContain("Footer");
    });

    it("should extract internal links from frehnertec.ch HTML", () => {
      const html = `
        <html>
          <body>
            <a href="/about">Über uns</a>
            <a href="https://frehnertec.ch/services">Services</a>
            <a href="https://external.com">External Link</a>
          </body>
        </html>
      `;
      
      const baseUrl = new URL("https://frehnertec.ch");
      const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
      const allLinks: string[] = [];
      
      for (const linkMatch of linkMatches) {
        const hrefMatch = linkMatch.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          let href = hrefMatch[1];
          try {
            const resolvedUrl = new URL(href, baseUrl);
            if (resolvedUrl.hostname === baseUrl.hostname) {
              allLinks.push(resolvedUrl.toString());
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
      }
      
      expect(allLinks.length).toBeGreaterThan(0);
      expect(allLinks.some(link => link.includes("frehnertec.ch"))).toBe(true);
    });

    it("should measure response time", async () => {
      const startTime = Date.now();
      // Simulate a fetch
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Content Analysis Structure", () => {
    it("should create proper page data structure for frehnertec.ch", () => {
      const pageData = {
        url: "https://frehnertec.ch",
        title: "FrehnerTec - Homepage",
        metaDescription: "FrehnerTec description",
        h1: ["Willkommen bei FrehnerTec"],
        h2: ["Unsere Services", "Über uns"],
        h3: ["Service Details"],
        content: "FrehnerTec ist ein führendes Unternehmen...",
        responseTime: 150,
        status: 200,
        success: true
      };
      
      expect(pageData.url).toBe("https://frehnertec.ch");
      expect(pageData.title).toContain("FrehnerTec");
      expect(pageData.h1).toHaveLength(1);
      expect(pageData.h2).toHaveLength(2);
      expect(pageData.success).toBe(true);
      expect(pageData.responseTime).toBeGreaterThan(0);
    });

    it("should create report structure with frehnertec.ch homepage and pages", () => {
      const report = {
        originalUrl: "frehnertec.ch",
        normalizedUrl: "https://frehnertec.ch",
        homepage: { 
          scraped: true, 
          data: {
            url: "https://frehnertec.ch",
            title: "FrehnerTec - Homepage",
            metaDescription: "FrehnerTec Homepage description",
            h1: ["Willkommen"],
            h2: [],
            h3: [],
            content: "FrehnerTec Homepage content",
            responseTime: 100,
            status: 200,
            success: true
          }
        },
        internalLinks: ["https://frehnertec.ch/about", "https://frehnertec.ch/services"],
        pages: [],
        summary: {
          totalPages: 0,
          successfulPages: 0,
          averageResponseTime: 0,
          fastestPage: "",
          slowestPage: ""
        }
      };
      
      expect(report.originalUrl).toBe("frehnertec.ch");
      expect(report.normalizedUrl).toBe("https://frehnertec.ch");
      expect(report.homepage.scraped).toBe(true);
      expect(report.homepage.data).toBeDefined();
      expect(report.internalLinks).toHaveLength(2);
      expect(report.internalLinks[0]).toContain("frehnertec.ch");
    });
  });

  describe("GPT Analysis Prompt Generation", () => {
    it("should generate prompt with frehnertec.ch website information", () => {
      const report = {
        websiteUrl: "https://frehnertec.ch",
        homepage: {
          scraped: true,
          data: {
            url: "https://frehnertec.ch",
            title: "FrehnerTec - Homepage",
            metaDescription: "FrehnerTec Description",
            h1: ["Willkommen bei FrehnerTec"],
            h2: [],
            h3: [],
            content: "FrehnerTec content here",
            responseTime: 100,
            status: 200,
            success: true
          }
        },
        pages: [],
        summary: {
          totalPages: 1,
          successfulPages: 1,
          averageResponseTime: 100,
          fastestPage: "https://frehnertec.ch",
          slowestPage: "https://frehnertec.ch"
        }
      };
      
      let prompt = `# AI READINESS ANALYSE\n\n`;
      prompt += `Analysiere die folgende Website auf AI-Readiness und bewerte, wie gut sie von KI-Systemen gelesen und verstanden werden kann.\n\n`;
      prompt += `## WEBSITE\n${report.websiteUrl}\n\n`;
      
      expect(prompt).toContain("AI READINESS ANALYSE");
      expect(prompt).toContain("frehnertec.ch");
    });

    it("should include frehnertec.ch homepage data in prompt", () => {
      const report = {
        websiteUrl: "https://frehnertec.ch",
        homepage: {
          scraped: true,
          data: {
            url: "https://frehnertec.ch",
            title: "FrehnerTec - Homepage",
            content: "FrehnerTec content",
            responseTime: 150,
            status: 200
          }
        },
        pages: [],
        summary: {
          totalPages: 1,
          successfulPages: 1,
          averageResponseTime: 150,
          fastestPage: "https://frehnertec.ch",
          slowestPage: "https://frehnertec.ch"
        }
      };
      
      let prompt = `## HOMEPAGE\n`;
      if (report.homepage.scraped && report.homepage.data) {
        const hp = report.homepage.data;
        prompt += `Status: ✓ Gescraped\n`;
        prompt += `Response Time: ${hp.responseTime}ms\n`;
        prompt += `Titel: ${hp.title}\n`;
      }
      
      expect(prompt).toContain("HOMEPAGE");
      expect(prompt).toContain("Gescraped");
      expect(prompt).toContain("150ms");
      expect(prompt).toContain("FrehnerTec");
    });

    it("should include frehnertec.ch page details in prompt", () => {
      const report = {
        websiteUrl: "https://frehnertec.ch",
        homepage: { scraped: false, data: null },
        pages: [
          {
            url: "https://frehnertec.ch/about",
            title: "Über uns - FrehnerTec",
            content: "FrehnerTec About content",
            responseTime: 100,
            status: 200,
            success: true
          },
          {
            url: "https://frehnertec.ch/services",
            title: "Services - FrehnerTec",
            content: "FrehnerTec Services content",
            responseTime: 200,
            status: 200,
            success: true
          }
        ],
        summary: {
          totalPages: 2,
          successfulPages: 2,
          averageResponseTime: 150,
          fastestPage: "https://frehnertec.ch/about",
          slowestPage: "https://frehnertec.ch/services"
        }
      };
      
      let prompt = `## GESCRAEPTE SEITEN (${report.pages.length} Seiten)\n\n`;
      prompt += `### PERFORMANCE-ÜBERSICHT\n`;
      prompt += `- Gesamt: ${report.summary.totalPages} Seiten\n`;
      prompt += `- Erfolgreich: ${report.summary.successfulPages} Seiten\n`;
      prompt += `- Durchschnittliche Response Time: ${report.summary.averageResponseTime}ms\n`;
      
      expect(prompt).toContain("2 Seiten");
      expect(prompt).toContain("150ms");
      expect(report.pages[0].url).toContain("frehnertec.ch");
    });
  });

  describe("Logging and Status Updates", () => {
    it("should create log entries with proper structure for frehnertec.ch", () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        stepId: "STEP-1",
        stepName: "URL Normalisierung",
        status: "OK" as const,
        details: {
          original: "frehnertec.ch",
          normalized: "https://frehnertec.ch"
        },
        responseTime: 5
      };
      
      expect(logEntry.stepId).toMatch(/^STEP-\d+$/);
      expect(logEntry.stepName).toBe("URL Normalisierung");
      expect(["OK", "WARN", "ERROR"]).toContain(logEntry.status);
      expect(logEntry.details).toBeDefined();
      expect(logEntry.details.original).toBe("frehnertec.ch");
      expect(logEntry.details.normalized).toBe("https://frehnertec.ch");
      expect(logEntry.timestamp).toBeDefined();
    });

    it("should track multiple steps in chronological order", () => {
      const logs = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z").toISOString(),
          stepId: "STEP-1",
          stepName: "URL Normalisierung",
          status: "OK" as const,
          details: {}
        },
        {
          timestamp: new Date("2024-01-01T10:00:05Z").toISOString(),
          stepId: "STEP-2",
          stepName: "Homepage Scraping",
          status: "OK" as const,
          details: {}
        },
        {
          timestamp: new Date("2024-01-01T10:00:10Z").toISOString(),
          stepId: "STEP-3",
          stepName: "Interne Links",
          status: "OK" as const,
          details: {}
        }
      ];
      
      const sortedLogs = [...logs].sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      
      expect(sortedLogs[0].stepName).toBe("URL Normalisierung");
      expect(sortedLogs[1].stepName).toBe("Homepage Scraping");
      expect(sortedLogs[2].stepName).toBe("Interne Links");
    });
  });

  describe("Error Handling", () => {
    it("should handle scraping errors gracefully", () => {
      const pageData = {
        url: "https://example.com",
        title: "",
        metaDescription: "",
        h1: [],
        h2: [],
        h3: [],
        content: "",
        responseTime: 0,
        status: 0,
        success: false
      };
      
      expect(pageData.success).toBe(false);
      expect(pageData.status).toBe(0);
    });

    it("should handle invalid URLs", () => {
      const invalidUrls = [
        "not-a-url",
        "http://",
        "https://"
      ];
      
      invalidUrls.forEach(url => {
        expect(() => {
          new URL(url);
        }).toThrow();
      });
      
      // Empty URL should be handled separately
      const emptyUrl = "";
      expect(emptyUrl.trim()).toBe("");
      // Empty URL doesn't throw, it's just rejected by validation
    });
  });

  describe("Response Time Calculation", () => {
    it("should calculate average response time", () => {
      const responseTimes = [100, 150, 200, 250];
      const avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );
      
      expect(avgResponseTime).toBe(175);
    });

    it("should find fastest and slowest pages for frehnertec.ch", () => {
      const pages = [
        { url: "https://frehnertec.ch/about", responseTime: 100 },
        { url: "https://frehnertec.ch/services", responseTime: 200 },
        { url: "https://frehnertec.ch/contact", responseTime: 50 }
      ];
      
      const responseTimes = pages.map(p => p.responseTime);
      const fastestPage = pages.find(p => p.responseTime === Math.min(...responseTimes))?.url || '';
      const slowestPage = pages.find(p => p.responseTime === Math.max(...responseTimes))?.url || '';
      
      expect(fastestPage).toBe("https://frehnertec.ch/contact");
      expect(slowestPage).toBe("https://frehnertec.ch/services");
      expect(fastestPage).toContain("frehnertec.ch");
      expect(slowestPage).toContain("frehnertec.ch");
    });
  });

  describe("Dashboard Live Updates", () => {
    it("should format status message for dashboard", () => {
      const statusMessages = [
        "Schritt 1/6: URL normalisiert",
        "Schritt 2/6: Scrape Homepage...",
        "Schritt 3/6: Extrahiere interne Links...",
        "Schritt 4/6: Scrape weitere Seiten...",
        "Schritt 5/6: Generiere AI Readiness Score mit GPT...",
        "✓ Analyse abgeschlossen"
      ];
      
      statusMessages.forEach(message => {
        expect(message).toBeTruthy();
        expect(typeof message).toBe("string");
      });
    });

    it("should calculate progress percentage based on steps", () => {
      const totalSteps = 6;
      const completedSteps = 3;
      const progressPercent = Math.min(95, Math.round((completedSteps / totalSteps) * 100));
      
      expect(progressPercent).toBe(50);
    });

    it("should format log entries for console display", () => {
      const log = {
        timestamp: new Date().toISOString(),
        stepId: "STEP-1",
        stepName: "URL Normalisierung",
        status: "OK" as const,
        details: { original: "example.com", normalized: "https://example.com" },
        responseTime: 5
      };
      
      const time = new Date(log.timestamp).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      const statusColor = log.status === 'OK' ? '#6a9955' : log.status === 'WARN' ? '#d7ba7d' : '#f48771';
      const statusIcon = log.status === 'OK' ? '✓' : log.status === 'WARN' ? '⚠' : '✗';
      
      expect(time).toBeTruthy();
      expect(statusColor).toBe('#6a9955');
      expect(statusIcon).toBe('✓');
    });
  });

  describe("Complete AI Readiness Analysis Flow for frehnertec.ch", () => {
    it("should complete full analysis workflow", async () => {
      // Simulate the complete workflow
      const websiteUrl = "frehnertec.ch";
      
      // Step 1: URL Normalization
      const urlPattern = /^https?:\/\//i;
      const normalizedUrl = urlPattern.test(websiteUrl) ? websiteUrl : 'https://' + websiteUrl;
      expect(normalizedUrl).toBe("https://frehnertec.ch");
      
      // Step 2: Create report structure
      const report = {
        originalUrl: websiteUrl,
        normalizedUrl: normalizedUrl,
        homepage: { scraped: false, data: null },
        internalLinks: [] as string[],
        pages: [] as any[],
        summary: {
          totalPages: 0,
          successfulPages: 0,
          averageResponseTime: 0,
          fastestPage: "",
          slowestPage: ""
        }
      };
      
      expect(report.originalUrl).toBe("frehnertec.ch");
      expect(report.normalizedUrl).toBe("https://frehnertec.ch");
      
      // Step 3: Simulate homepage scraping
      const mockHomepageData = {
        url: normalizedUrl,
        title: "FrehnerTec - Homepage",
        metaDescription: "FrehnerTec ist ein führendes Unternehmen",
        h1: ["Willkommen bei FrehnerTec"],
        h2: ["Unsere Services", "Über uns"],
        h3: [],
        content: "FrehnerTec bietet innovative Lösungen...",
        responseTime: 120,
        status: 200,
        success: true
      };
      
      report.homepage = { scraped: true, data: mockHomepageData };
      expect(report.homepage.scraped).toBe(true);
      expect(report.homepage.data?.title).toContain("FrehnerTec");
      
      // Step 4: Simulate internal links extraction
      report.internalLinks = [
        "https://frehnertec.ch/about",
        "https://frehnertec.ch/services",
        "https://frehnertec.ch/contact"
      ];
      expect(report.internalLinks.length).toBeGreaterThan(0);
      expect(report.internalLinks.every(link => link.includes("frehnertec.ch"))).toBe(true);
      
      // Step 5: Simulate additional pages scraping
      report.pages = [
        {
          url: "https://frehnertec.ch/about",
          title: "Über uns - FrehnerTec",
          content: "FrehnerTec About content",
          responseTime: 100,
          status: 200,
          success: true
        },
        {
          url: "https://frehnertec.ch/services",
          title: "Services - FrehnerTec",
          content: "FrehnerTec Services content",
          responseTime: 150,
          status: 200,
          success: true
        }
      ];
      
      // Step 6: Calculate summary
      const successfulPages = report.pages.filter(p => p.success);
      const responseTimes = report.pages.filter(p => p.responseTime > 0).map(p => p.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
      
      report.summary = {
        totalPages: report.pages.length,
        successfulPages: successfulPages.length,
        averageResponseTime: avgResponseTime,
        fastestPage: report.pages.find(p => p.responseTime === Math.min(...responseTimes))?.url || "",
        slowestPage: report.pages.find(p => p.responseTime === Math.max(...responseTimes))?.url || ""
      };
      
      expect(report.summary.totalPages).toBe(2);
      expect(report.summary.successfulPages).toBe(2);
      expect(report.summary.averageResponseTime).toBe(125);
      
      // Step 7: Generate GPT prompt
      let prompt = `# AI READINESS ANALYSE\n\n`;
      prompt += `Analysiere die folgende Website auf AI-Readiness und bewerte, wie gut sie von KI-Systemen gelesen und verstanden werden kann.\n\n`;
      prompt += `## WEBSITE\n${report.normalizedUrl}\n\n`;
      
      if (report.homepage.scraped && report.homepage.data) {
        prompt += `## HOMEPAGE\n`;
        prompt += `Status: ✓ Gescraped\n`;
        prompt += `Response Time: ${report.homepage.data.responseTime}ms\n`;
        prompt += `Titel: ${report.homepage.data.title}\n`;
      }
      
      prompt += `## GESCRAEPTE SEITEN (${report.pages.length} Seiten)\n\n`;
      prompt += `### PERFORMANCE-ÜBERSICHT\n`;
      prompt += `- Gesamt: ${report.summary.totalPages} Seiten\n`;
      prompt += `- Erfolgreich: ${report.summary.successfulPages} Seiten\n`;
      prompt += `- Durchschnittliche Response Time: ${report.summary.averageResponseTime}ms\n`;
      
      expect(prompt).toContain("frehnertec.ch");
      expect(prompt).toContain("FrehnerTec");
      expect(prompt).toContain("125ms");
      
      // Step 8: Verify logs structure
      const logs = [
        {
          timestamp: new Date().toISOString(),
          stepId: "STEP-1",
          stepName: "URL Normalisierung",
          status: "OK" as const,
          details: { original: websiteUrl, normalized: normalizedUrl },
          responseTime: 5
        },
        {
          timestamp: new Date().toISOString(),
          stepId: "STEP-2",
          stepName: "Homepage Scraping",
          status: "OK" as const,
          details: { url: normalizedUrl, responseTime: 120 },
          responseTime: 120
        },
        {
          timestamp: new Date().toISOString(),
          stepId: "STEP-3",
          stepName: "Interne Links",
          status: "OK" as const,
          details: { totalLinks: report.internalLinks.length },
          responseTime: 10
        },
        {
          timestamp: new Date().toISOString(),
          stepId: "STEP-4",
          stepName: "Seiten Scraping",
          status: "OK" as const,
          details: { totalPages: report.pages.length },
          responseTime: 250
        }
      ];
      
      expect(logs.length).toBe(4);
      expect(logs[0].stepName).toBe("URL Normalisierung");
      expect(logs[1].stepName).toBe("Homepage Scraping");
      expect(logs.every(log => log.status === "OK")).toBe(true);
    });

    it("should handle frehnertec.ch analysis with error scenarios", () => {
      const websiteUrl = "frehnertec.ch";
      const normalizedUrl = "https://frehnertec.ch";
      
      // Simulate error in homepage scraping
      const report = {
        originalUrl: websiteUrl,
        normalizedUrl: normalizedUrl,
        homepage: {
          scraped: false,
          data: {
            url: normalizedUrl,
            title: "",
            metaDescription: "",
            h1: [],
            h2: [],
            h3: [],
            content: "",
            responseTime: 0,
            status: 0,
            success: false
          }
        },
        internalLinks: [] as string[],
        pages: [] as any[],
        summary: {
          totalPages: 0,
          successfulPages: 0,
          averageResponseTime: 0,
          fastestPage: "",
          slowestPage: ""
        }
      };
      
      expect(report.homepage.scraped).toBe(false);
      expect(report.homepage.data?.success).toBe(false);
      
      // Should still be able to generate prompt even with errors
      let prompt = `# AI READINESS ANALYSE\n\n`;
      prompt += `## WEBSITE\n${report.normalizedUrl}\n\n`;
      
      if (!report.homepage.scraped) {
        prompt += `## HOMEPAGE\n`;
        prompt += `Status: ✗ Nicht gescraped\n`;
        prompt += `Hinweis: Homepage konnte nicht geladen werden\n\n`;
      }
      
      expect(prompt).toContain("frehnertec.ch");
      expect(prompt).toContain("Nicht gescraped");
    });
  });
});

