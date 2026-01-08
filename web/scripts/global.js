
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
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
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
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'block';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'none';
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
      
      window.showAIReadiness = function(event) {
        if (event) event.preventDefault();
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        const aiReadinessSection = document.getElementById('aiReadinessSection');
        const analysisSection = document.querySelector('.content-area > .card');
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        if (aiReadinessSection) aiReadinessSection.style.display = 'block';
        if (analysisSection) analysisSection.style.display = 'none';
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
        }
        if (window.showAIReadinessFull) {
          window.showAIReadinessFull(event);
        }
      };
      
      window.startAIReadiness = async function() {
        // Direct implementation - no need to wait for DOMContentLoaded
        const urlInput = document.getElementById('aiReadinessUrl');
        const url = urlInput?.value?.trim();
        
        if (!url) {
          alert('Bitte geben Sie eine URL ein.');
          return;
        }
        
        // Auto-add https:// if missing
        let websiteUrl = url;
        const urlPattern = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = 'https://' + websiteUrl;
        }
        
        // Validate URL
        try {
          new URL(websiteUrl);
        } catch (e) {
          alert('Ungültige URL. Bitte geben Sie eine gültige URL ein.');
          return;
        }
        
        // Update input field with normalized URL
        if (urlInput) {
          urlInput.value = websiteUrl;
        }
        
        const loadingEl = document.getElementById('aiReadinessLoading');
        const resultsEl = document.getElementById('aiReadinessResults');
        const statusEl = document.getElementById('aiReadinessStatus');
        const statusDetailsEl = document.getElementById('aiReadinessStatusDetails');
        const progressEl = document.getElementById('aiReadinessProgress');
        const progressTextEl = document.getElementById('aiReadinessProgressText');
        const resultsContentEl = document.getElementById('aiReadinessResultsContent');
        const consoleEl = document.getElementById('aiReadinessConsole');
        const consoleContentEl = document.getElementById('aiReadinessConsoleContent');
        const startBtn = document.getElementById('startAIReadinessBtn');
        
        // Show console
        if (consoleEl) consoleEl.style.display = 'block';
        if (consoleContentEl) {
          consoleContentEl.innerHTML = '<div style="color: #6a9955;">[System] Console bereit. Warte auf Logs...</div>';
        }
        
        if (loadingEl) {
          loadingEl.style.display = 'block';
        }
        if (resultsEl) resultsEl.style.display = 'none';
        if (statusEl) statusEl.textContent = 'Vorbereitung...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
        if (progressEl) progressEl.style.width = '0%';
        if (progressTextEl) progressTextEl.textContent = '0%';
        if (startBtn) {
          startBtn.disabled = true;
          startBtn.textContent = 'Läuft...';
        }
        
        try {
          // Step 1: Start analysis
          if (statusEl) statusEl.textContent = 'Schritt 1: Starte Analyse...';
          if (statusDetailsEl) statusDetailsEl.textContent = 'Hole robots.txt und Sitemap...';
          if (progressEl) progressEl.style.width = '10%';
          if (progressTextEl) progressTextEl.textContent = '10%';
          
          const step1Response = await fetch('/api/ai-readiness/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteUrl })
          });
          
          if (!step1Response.ok) {
            throw new Error('Fehler beim Starten der Analyse');
          }
          
          const step1Data = await step1Response.json();
          const runId = step1Data.runId;
          
          // Step 2: Poll for status updates with live progress
          let attempts = 0;
          const maxAttempts = 120; // 10 minutes max (2 second intervals)
          let lastMessage = '';
          let pollingStopped = false;
          
          // Centralized error handler
          const handlePollingError = function(error) {
            pollingStopped = true;
            console.error('Error in AI Readiness polling:', error);
            if (statusEl) statusEl.textContent = '❌ Fehler';
            if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
            if (startBtn) {
              startBtn.disabled = false;
              startBtn.textContent = 'AI Readiness Check starten';
            }
            if (loadingEl) {
              setTimeout(() => {
                if (loadingEl) {
                  loadingEl.style.display = 'none';
                  loadingEl.classList.remove('show');
                }
              }, 2000);
            }
            alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          };
          
          const pollStatus = async function() {
            if (pollingStopped) {
              return;
            }
            
            attempts++;
            
            try {
              const statusResponse = await fetch('/api/ai-readiness/status/' + runId);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                // Update steps overview if available - Show ALL steps in chronological order
                const stepsEl = document.getElementById('aiReadinessSteps');
                const stepsContentEl = document.getElementById('aiReadinessStepsContent');
                if (statusData.logs && Array.isArray(statusData.logs) && stepsContentEl) {
                  if (stepsEl) stepsEl.style.display = 'block';
                  
                  // Sort logs by timestamp to show in chronological order
                  // #region agent log
                  try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1337',message:'Before sortedLogs',data:{logsCount:statusData.logs?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{}); } catch(e) {}
                  // #endregion
                  const sortedLogs = [...statusData.logs].sort((a, b) => {
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                  });
                  // #region agent log
                  try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1341',message:'After sortedLogs',data:{sortedCount:sortedLogs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{}); } catch(e) {}
                  // #endregion
                  
                  let stepsHtml = '';
                  
                  // Show each log entry as a separate step, one after another
                  sortedLogs.forEach((log, index) => {
                    const stepNum = index + 1;
                    const time = new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    // #region agent log
                    try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1347',message:'Before responseTimeText',data:{hasResponseTime:!!log.responseTime,index},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
                    // #endregion
                    const responseTimeText = log.responseTime ? (' • ' + log.responseTime + 'ms') : '';
                    // #region agent log
                    try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1348',message:'Before detailId',data:{stepNum},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
                    // #endregion
                    const detailId = 'step-detail-' + stepNum;
                    
                    // Determine if this is the currently active step (last one)
                    const isActive = index === sortedLogs.length - 1 && statusData.status === 'processing';
                    const isCompleted = log.status === 'OK';
                    const hasError = log.status === 'ERROR';
                    const hasWarning = log.status === 'WARN';
                    
                    let statusColor = '#858585'; // Gray for pending
                    let statusIcon = '⏳';
                    let statusText = 'Wartend';
                    let borderColor = '#e5e7eb';
                    let bgColor = '#f9fafb';
                    
                    if (hasError) {
                      statusColor = '#ef4444';
                      statusIcon = '✗';
                      statusText = 'Fehler';
                      borderColor = '#fecaca';
                      bgColor = '#fef2f2';
                    } else if (hasWarning) {
                      statusColor = '#f59e0b';
                      statusIcon = '⚠';
                      statusText = 'Warnung';
                      borderColor = '#fed7aa';
                      bgColor = '#fffbeb';
                    } else if (isCompleted) {
                      statusColor = '#10b981';
                      statusIcon = '✓';
                      statusText = 'Abgeschlossen';
                      borderColor = '#a7f3d0';
                      bgColor = '#ecfdf5';
                    } else if (isActive) {
                      statusColor = '#3b82f6';
                      statusIcon = '⟳';
                      statusText = 'Läuft...';
                      borderColor = '#bfdbfe';
                      bgColor = '#eff6ff';
                    }
                    
                    // Format details for display
                    let detailsText = '';
                    try {
                      if (typeof log.details === 'object') {
                        detailsText = JSON.stringify(log.details, null, 2);
                      } else {
                        detailsText = String(log.details);
                      }
                    } catch (e) {
                      detailsText = String(log.details);
                    }
                    
                    // Determine CSS classes
                    let stepClass = 'ai-readiness-step-item';
                    let statusClass = 'pending';
                    if (hasError) {
                      stepClass += ' error';
                      statusClass = 'error';
                    } else if (isCompleted) {
                      stepClass += ' completed';
                      statusClass = 'completed';
                    } else if (isActive) {
                      stepClass += ' active';
                      statusClass = 'active';
                    }
                    
                    // #region agent log
                    try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1414',message:'Before stepsHtml template',data:{stepClass,detailId,stepNum},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); } catch(e) {}
                    // #endregion
                    const displayValue = (isActive || hasError || hasWarning) ? 'block' : 'none';
                    const responseTimeHtml = responseTimeText ? '<span>•</span><span>' + responseTimeText.replace(' • ', '') + '</span>' : '';
                    const responseTimeDetailHtml = log.responseTime ? '<span><strong>Response Time:</strong> ' + log.responseTime + 'ms</span>' : '';
                    stepsHtml += '<div class="' + stepClass + '">' +
                      '<div class="ai-readiness-step-header" onclick="const detail = document.getElementById(\'' + detailId + '\'); detail.style.display = detail.style.display === \'none\' ? \'block\' : \'none\';">' +
                        '<div class="ai-readiness-step-number">' + stepNum + '</div>' +
                        '<div class="ai-readiness-step-content">' +
                          '<div class="ai-readiness-step-title">' + (log.stepName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
                          '<div class="ai-readiness-step-meta">' +
                            '<span class="ai-readiness-step-status ' + statusClass + '">' + statusIcon + ' ' + statusText + '</span>' +
                            '<span>•</span>' +
                            '<span>' + time + '</span>' +
                            responseTimeHtml +
                            '<span>•</span>' +
                            '<span style="font-family: monospace; font-size: 11px; opacity: 0.7;">' + (log.stepId || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' +
                          '</div>' +
                        '</div>' +
                      '</div>' +
                      '<div id="' + detailId + '" style="display: ' + displayValue + '; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">' +
                        '<div style="font-size: 11px; color: var(--text-light); margin-bottom: 12px; display: flex; gap: 16px; flex-wrap: wrap;">' +
                          '<span><strong>Step-ID:</strong> <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 10px;">' + (log.stepId || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></span>' +
                          '<span><strong>Status:</strong> <span style="color: ' + statusColor + '; font-weight: 600;">' + (log.status || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span></span>' +
                          responseTimeDetailHtml +
                          '<span><strong>Zeit:</strong> ' + time + '</span>' +
                        '</div>' +
                        '<div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; font-family: \'Courier New\', monospace; font-size: 12px; color: var(--text); max-height: 300px; overflow-y: auto; border: 1px solid var(--border);">' +
                          '<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">' + (detailsText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '</pre>' +
                        '</div>' +
                      '</div>' +
                    '</div>';
                    // #region agent log
                    try { fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:1442',message:'After stepsHtml template',data:{stepsHtmlLength:stepsHtml.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); } catch(e) {}
                    // #endregion
                  });
                  
                  // Add CSS animation for new steps
                  if (!document.getElementById('stepAnimationStyle')) {
                    const style = document.createElement('style');
                    style.id = 'stepAnimationStyle';
                    style.textContent = '@keyframes slideIn {' +
                      'from {' +
                        'opacity: 0;' +
                        'transform: translateY(-10px);' +
                      '}' +
                      'to {' +
                        'opacity: 1;' +
                        'transform: translateY(0);' +
                      '}' +
                    '}';
                    document.head.appendChild(style);
                  }
                  
                  stepsContentEl.innerHTML = stepsHtml || '<div style="text-align: center; color: var(--gray-500); padding: 20px;">Noch keine Schritte ausgeführt...</div>';
                  
                  // Auto-scroll to bottom to show latest step
                  stepsContentEl.scrollTop = stepsContentEl.scrollHeight;
                }
                
                // Update console logs if available (detailed view) - Show ALL logs in chronological order
                if (statusData.logs && Array.isArray(statusData.logs) && consoleContentEl) {
                  // Sort logs by timestamp to ensure chronological order
                  const sortedLogs = [...statusData.logs].sort((a, b) => {
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                  });
                  
                  let logHtml = '';
                  sortedLogs.forEach((log, index) => {
                    const time = new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
                    const statusColor = log.status === 'OK' ? '#6a9955' : log.status === 'WARN' ? '#d7ba7d' : '#f48771';
                    const statusIcon = log.status === 'OK' ? '✓' : log.status === 'WARN' ? '⚠' : '✗';
                    const responseTimeText = log.responseTime ? (' (' + log.responseTime + 'ms)') : '';
                    const isLatest = index === sortedLogs.length - 1;
                    const highlightStyle = isLatest ? 'background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6;' : '';
                    
                    let detailsText = '';
                    try {
                      if (typeof log.details === 'object') {
                        detailsText = JSON.stringify(log.details, null, 2);
                      } else {
                        detailsText = String(log.details);
                      }
                    } catch (e) {
                      detailsText = String(log.details);
                    }
                    
                    const latestBadge = isLatest ? '<span style="color: #3b82f6; font-size: 10px; background: rgba(59, 130, 246, 0.2); padding: 2px 6px; border-radius: 3px;">NEU</span>' : '';
                    const detailsDisplay = detailsText.length > 1000 ? detailsText.substring(0, 1000).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '...' : detailsText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                    logHtml += '<div style="margin-bottom: 6px; padding: 8px 12px; border-bottom: 1px solid #2d2d2d; ' + highlightStyle + ' transition: all 0.2s;">' +
                      '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">' +
                        '<span style="color: #858585; font-family: monospace; font-size: 11px;">[' + time + ']</span> ' +
                        '<span style="color: #569cd6; font-family: monospace; font-size: 11px;">[' + (log.stepId || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + ']</span> ' +
                        '<span style="color: ' + statusColor + '; font-weight: 600;">[' + statusIcon + ' ' + (log.status || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + ']</span> ' +
                        '<span style="color: #d4d4d4; font-weight: 600; font-size: 13px;">' + (log.stepName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + responseTimeText + '</span>' +
                        latestBadge +
                      '</div>' +
                      '<div style="margin-left: 20px; margin-top: 4px; color: #ce9178; font-size: 11px; font-family: \'Courier New\', monospace; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;">' +
                        detailsDisplay +
                      '</div>' +
                    '</div>';
                  });
                  
                  if (logHtml === '') {
                    logHtml = '<div style="color: #6a9955; padding: 20px; text-align: center;">[System] Warte auf Logs...</div>';
                  }
                  
                  consoleContentEl.innerHTML = logHtml;
                  // Auto-scroll to bottom to show latest log
                  consoleContentEl.scrollTop = consoleContentEl.scrollHeight;
                }
                
                // Update UI with live status
                if (statusData.message && statusData.message !== lastMessage) {
                  lastMessage = statusData.message;
                  if (statusDetailsEl) {
                    statusDetailsEl.textContent = statusData.message;
                  }
                  
                  // Update progress based on actual number of completed steps
                  if (statusData.logs && Array.isArray(statusData.logs)) {
                    const totalSteps = 6; // Expected total steps
                    const completedSteps = statusData.logs.filter((log) => log.status === 'OK' || log.status === 'ERROR').length;
                    const progressPercent = Math.min(95, Math.round((completedSteps / totalSteps) * 100));
                    
                    if (progressEl) progressEl.style.width = progressPercent + '%';
                    if (progressTextEl) progressTextEl.textContent = progressPercent + '%';
                    
                    // Update status text based on latest log
                    const latestLog = statusData.logs[statusData.logs.length - 1];
                    if (latestLog && statusEl) {
                      const stepCount = statusData.logs.length;
                      statusEl.textContent = 'Schritt ' + stepCount + ': ' + latestLog.stepName;
                    }
                  } else {
                    // Fallback to message-based progress
                    if (statusData.message.includes('Schritt 1/6') || statusData.message.includes('URL normalisiert')) {
                      if (progressEl) progressEl.style.width = '16%';
                      if (progressTextEl) progressTextEl.textContent = '16%';
                      if (statusEl) statusEl.textContent = 'Schritt 1/6: URL Normalisierung';
                    } else if (statusData.message.includes('Schritt 2/6') || statusData.message.includes('Homepage')) {
                      if (progressEl) progressEl.style.width = '33%';
                      if (progressTextEl) progressTextEl.textContent = '33%';
                      if (statusEl) statusEl.textContent = 'Schritt 2/6: Homepage Scraping';
                    } else if (statusData.message.includes('Schritt 3/6') || statusData.message.includes('interne Links')) {
                      if (progressEl) progressEl.style.width = '50%';
                      if (progressTextEl) progressTextEl.textContent = '50%';
                      if (statusEl) statusEl.textContent = 'Schritt 3/6: Interne Links';
                    } else if (statusData.message.includes('Schritt 4/6') || statusData.message.includes('weitere Seiten')) {
                      if (progressEl) progressEl.style.width = '66%';
                      if (progressTextEl) progressTextEl.textContent = '66%';
                      if (statusEl) statusEl.textContent = 'Schritt 4/6: Weitere Seiten';
                    } else if (statusData.message.includes('Schritt 5/6') || statusData.message.includes('GPT')) {
                      if (progressEl) progressEl.style.width = '83%';
                      if (progressTextEl) progressTextEl.textContent = '83%';
                      if (statusEl) statusEl.textContent = 'Schritt 5/6: GPT-Analyse';
                    } else if (statusData.message.includes('Schritt 6/6')) {
                      if (progressEl) progressEl.style.width = '95%';
                      if (progressTextEl) progressTextEl.textContent = '95%';
                      if (statusEl) statusEl.textContent = 'Schritt 6/6: Finalisierung';
                    }
                  }
                }
                
                if (statusData.status === 'completed') {
                  // Analysis complete
                  pollingStopped = true;
                  if (statusEl) statusEl.textContent = '✅ Analyse abgeschlossen';
                  if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgeführt';
                  if (progressEl) progressEl.style.width = '100%';
                  if (progressTextEl) progressTextEl.textContent = '100%';
                  
                  if (resultsContentEl && statusData.recommendations) {
                    resultsContentEl.innerHTML = 
                      '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
                      statusData.recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                      '</div>';
                  }
                  
                  if (resultsEl) resultsEl.style.display = 'block';
                  if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'AI Readiness Check starten';
                  }
                  
                  // Hide loading after a delay
                  setTimeout(() => {
                    if (loadingEl) {
                      loadingEl.style.display = 'none';
                    }
                  }, 2000);
                  
                  return; // Stop polling
                } else if (statusData.status === 'error') {
                  // Critical error - stop polling and handle
                  handlePollingError(new Error(statusData.error || 'Fehler bei der Analyse'));
                  return;
                }
              }
              
              // Check timeout before continuing
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling every 2 seconds for faster updates
              // All errors in scheduled calls are handled by the catch block
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
              
            } catch (error) {
              // Check if this is a critical error that should stop polling
              const isCriticalError = error instanceof Error && (
                error.message.includes('Timeout') || 
                error.message.includes('Fehler bei der Analyse')
              );
              
              if (isCriticalError) {
                handlePollingError(error);
                return;
              }
              
              // Non-critical error - log and continue
              console.error('Non-critical error polling status:', error);
              
              // Check timeout even on error
              if (attempts >= maxAttempts) {
                handlePollingError(new Error('Timeout: Die Analyse hat zu lange gedauert.'));
                return;
              }
              
              // Continue polling on non-critical errors
              setTimeout(() => {
                pollStatus().catch(handlePollingError);
              }, 2000);
            }
          };
          
          // Start polling and handle errors
          pollStatus().catch(handlePollingError);
          
        } catch (error) {
          console.error('Error in AI Readiness check:', error);
          if (statusEl) statusEl.textContent = '❌ Fehler';
          if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
          alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'AI Readiness Check starten';
          }
          if (loadingEl) {
            setTimeout(() => {
              loadingEl.style.display = 'none';
            }, 2000);
          }
        }
      };
    })();
  