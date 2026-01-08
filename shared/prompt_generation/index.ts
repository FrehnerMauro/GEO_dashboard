/**
 * Prompt generation module
 * Generates high-intent questions for each category
 */

import type { Category, Prompt, UserInput } from "../types.js";

export class PromptGenerator {
  generatePrompts(
    categories: Category[],
    userInput: UserInput,
    questionsPerCategory: number = 5
  ): Prompt[] {
    const prompts: Prompt[] = [];

    for (const category of categories) {
      const categoryPrompts = this.generateCategoryPrompts(
        category,
        userInput,
        questionsPerCategory
      );
      prompts.push(...categoryPrompts);
    }

    return prompts;
  }

  private generateCategoryPrompts(
    category: Category,
    userInput: UserInput,
    count: number
  ): Prompt[] {
    const prompts: Prompt[] = [];
    const templates = this.getPromptTemplates(category.name, userInput.language);

    for (let i = 0; i < count && i < templates.length; i++) {
      const template = templates[i];
      const question = this.fillTemplate(template, userInput, category);

      prompts.push({
        id: this.generatePromptId(category.id, i),
        categoryId: category.id,
        question,
        language: userInput.language,
        country: userInput.country,
        region: userInput.region,
        intent: this.determineIntent(template),
        createdAt: new Date().toISOString(),
      });
    }

    return prompts;
  }

  private getPromptTemplates(
    categoryName: string,
    language: string
  ): string[] {
    // Language-specific templates
    const templates: Record<string, Record<string, string[]>> = {
      en: {
        Product: [
          "What are the key features of {product} in {country}?",
          "How does {product} work for businesses in {region}?",
          "What makes {product} different from other solutions?",
          "What are the main capabilities of {product}?",
          "How do companies in {country} use {product}?",
        ],
        Pricing: [
          "How much does {product} cost in {country}?",
          "What are the pricing plans for {product}?",
          "Is {product} affordable for small businesses in {region}?",
          "What is the pricing structure for {product}?",
          "Are there any discounts available for {product} in {country}?",
        ],
        Comparison: [
          "How does {product} compare to alternatives in {country}?",
          "What are the best alternatives to {product}?",
          "Should I choose {product} or {competitor}?",
          "How does {product} stack up against competitors?",
          "What are the pros and cons of {product} vs alternatives?",
        ],
        "Use Cases": [
          "What are common use cases for {product} in {region}?",
          "How do companies in {country} use {product}?",
          "What problems does {product} solve?",
          "When should I use {product}?",
          "What industries benefit from {product}?",
        ],
        Industry: [
          "What companies in {country} use {product}?",
          "Is {product} suitable for {industry} in {region}?",
          "What industries does {product} serve?",
          "How is {product} used in {industry}?",
          "What are the main use cases for {product} in {industry}?",
        ],
        "Problems / Solutions": [
          "What problems does {product} solve in {country}?",
          "How does {product} address common challenges?",
          "What issues can {product} help with?",
          "What solutions does {product} provide?",
          "How does {product} solve business problems?",
        ],
        Integration: [
          "What integrations does {product} support?",
          "How do I integrate {product} with other tools?",
          "Is {product} compatible with {tool}?",
          "What APIs does {product} offer?",
          "How does {product} connect with existing systems?",
        ],
        Support: [
          "How do I get started with {product}?",
          "What documentation is available for {product}?",
          "How do I get support for {product} in {country}?",
          "What resources are available for {product} users?",
          "Where can I find help with {product}?",
        ],
      },
      de: {
        Product: [
          "Was sind die Hauptfunktionen von {product} in {country}?",
          "Wie funktioniert {product} für Unternehmen in {region}?",
          "Was unterscheidet {product} von anderen Lösungen?",
          "Welche Hauptfunktionen bietet {product}?",
          "Wie nutzen Unternehmen in {country} {product}?",
        ],
        Pricing: [
          "Wie viel kostet {product} in {country}?",
          "Welche Preismodelle gibt es für {product}?",
          "Ist {product} für kleine Unternehmen in {region} erschwinglich?",
          "Wie ist die Preisstruktur von {product}?",
          "Gibt es Rabatte für {product} in {country}?",
        ],
        Comparison: [
          "Wie schneidet {product} im Vergleich zu Alternativen in {country} ab?",
          "Was sind die besten Alternativen zu {product}?",
          "Sollte ich {product} oder {competitor} wählen?",
          "Wie steht {product} im Vergleich zu Konkurrenten da?",
          "Was sind die Vor- und Nachteile von {product} vs Alternativen?",
        ],
        "Use Cases": [
          "Was sind häufige Anwendungsfälle für {product} in {region}?",
          "Wie nutzen Unternehmen in {country} {product}?",
          "Welche Probleme löst {product}?",
          "Wann sollte ich {product} verwenden?",
          "Welche Branchen profitieren von {product}?",
        ],
        Industry: [
          "Welche Unternehmen in {country} nutzen {product}?",
          "Ist {product} für {industry} in {region} geeignet?",
          "Welche Branchen bedient {product}?",
          "Wie wird {product} in {industry} eingesetzt?",
          "Was sind die Hauptanwendungsfälle für {product} in {industry}?",
        ],
        "Problems / Solutions": [
          "Welche Probleme löst {product} in {country}?",
          "Wie adressiert {product} häufige Herausforderungen?",
          "Bei welchen Problemen kann {product} helfen?",
          "Welche Lösungen bietet {product}?",
          "Wie löst {product} Geschäftsprobleme?",
        ],
        Integration: [
          "Welche Integrationen unterstützt {product}?",
          "Wie integriere ich {product} mit anderen Tools?",
          "Ist {product} kompatibel mit {tool}?",
          "Welche APIs bietet {product}?",
          "Wie verbindet sich {product} mit bestehenden Systemen?",
        ],
        Support: [
          "Wie beginne ich mit {product}?",
          "Welche Dokumentation ist für {product} verfügbar?",
          "Wie erhalte ich Support für {product} in {country}?",
          "Welche Ressourcen stehen {product}-Nutzern zur Verfügung?",
          "Wo finde ich Hilfe zu {product}?",
        ],
      },
      fr: {
        Product: [
          "Quelles sont les principales fonctionnalités de {product} en {country}?",
          "Comment fonctionne {product} pour les entreprises en {region}?",
          "Qu'est-ce qui distingue {product} des autres solutions?",
          "Quelles sont les principales capacités de {product}?",
          "Comment les entreprises en {country} utilisent-elles {product}?",
        ],
        Pricing: [
          "Combien coûte {product} en {country}?",
          "Quels sont les plans tarifaires pour {product}?",
          "{product} est-il abordable pour les petites entreprises en {region}?",
          "Quelle est la structure tarifaire de {product}?",
          "Y a-t-il des remises disponibles pour {product} en {country}?",
        ],
        Comparison: [
          "Comment {product} se compare-t-il aux alternatives en {country}?",
          "Quelles sont les meilleures alternatives à {product}?",
          "Dois-je choisir {product} ou {competitor}?",
          "Comment {product} se compare-t-il aux concurrents?",
          "Quels sont les avantages et inconvénients de {product} vs alternatives?",
        ],
        "Use Cases": [
          "Quels sont les cas d'usage courants pour {product} en {region}?",
          "Comment les entreprises en {country} utilisent-elles {product}?",
          "Quels problèmes {product} résout-il?",
          "Quand devrais-je utiliser {product}?",
          "Quelles industries bénéficient de {product}?",
        ],
        Industry: [
          "Quelles entreprises en {country} utilisent {product}?",
          "{product} est-il adapté à {industry} en {region}?",
          "Quelles industries {product} sert-il?",
          "Comment {product} est-il utilisé dans {industry}?",
          "Quels sont les principaux cas d'usage pour {product} dans {industry}?",
        ],
        "Problems / Solutions": [
          "Quels problèmes {product} résout-il en {country}?",
          "Comment {product} répond-il aux défis courants?",
          "À quels problèmes {product} peut-il aider?",
          "Quelles solutions {product} fournit-il?",
          "Comment {product} résout-il les problèmes commerciaux?",
        ],
        Integration: [
          "Quelles intégrations {product} prend-il en charge?",
          "Comment intégrer {product} avec d'autres outils?",
          "{product} est-il compatible avec {tool}?",
          "Quelles API {product} offre-t-il?",
          "Comment {product} se connecte-t-il aux systèmes existants?",
        ],
        Support: [
          "Comment commencer avec {product}?",
          "Quelle documentation est disponible pour {product}?",
          "Comment obtenir du support pour {product} en {country}?",
          "Quelles ressources sont disponibles pour les utilisateurs de {product}?",
          "Où puis-je trouver de l'aide pour {product}?",
        ],
      },
    };

    const langTemplates = templates[language] || templates.en;
    return langTemplates[categoryName] || langTemplates.Product || [];
  }

  private fillTemplate(
    template: string,
    userInput: UserInput,
    category: Category
  ): string {
    // Extract domain name as product name
    const productName = this.extractProductName(userInput.websiteUrl);

    return template
      .replace(/{product}/g, productName)
      .replace(/{country}/g, userInput.country)
      .replace(/{region}/g, userInput.region || userInput.country)
      .replace(/{industry}/g, "the industry")
      .replace(/{competitor}/g, "competitors")
      .replace(/{tool}/g, "other tools");
  }

  private extractProductName(websiteUrl: string): string {
    try {
      const domain = new URL(websiteUrl).hostname;
      const parts = domain.split(".");
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return "the product";
    }
  }

  private determineIntent(template: string): "high" | "medium" | "low" {
    // High intent: questions with "how", "what", "should", "best"
    if (
      /how|what|should|best|which|when/i.test(template) &&
      /cost|price|compare|choose|recommend/i.test(template)
    ) {
      return "high";
    }
    // Medium intent: questions with "is", "are", "does"
    if (/is|are|does|can/i.test(template)) {
      return "medium";
    }
    return "low";
  }

  private generatePromptId(categoryId: string, index: number): string {
    return `prompt_${categoryId}_${index}_${Date.now()}`;
  }
}







