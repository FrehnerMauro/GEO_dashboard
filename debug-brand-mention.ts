/**
 * Debug script for BrandMentionDetector
 * Usage: npx tsx debug-brand-mention.ts
 */

import { BrandMentionDetector } from "./src/analysis/brand_mention.js";
import type { LLMResponse } from "./src/types.js";

// Test cases
const testCases: Array<{ name: string; response: LLMResponse; brandName: string }> = [
  {
    name: "Simple exact mentions",
    brandName: "AcmeCorp",
    response: {
      promptId: "test-1",
      outputText: "AcmeCorp is a leading company. AcmeCorp offers great solutions.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    },
  },
  {
    name: "Case insensitive",
    brandName: "AcmeCorp",
    response: {
      promptId: "test-2",
      outputText: "acmecorp is mentioned. ACMECORP is also here. AcmeCorp too.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    },
  },
  {
    name: "With markdown citations",
    brandName: "frehnertec",
    response: {
      promptId: "test-3",
      outputText: "Here is some text. [frehnertec.ch](https://www.frehnertec.ch/about) is a great company. More text here.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    },
  },
  {
    name: "Multiple contexts",
    brandName: "AcmeCorp",
    response: {
      promptId: "test-4",
      outputText: "AcmeCorp is a great company. They offer excellent services. AcmeCorp has many customers. Another sentence without brand.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    },
  },
  {
    name: "No mentions",
    brandName: "AcmeCorp",
    response: {
      promptId: "test-5",
      outputText: "This text has no brand mentions at all. Just some regular content.",
      citations: [],
      timestamp: new Date().toISOString(),
      model: "gpt-4",
    },
  },
];

console.log("=".repeat(80));
console.log("BrandMentionDetector Debug Script");
console.log("=".repeat(80));
console.log();

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log("-".repeat(80));
  console.log(`Brand: ${testCase.brandName}`);
  console.log(`Text: ${testCase.response.outputText}`);
  console.log();
  
  const detector = new BrandMentionDetector(testCase.brandName, 0.7, true);
  const result = detector.detectMentions(testCase.response);
  
  console.log("\nResults:");
  console.log(`  Exact mentions: ${result.exact}`);
  console.log(`  Fuzzy mentions: ${result.fuzzy}`);
  console.log(`  Contexts (${result.contexts.length}):`);
  result.contexts.forEach((ctx, idx) => {
    console.log(`    ${idx + 1}. ${ctx.substring(0, 100)}${ctx.length > 100 ? "..." : ""}`);
  });
  console.log();
}

console.log("=".repeat(80));
console.log("Debug complete!");
console.log("=".repeat(80));
