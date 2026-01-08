
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    (function() {
      // Sidebar toggle function
      window.toggleSidebar = function() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');
        const body = document.body;
        
        if (!sidebar) return;
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
          sidebar.classList.remove('collapsed');
          if (body) body.classList.remove('sidebar-collapsed');
          if (toggleBtn) toggleBtn.textContent = '◀';
          if (toggleBtn) toggleBtn.title = 'Menü ausblenden';
        } else {
          sidebar.classList.add('collapsed');
          if (body) body.classList.add('sidebar-collapsed');
          if (toggleBtn) toggleBtn.textContent = '▶';
          if (toggleBtn) toggleBtn.title = 'Menü einblenden';
        }
      };
      
    window.showDashboard = function(event) {
      if (event) event.preventDefault();
      // Hide all sections
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      
      if (dashboardSection) dashboardSection.style.display = 'block';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = 'Dashboard';
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      } else {
        const dashboardNav = document.querySelector('.nav-item');
        if (dashboardNav) dashboardNav.classList.add('active');
      }
    };
    
    window.showAIAnalysis = function(event) {
      if (event) event.preventDefault();
      // Hide all sections
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) {
        aiAnalysisSection.style.display = 'flex'; // Use flex to match CSS
        // Make sure the configuration card is visible
        const configurationCard = document.getElementById('configurationCard');
        if (configurationCard) {
          configurationCard.style.display = 'block';
          configurationCard.classList.remove('hidden');
        }
      }
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = 'AI Analyse';
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      
      // Try to call full implementation if available (after DOMContentLoaded)
      if (window.showAIAnalysisFull) {
        window.showAIAnalysisFull(event);
      }
    };
    
    window.showAIReadability = function(event) {
      if (event) event.preventDefault();
      // Hide all sections
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'flex'; // Use flex to match CSS
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = 'AI Readability';
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
    };
      
    window.showAnalyses = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'block';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
      if (window.loadAnalyses) {
        window.loadAnalyses();
      } else if (window.showAnalysesFull) {
        window.showAnalysesFull(event);
      }
    };
    })();
  