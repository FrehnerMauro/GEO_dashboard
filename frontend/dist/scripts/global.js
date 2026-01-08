
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
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1195',message:'toggleSidebar called',data:{sidebarExists:!!sidebar,isCollapsed:sidebar.classList.contains('collapsed'),sidebarWidth:sidebar.offsetWidth,mainContentWidth:mainContent?.offsetWidth,mainContentMarginLeft:mainContent?window.getComputedStyle(mainContent).marginLeft:null,contentAreaWidth:document.querySelector('.content-area')?.offsetWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
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
        
        // #region agent log
        setTimeout(() => {
          const contentArea = document.querySelector('.content-area');
          fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1215',message:'After toggleSidebar',data:{isCollapsed:sidebar.classList.contains('collapsed'),sidebarWidth:sidebar.offsetWidth,mainContentWidth:mainContent?.offsetWidth,mainContentMarginLeft:mainContent?window.getComputedStyle(mainContent).marginLeft:null,contentAreaWidth:contentArea?.offsetWidth,contentAreaLeft:contentArea?contentArea.getBoundingClientRect().left:null,windowWidth:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
        }, 350);
        // #endregion
      };
      
    window.showDashboard = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'block';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        } else {
          const dashboardNav = document.querySelector('.nav-item');
          if (dashboardNav) dashboardNav.classList.add('active');
        }
        if (window.showDashboardFull) {
          window.showDashboardFull(event);
        }
      };
      
    window.showAnalyses = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'block';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
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
  