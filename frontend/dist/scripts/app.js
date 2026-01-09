/**
 * Main Application Entry Point
 * Initializes the application and sets up page routing
 */
import { DashboardPage } from "./pages/dashboard-page.js";
import { AnalysesPage } from "./pages/analyses-page.js";
import { AnalysisWorkflow } from "./pages/analysis-workflow.js";
import { ReadabilityWorkflow } from "./pages/readability-workflow.js";
import { navigation } from "./components/navigation.js";
export class App {
    dashboardPage;
    analysesPage;
    analysisWorkflow;
    readabilityWorkflow;
    constructor() {
        // Initialize pages
        this.dashboardPage = new DashboardPage();
        this.analysesPage = new AnalysesPage();
        this.analysisWorkflow = new AnalysisWorkflow();
        this.readabilityWorkflow = new ReadabilityWorkflow();
        // Make dashboardPage globally available
        window.dashboardPage = this.dashboardPage;
        // Setup global navigation functions
        this.setupGlobalFunctions();
    }
    setupGlobalFunctions() {
        // Make analysisWorkflow globally available for onclick handlers
        window.analysisWorkflow = this.analysisWorkflow;
        // These functions are called from HTML onclick handlers
        window.showDashboard = (event) => {
            if (event)
                event.preventDefault();
            // Hide all sections first to prevent chaos
            this.hideAllSections();
            this.dashboardPage.show();
        };
        window.showAnalyses = (event) => {
            if (event)
                event.preventDefault();
            // Hide all sections first to prevent chaos
            this.hideAllSections();
            this.analysesPage.show();
        };
        // AI Analysis function
        window.showAIAnalysis = (event) => {
            if (event)
                event.preventDefault();
            this.showAIAnalysisSection();
        };
        // AI Readability function
        window.showAIReadability = (event) => {
            if (event)
                event.preventDefault();
            this.showAIReadabilitySection();
        };
        // Analysis start function
        window.startAnalysisNow = async () => {
            await this.handleAnalysisStart();
        };
    }
    /**
     * Hide all sections and reset state - prevents chaos when switching menus
     * IMPORTANT: This should NOT hide analysis progress if analysis is running
     */
    hideAllSections() {
        // Check if analysis is running - if so, don't hide progress section
        const isAnalysisRunning = this.analysisWorkflow?.isRunning === true;
        // Hide all main sections
        const sections = [
            "dashboardSection",
            "aiAnalysisSection",
            "aiReadabilitySection",
            "analysesSection",
            "analysisDetailSection",
        ];
        sections.forEach((sectionId) => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = "none";
                section.classList.remove("show");
                section.classList.add("hidden");
            }
        });
        // Hide/Reset analysis progress ONLY if analysis is not running
        if (!isAnalysisRunning) {
            const analysisProgress = document.getElementById("analysisProgress");
            if (analysisProgress) {
                analysisProgress.style.display = "none";
            }
        }
        // Hide/Reset loading states
        const loading = document.getElementById("loading");
        if (loading) {
            loading.style.display = "none";
            loading.classList.remove("show");
        }
        // Hide/Reset result sections ONLY if analysis is not running
        if (!isAnalysisRunning) {
            const result = document.getElementById("result");
            if (result) {
                result.style.display = "none";
                result.classList.remove("show");
            }
        }
        // Reset configuration card visibility ONLY if analysis is not running
        if (!isAnalysisRunning) {
            const configurationCard = document.getElementById("configurationCard");
            if (configurationCard) {
                configurationCard.style.display = "block";
                configurationCard.classList.remove("hidden");
            }
        }
        // Don't clear workflow state if analysis is running
        if (this.analysisWorkflow && !isAnalysisRunning) {
            // Reset workflow state if needed
            this.analysisWorkflow.workflowData = null;
        }
    }
    showAIAnalysisSection() {
        // Check if analysis is running
        const isAnalysisRunning = this.analysisWorkflow?.isRunning === true;
        // First, hide all sections to prevent chaos
        this.hideAllSections();
        // Now show the AI Analysis section
        const aiAnalysisSection = document.getElementById("aiAnalysisSection");
        if (aiAnalysisSection) {
            aiAnalysisSection.style.display = "flex"; // Use flex to match CSS
            // Make sure the configuration card is visible ONLY if analysis is not running
            if (!isAnalysisRunning) {
                const configurationCard = document.getElementById("configurationCard");
                if (configurationCard) {
                    configurationCard.style.display = "block";
                    configurationCard.classList.remove("hidden");
                }
            }
            // If analysis is running, make sure progress is visible
            if (isAnalysisRunning) {
                const analysisProgress = document.getElementById("analysisProgress");
                if (analysisProgress) {
                    analysisProgress.style.display = "block";
                }
                const result = document.getElementById("result");
                if (result) {
                    result.style.display = "block";
                    result.classList.add("show");
                }
            }
        }
        // Update header
        const headerTitle = document.getElementById("headerTitle");
        if (headerTitle)
            headerTitle.textContent = "Prompt Analysis";
        // Update navigation
        navigation.setActiveNavItem(1);
        // Setup form event listeners
        this.setupAnalysisFormListeners();
    }
    showAIReadabilitySection() {
        // First, hide all sections to prevent chaos
        this.hideAllSections();
        // Now show the AI Readability section
        const aiReadabilitySection = document.getElementById("aiReadabilitySection");
        if (aiReadabilitySection) {
            aiReadabilitySection.style.display = "flex"; // Use flex to match CSS
        }
        // Update header
        const headerTitle = document.getElementById("headerTitle");
        if (headerTitle)
            headerTitle.textContent = "AI Readability";
        // Update navigation
        navigation.setActiveNavItem(2);
        // Setup form event listeners
        this.setupReadabilityFormListeners();
    }
    setupReadabilityFormListeners() {
        const readabilityForm = document.getElementById("readabilityForm");
        const fetchContentBtn = document.getElementById("fetchContentBtn");
        const readabilityUrl = document.getElementById("readabilityUrl");
        if (!readabilityForm || !fetchContentBtn || !readabilityUrl) {
            console.warn("Readability form elements not found");
            return;
        }
        // Remove existing listeners to avoid duplicates
        const newForm = readabilityForm.cloneNode(true);
        readabilityForm.parentNode?.replaceChild(newForm, readabilityForm);
        const newFetchBtn = document.getElementById("fetchContentBtn");
        const newUrlInput = document.getElementById("readabilityUrl");
        if (!newFetchBtn || !newUrlInput)
            return;
        // Handle button click
        newFetchBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleReadabilityStart();
        });
        // Handle form submission
        newForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleReadabilityStart();
        });
        // Handle Enter key in input field
        newUrlInput.addEventListener("keydown", (e) => {
            const keyEvent = e;
            if (keyEvent.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                newFetchBtn.click();
            }
        });
    }
    async handleReadabilityStart() {
        const fetchContentBtn = document.getElementById("fetchContentBtn");
        const readabilityUrl = document.getElementById("readabilityUrl");
        if (!readabilityUrl) {
            alert("URL input field not found. Please reload the page.");
            return;
        }
        const url = readabilityUrl.value;
        if (!url || !url.trim()) {
            alert("Please enter a URL.");
            return;
        }
        try {
            if (fetchContentBtn) {
                fetchContentBtn.disabled = true;
                fetchContentBtn.textContent = "Analyzing...";
            }
            await this.readabilityWorkflow.startAnalysis(url);
        }
        catch (error) {
            console.error("Error starting readability analysis:", error);
            alert(error instanceof Error ? error.message : "Failed to start analysis");
        }
        finally {
            if (fetchContentBtn) {
                fetchContentBtn.disabled = false;
                fetchContentBtn.textContent = "Start AI Readiness Analysis";
            }
        }
    }
    init() {
        // Initialize navigation
        console.log("GEO Dashboard initialized");
        // Show dashboard by default
        this.dashboardPage.show();
    }
    setupAnalysisFormListeners() {
        const analyzeForm = document.getElementById("analyzeForm");
        const startBtn = document.getElementById("startAnalysisBtn");
        if (!analyzeForm || !startBtn) {
            console.warn("Analysis form elements not found");
            return;
        }
        // Remove existing listeners to avoid duplicates
        const newForm = analyzeForm.cloneNode(true);
        analyzeForm.parentNode?.replaceChild(newForm, analyzeForm);
        const newStartBtn = document.getElementById("startAnalysisBtn");
        if (!newStartBtn)
            return;
        // Handle form submission
        newForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleAnalysisStart();
        });
        // Handle Enter key in input fields
        const formInputs = newForm.querySelectorAll("input, select");
        formInputs.forEach((input) => {
            input.addEventListener("keydown", (e) => {
                const keyEvent = e;
                if (keyEvent.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    newStartBtn.click();
                }
            });
        });
    }
    async handleAnalysisStart() {
        // Check if analysis is already running
        if (this.analysisWorkflow?.isRunning === true) {
            alert("Analysis is already running. Please wait for it to complete.");
            return;
        }
        const startBtn = document.getElementById("startAnalysisBtn");
        const websiteUrlEl = document.getElementById("websiteUrl");
        const countryEl = document.getElementById("country");
        const languageEl = document.getElementById("language");
        const regionEl = document.getElementById("region");
        const questionsPerCategoryEl = document.getElementById("questionsPerCategory");
        if (!websiteUrlEl || !countryEl || !languageEl) {
            alert("Form fields not found. Please reload the page.");
            return;
        }
        try {
            // Disable button and show loading state
            if (startBtn) {
                startBtn.disabled = true;
                const originalText = startBtn.textContent;
                startBtn.textContent = "Starting Analysis...";
                try {
                    const formData = {
                        websiteUrl: websiteUrlEl.value,
                        country: countryEl.value,
                        language: languageEl.value,
                        region: regionEl?.value || undefined,
                        questionsPerCategory: questionsPerCategoryEl
                            ? parseInt(questionsPerCategoryEl.value) || 3
                            : 3,
                    };
                    await this.analysisWorkflow.startAnalysis(formData);
                }
                finally {
                    // Re-enable button only if analysis is not running
                    if (startBtn && !this.analysisWorkflow?.isRunning) {
                        startBtn.disabled = false;
                        startBtn.textContent = originalText || "Start Analysis";
                    }
                }
            }
        }
        catch (error) {
            console.error("Error starting analysis:", error);
            // Re-enable button on error
            const startBtn = document.getElementById("startAnalysisBtn");
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = "Start Analysis";
            }
            alert(error instanceof Error ? error.message : "Failed to start analysis");
        }
    }
}
// Initialize app when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        const app = new App();
        app.init();
    });
}
else {
    const app = new App();
    app.init();
}
//# sourceMappingURL=app.js.map