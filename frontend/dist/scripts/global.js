/**
 * Global Functions - Available immediately (before DOMContentLoaded)
 * These functions must be defined before HTML onclick handlers try to call them
 */
// Import navigation to use its toggleSidebar method
// This will be available after the module loads, but we need a fallback for immediate use
import { navigation } from './components/navigation.js';
// Sidebar toggle function - must be available immediately
// Uses navigation component if available, otherwise falls back to direct DOM manipulation
window.toggleSidebar = function () {
    // Try to use navigation component first (if available)
    if (navigation) {
        navigation.toggleSidebar();
        return;
    }
    // Fallback: direct DOM manipulation (for immediate availability)
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const body = document.body;
    if (!sidebar)
        return;
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
        sidebar.classList.remove('collapsed');
        if (body)
            body.classList.remove('sidebar-collapsed');
        if (toggleBtn) {
            toggleBtn.textContent = '◀';
            toggleBtn.title = 'Hide menu';
        }
    }
    else {
        sidebar.classList.add('collapsed');
        if (body)
            body.classList.add('sidebar-collapsed');
        if (toggleBtn) {
            toggleBtn.textContent = '▶';
            toggleBtn.title = 'Show menu';
        }
    }
};
// Placeholder functions - will be replaced by app.ts when it loads
// These are needed for HTML onclick handlers that might fire before app.ts loads
window.showDashboard = function (event) {
    if (event)
        event.preventDefault();
    // Will be replaced by app.ts
};
window.showAIAnalysis = function (event) {
    if (event)
        event.preventDefault();
    // Will be replaced by app.ts
};
window.showAIReadability = function (event) {
    if (event)
        event.preventDefault();
    // Will be replaced by app.ts
};
window.showAnalyses = function (event) {
    if (event)
        event.preventDefault();
    // Will be replaced by app.ts
};
//# sourceMappingURL=global.js.map