
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
    window.showDashboard = function(event) {
      if (event) event.preventDefault();
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      } else {
        // Set first nav item (Dashboard) as active
        const dashboardNav = document.querySelector('.nav-item');
        if (dashboardNav) dashboardNav.classList.add('active');
      }
      // Try to call full implementation if available (after DOMContentLoaded)
      if (window.showDashboardFull) {
        window.showDashboardFull(event);
      } else if (window.dashboardPage) {
        // If DashboardPage is already initialized, use it
        window.dashboardPage.show();
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
      // Try to load analyses if function is available
      if (window.loadAnalyses) {
        window.loadAnalyses();
      } else if (window.showAnalysesFull) {
        window.showAnalysesFull(event);
      } else {
        // Wait for DOMContentLoaded with max attempts
        let attempts = 0;
        const maxAttempts = 50;
        const tryLoad = function() {
          attempts++;
          if (window.loadAnalyses) {
            window.loadAnalyses();
          } else if (window.showAnalysesFull) {
            window.showAnalysesFull(event);
          } else if (attempts < maxAttempts) {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                if (window.loadAnalyses) window.loadAnalyses();
                else if (window.showAnalysesFull) window.showAnalysesFull(event);
              });
            } else {
              setTimeout(tryLoad, 100);
            }
          } else {
            console.error('❌ loadAnalyses not available after ' + maxAttempts + ' attempts');
          }
        };
        tryLoad();
      }
    };
    
    window.showAIAnalysis = function(event) {
      console.log('🔵 showAIAnalysis (early) called');
      if (event) event.preventDefault();
      
      // Hide all sections explicitly
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisSection = document.querySelector('.content-area > .card');
      
      // Hide all sections
      if (dashboardSection) {
        dashboardSection.style.display = 'none';
        console.log('✅ Hidden dashboardSection (early)');
      }
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
      
      // Show AI Analysis section
      if (aiAnalysisSection) {
        aiAnalysisSection.style.display = 'flex'; // Use flex to match CSS
        aiAnalysisSection.style.visibility = 'visible';
        console.log('✅ Showing aiAnalysisSection (early)');
        
        // Make sure the configuration card is visible
        const configurationCard = document.getElementById('configurationCard');
        if (configurationCard) {
          configurationCard.style.display = 'block';
          configurationCard.classList.remove('hidden');
          console.log('✅ Showing configurationCard (early)');
        }
      } else {
        console.error('❌ aiAnalysisSection not found (early)!');
      }
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) {
        headerTitle.textContent = 'AI Analyse';
        console.log('✅ Updated header title (early)');
      }
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) navItem.classList.add('active');
      } else {
        // Set second nav item (AI Analyse) as active
        const navItemsArray = Array.from(document.querySelectorAll('.nav-item'));
        if (navItemsArray.length > 1) {
          navItemsArray[1].classList.add('active');
        }
      }
      
      // Try to call full implementation if available (after DOMContentLoaded)
      if (window.showAIAnalysisFull) {
        console.log('✅ Calling showAIAnalysisFull');
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
      const analysisSection = document.querySelector('.content-area > .card');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'flex'; // Use flex to match CSS
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (analysisSection) analysisSection.style.display = 'none';
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = 'AI Readability';
      
      // Update navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      } else {
        // Set third nav item (AI Readability) as active
        const navItemsArray = Array.from(document.querySelectorAll('.nav-item'));
        if (navItemsArray.length > 2) {
          navItemsArray[2].classList.add('active');
        }
      }
      
      // Try to call full implementation if available (after DOMContentLoaded)
      if (window.showAIReadabilityFull) {
        window.showAIReadabilityFull(event);
      }
    };
    
    // AI Readiness functionality removed
    
    window.viewAnalysisDetails = function(runId) {
      console.log('🔍 viewAnalysisDetails called with runId:', runId);
      if (!runId) {
        console.error('❌ No runId provided');
        alert('Fehler: Keine Analyse-ID angegeben.');
        return;
      }
      // Try to call the full implementation, with retry logic and max attempts
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds in milliseconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        // Check if function is available
        if (window.viewAnalysisDetailsFull) {
          console.log('✅ Calling viewAnalysisDetailsFull');
          if (timeoutId) clearTimeout(timeoutId);
          window.viewAnalysisDetailsFull(runId);
          return; // Success, exit
        }
        
        // Check if we've exceeded max attempts or max time
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ viewAnalysisDetailsFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return; // Exit retry loop
        }
        
        // Continue retrying
        console.warn('⚠️ viewAnalysisDetailsFull not yet available, retrying... (' + attempts + '/' + maxAttempts + ')');
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.deleteAnalysis = function(runId) {
      if (!runId) {
        console.error('❌ No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.deleteAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.deleteAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ deleteAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    window.pauseAnalysis = function(runId) {
      if (!runId) {
        console.error('❌ No runId provided');
        return;
      }
      let attempts = 0;
      const maxAttempts = 50;
      const startTime = Date.now();
      const maxTime = 5000; // 5 seconds
      let timeoutId = null;
      
      const tryCall = () => {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        if (window.pauseAnalysisFull) {
          if (timeoutId) clearTimeout(timeoutId);
          window.pauseAnalysisFull(runId);
          return;
        }
        
        if (attempts >= maxAttempts || elapsed >= maxTime) {
          console.error('❌ pauseAnalysisFull not available after ' + attempts + ' attempts or ' + elapsed + 'ms');
          if (timeoutId) clearTimeout(timeoutId);
          alert('Fehler: Funktion noch nicht geladen. Bitte Seite neu laden.');
          return;
        }
        
        timeoutId = setTimeout(tryCall, 100);
      };
      
      tryCall();
    };
    
    // Helper function to update UI state
    window.updateAnalysisUI = function(stepNumber, stepTitle, stepDescription, progress) {
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      const headerStatus = document.getElementById('headerStatus');
      if (headerTitle) {
        headerTitle.textContent = stepTitle || 'Analyse läuft';
      }
      if (headerStatus) {
        headerStatus.innerHTML = '<div class="header-step-info"><div class="header-step-title">' + 
          (stepTitle || 'Analyse läuft') + '</div><div class="header-step-subtitle">' + 
          (stepDescription || '') + '</div></div>';
      }
      
      // Update modern progress section only
      const analysisProgress = document.getElementById('analysisProgress');
      const stepNumberEl = document.getElementById('stepNumber');
      const stepTitleEl = document.getElementById('currentStepTitle');
      const stepDescEl = document.getElementById('currentStepDescription');
      const progressPercentage = document.getElementById('progressPercentage');
      const progressFill = document.getElementById('progressFill');
      
      if (analysisProgress) {
        analysisProgress.style.display = 'block';
      }
      
      // Hide legacy loading section when showing modern progress
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.display = 'none';
        loading.classList.remove('show');
      }
      
      if (stepNumberEl && stepNumber) {
        stepNumberEl.textContent = stepNumber;
      }
      if (stepTitleEl && stepTitle) {
        stepTitleEl.textContent = stepTitle;
      }
      if (stepDescEl && stepDescription) {
        stepDescEl.textContent = stepDescription;
      }
      if (progressPercentage && progress !== undefined) {
        progressPercentage.textContent = Math.round(progress) + '%';
      }
      if (progressFill && progress !== undefined) {
        progressFill.style.width = progress + '%';
      }
    };
    
    // Helper function to hide configuration and show progress
    window.startAnalysisUI = function() {
      const configCard = document.getElementById('configurationCard');
      const analysisProgress = document.getElementById('analysisProgress');
      const loading = document.getElementById('loading');
      
      if (configCard) {
        configCard.classList.add('hidden');
        setTimeout(() => {
          configCard.style.display = 'none';
        }, 300);
      }
      
      // Hide legacy loading section
      if (loading) {
        loading.style.display = 'none';
        loading.classList.remove('show');
      }
      
      if (analysisProgress) {
        analysisProgress.style.display = 'block';
      }
      
      // Update header
      window.updateAnalysisUI(1, 'Analyse wird vorbereitet', 'Initialisierung...', 0);
    };

    // GLOBAL FUNCTION - available immediately
    window.startAnalysisNow = async function() {
      try {
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Starte Analyse...';
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        let websiteUrl = websiteUrlEl?.value?.trim();
        // Auto-add https:// if missing
        var urlPattern1 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern1.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const country = countryEl?.value?.toUpperCase()?.trim();
        const language = languageEl?.value?.trim();
        const region = regionEl?.value?.trim();
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        if (!websiteUrl || !country || !language) {
          alert('Bitte füllen Sie alle Pflichtfelder aus!\\n\\nURL: ' + (websiteUrl || 'FEHLT') + '\\nLand: ' + (country || 'FEHLT') + '\\nSprache: ' + (language || 'FEHLT'));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          return;
        }
        
        // Hide configuration and show progress
        window.startAnalysisUI();
        
        // Update progress to initial state
        window.updateAnalysisUI(1, 'Analyse wird gestartet', 'Vorbereitung...', 5);
        
        // Call the API
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteUrl,
            country,
            language,
            region: region || undefined
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          alert('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 100));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          // Show config again on error
          const configCard = document.getElementById('configurationCard');
          if (configCard) {
            configCard.style.display = 'block';
            configCard.classList.remove('hidden');
          }
          const analysisProgress = document.getElementById('analysisProgress');
          if (analysisProgress) {
            analysisProgress.style.display = 'none';
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          alert('Fehler: ' + (data.message || data.error));
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Analyse starten';
          }
          if (loading) {
            loading.style.display = 'none';
          }
          // Show config again on error
          const configCard = document.getElementById('configurationCard');
          if (configCard) {
            configCard.style.display = 'block';
            configCard.classList.remove('hidden');
          }
          const analysisProgress = document.getElementById('analysisProgress');
          if (analysisProgress) {
            analysisProgress.style.display = 'none';
          }
          return;
        }
        
        // Continue with workflow - trigger executeStep1 from DOMContentLoaded scope
        // The executeStep1 function will handle the rest of the workflow
        if (data.runId && window.executeStep1) {
          window.currentRunId = data.runId;
          window.workflowData = { websiteUrl, country, language, region, questionsPerCategory };
          window.workflowData.urls = data.urls || [];
          // Call executeStep1 with the formData
          await window.executeStep1({ websiteUrl, country, language, region, questionsPerCategory });
        } else if (data.runId) {
          // If DOMContentLoaded hasn't run yet, wait for it
          document.addEventListener('DOMContentLoaded', async () => {
            if (window.executeStep1) {
              window.currentRunId = data.runId;
              window.workflowData = { websiteUrl, country, language, region };
              window.workflowData.urls = data.urls || [];
              await window.executeStep1({ websiteUrl, country, language, region });
            }
          });
        }
        
      } catch (error) {
        console.error('Error:', error);
        alert('Fehler: ' + (error.message || error));
        const btn = document.getElementById('startAnalysisBtn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Analyse starten';
        }
        // Show config again on error
        const configCard = document.getElementById('configurationCard');
        if (configCard) {
          configCard.style.display = 'block';
          configCard.classList.remove('hidden');
        }
        const analysisProgress = document.getElementById('analysisProgress');
        if (analysisProgress) {
          analysisProgress.style.display = 'none';
        }
      }
    };
    
    document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing form...');
    let pollInterval = null;

    async function pollStatus(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId + '/status');
        const status = await response.json();
        
        if (status.progress) {
          const progress = status.progress.progress || 0;
          const stepTitle = status.progress.step || status.progress.message || 'Verarbeitung...';
          const stepDescription = status.progress.message || '';
          const stepNumber = Math.floor(progress / 20) + 1; // Estimate step number from progress
          
          // Use modern UI update function
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(stepNumber, stepTitle, stepDescription, progress);
          }
        }
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          const loading = document.getElementById('loading');
          if (loading) {
            loading.style.display = 'none';
            loading.classList.remove('show');
          }
          await loadResults(runId);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          const loading = document.getElementById('loading');
          if (loading) {
            loading.style.display = 'none';
            loading.classList.remove('show');
          }
          document.getElementById('result').classList.add('show');
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: red;"><h4>❌ Analyse fehlgeschlagen</h4><p>' + 
            (status.error || status.progress?.message || 'Unknown error') + '</p></div>';
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }

    async function loadResults(runId) {
      try {
        const response = await fetch('/api/analysis/' + runId);
        const result = await response.json();
        
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsContent = document.getElementById('resultsContent');
        
        let html = '<div class="metric-card">';
        html += '<h4>🌐 Website</h4>';
        html += '<p><strong>URL:</strong> ' + result.websiteUrl + '</p>';
        html += '<p><strong>Land:</strong> ' + result.country + '</p>';
        html += '<p><strong>Sprache:</strong> ' + result.language + '</p>';
        html += '</div>';
        
        if (result.categoryMetrics && result.categoryMetrics.length > 0) {
          html += '<div class="metric-card">';
          html += '<h4>📈 Kategorie-Metriken</h4>';
          result.categoryMetrics.forEach(metric => {
            html += '<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">';
            html += '<strong>' + metric.categoryId + '</strong><br>';
            html += 'Sichtbarkeit: <span class="metric-value">' + metric.visibilityScore.toFixed(1) + '</span><br>';
            html += 'Zitationsrate: ' + metric.citationRate.toFixed(2) + '<br>';
            html += 'Brand-Erwähnungen: ' + (metric.brandMentionRate * 100).toFixed(1) + '%';
            html += '</div>';
          });
          html += '</div>';
        }
        
        if (result.competitiveAnalysis) {
          const comp = result.competitiveAnalysis;
          html += '<div class="metric-card">';
          html += '<h4>🏆 Wettbewerbsanalyse</h4>';
          html += '<p><span class="metric-value">' + comp.brandShare.toFixed(1) + '%</span> Brand-Anteil</p>';
          if (Object.keys(comp.competitorShares).length > 0) {
            html += '<p><strong>Konkurrenten:</strong></p><ul>';
            for (const [name, share] of Object.entries(comp.competitorShares)) {
              html += '<li>' + name + ': ' + share.toFixed(1) + '%</li>';
            }
            html += '</ul>';
          }
          html += '</div>';
        }
        
        resultsContent.innerHTML = html;
        resultsContainer.style.display = 'block';
        document.getElementById('result').classList.add('show');
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: green;"><h4>✅ Analyse abgeschlossen!</h4><p>Run ID: ' + runId + '</p></div>';
      } catch (error) {
        document.getElementById('resultContent').innerHTML = 
          '<div style="color: red;">Fehler beim Laden der Ergebnisse: ' + error.message + '</div>';
      }
    }

    let currentRunId = null;
    let currentStep = 'step1';
    let workflowData = {};
    
    // Make variables available globally for startAnalysisNow
    window.currentRunId = currentRunId;
    window.workflowData = workflowData;

    // Extract form submission logic to a function (DEFINED FIRST)
    async function handleFormSubmit() {
      console.log('🔵 handleFormSubmit called');
      try {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        const websiteUrlEl = document.getElementById('websiteUrl');
        const countryEl = document.getElementById('country');
        const languageEl = document.getElementById('language');
        const regionEl = document.getElementById('region');
        
        console.log('Form elements:', {
          websiteUrl: !!websiteUrlEl,
          country: !!countryEl,
          language: !!languageEl,
          region: !!regionEl
        });
        
        if (!websiteUrlEl || !countryEl || !languageEl) {
          throw new Error('Form fields not found');
        }
        
        const questionsPerCategoryEl = document.getElementById('questionsPerCategory');
        const questionsPerCategory = questionsPerCategoryEl ? parseInt(questionsPerCategoryEl.value) || 3 : 3;
        
        let websiteUrl = websiteUrlEl.value.trim();
        // Auto-add https:// if missing
        var urlPattern2 = new RegExp("^https?:\\/\\/", "i");
        if (websiteUrl && !urlPattern2.test(websiteUrl)) {
          websiteUrl = "https://" + websiteUrl;
        }
        const formData = {
          websiteUrl: websiteUrl,
          country: countryEl.value.toUpperCase().trim(),
          language: languageEl.value.trim(),
          region: regionEl ? regionEl.value.trim() || undefined : undefined,
          questionsPerCategory: questionsPerCategory
        };
        
        console.log('📋 Form data extracted:', formData);
        
        // Validate form data
        if (!formData.websiteUrl) {
          throw new Error('Website URL ist erforderlich');
        }
        if (!formData.country) {
          throw new Error('Land ist erforderlich');
        }
        if (!formData.language) {
          throw new Error('Sprache ist erforderlich');
        }
        
        console.log('✅ Form validation passed');

        workflowData = { ...formData };

        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const resultsContainer = document.getElementById('resultsContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (!loading || !result || !progressFill || !progressText) {
          throw new Error('UI elements not found');
        }

        // Hide configuration and show progress
        window.startAnalysisUI();
        
        // Show loading immediately with visual feedback
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
        
        // Reset progress and show initial status
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(1, 'Analyse wird gestartet', 'Vorbereitung der Analyse...', 0);
        }
        
        console.log('Form submitted, calling executeStep1 with:', formData);
        await executeStep1(formData);
      } catch (error) {
        console.error('Error in form submit:', error);
        const startBtn = document.getElementById('startAnalysisBtn');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'Analyse starten';
        }
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 1: Find Sitemap
    async function executeStep1(formData) {
      try {
        console.log('executeStep1 called with:', formData);
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        
        // Update UI for step 1
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(1, 'Sitemap wird gesucht', 'Suche nach sitemap.xml auf ' + formData.websiteUrl, 5);
        }
        
        if (!progressText || !progressFill || !loading) {
          throw new Error('UI elements not found');
        }
        
        // Hide legacy loading, show modern progress
        if (loading) {
          loading.style.display = 'none';
          loading.classList.remove('show');
        }
        result.classList.remove('show');
        
        // Update UI for step 1 start
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(1, 'Sitemap wird gesucht', 'Suche nach sitemap.xml auf ' + formData.websiteUrl, 5);
        }
        
        console.log('Making API call to /api/workflow/step1');
        const response = await fetch('/api/workflow/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: 'Unknown error', message: response.statusText };
          }
          throw new Error(errorData.message || errorData.error || 'Failed to start analysis');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        if (!data.runId) {
          throw new Error('No runId received from server');
        }
        
        currentRunId = data.runId;
        workflowData.urls = data.urls || [];
        workflowData.foundSitemap = data.foundSitemap !== false; // Default to true if not specified
        
        // Update UI based on result
        if (data.foundSitemap) {
          const urlCount = data.urls ? data.urls.length : 0;
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(1, 'Sitemap gefunden', urlCount + ' URLs gefunden. Bereite nächsten Schritt vor...', 20);
          }
        } else {
          const urlCount = data.urls ? data.urls.length : 0;
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(1, 'Sitemap nicht gefunden', urlCount + ' URLs von Startseite extrahiert. Bereite nächsten Schritt vor...', 20);
          }
        }
        
        console.log('Step 1 completed. RunId:', currentRunId, 'URLs:', data.urls?.length || 0, 'FoundSitemap:', data.foundSitemap);
        
        if (data.urls && data.urls.length > 0) {
          // Auto-proceed to step 2
          setTimeout(() => executeStep2(), 1000);
        } else {
          document.getElementById('resultContent').innerHTML = 
            '<div style="color: orange; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">' +
            '⚠️ Keine URLs gefunden. Bitte manuell URLs eingeben oder Crawling verwenden.</div>';
          result.classList.add('show');
          loading.classList.remove('show');
          loading.style.display = 'none';
        }
      } catch (error) {
        console.error('Error in executeStep1:', error);
        const result = document.getElementById('result');
        const loading = document.getElementById('loading');
        const resultContent = document.getElementById('resultContent');
        
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Starten der Analyse:</strong><br>' + 
            (error.message || error || 'Unbekannter Fehler') + 
            '</div>';
        }
        if (result) result.classList.add('show');
        if (loading) loading.classList.remove('show');
        throw error;
      }
    }

    // Step 2: Fetch Content (with live updates)
    async function executeStep2() {
      // Update global reference
      window.currentRunId = currentRunId;
      window.workflowData = workflowData;
      try {
        // Update UI for step 2
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(2, 'Inhalte werden geholt', 'Lade Inhalte von ' + workflowData.urls.length + ' URLs', 25);
        }
        
        // Update UI for step 2 start
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(2, 'Inhalte werden geholt', 'Lade Inhalte von ' + workflowData.urls.length + ' URLs', 25);
        }
        
        const progressText = document.getElementById('progressText');
        const resultContent = document.getElementById('resultContent');
        resultContent.innerHTML = '<h3>📄 Geholte Inhalte:</h3><div id="contentList"></div>';
        document.getElementById('result').classList.add('show');
        
        let fetchedCount = 0;
        const contentList = document.getElementById('contentList');
        const allContent = [];
        
        // Fetch URLs one by one with live updates
        const maxUrls = Math.min(workflowData.urls.length, 50);
        for (let i = 0; i < maxUrls; i++) {
          const url = workflowData.urls[i];
          const progress = 25 + Math.floor((i / maxUrls) * 15);
          
          // Update UI with live progress (removed redundant direct updates)
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(2, 'Inhalte werden geholt', 'Lade URL ' + (i + 1) + ' von ' + maxUrls, progress);
          }
          
          try {
            const response = await fetch('/api/workflow/fetchUrl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: url })
            });
            const data = await response.json();
            
            if (data.content) {
              fetchedCount++;
              allContent.push(data.content);
              const urlDiv = document.createElement('div');
              urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;';
              urlDiv.innerHTML = '<strong>✓ ' + url + '</strong><br><small>' + 
                (data.content.substring(0, 100) + '...') + '</small>';
              contentList.appendChild(urlDiv);
            }
          } catch (error) {
            const urlDiv = document.createElement('div');
            urlDiv.style.cssText = 'margin: 5px 0; padding: 8px; background: #ffebee; border-radius: 4px; border-left: 3px solid #f44336;';
            urlDiv.innerHTML = '<strong>✗ ' + url + '</strong><br><small>Fehler beim Laden</small>';
            contentList.appendChild(urlDiv);
          }
        }
        
        const separator = String.fromCharCode(10) + String.fromCharCode(10);
        workflowData.content = allContent.join(separator);
        // Update UI for step 2 completion
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(2, 'Inhalte geholt', fetchedCount + ' Seiten erfolgreich geladen. Bereite nächsten Schritt vor...', 40);
        }
        
        // Auto-proceed to step 3
        setTimeout(() => executeStep3(), 1000);
      } catch (error) {
        throw error;
      }
    }

    // Step 3: Generate Categories
    async function executeStep3() {
      try {
        // Update UI for step 3
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(3, 'Kategorien werden generiert', 'GPT analysiert Inhalte und generiert Kategorien', 45);
        }
        
        // Update UI for step 3 start
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(3, 'Kategorien werden generiert', 'GPT analysiert Inhalte und generiert Kategorien/Keywords...', 50);
        }
        const response = await fetch('/api/workflow/step3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            content: workflowData.content || 'Website content',
            language: workflowData.language
          })
        });
        const data = await response.json();
        console.log('📊 Step 3 Response:', data);
        console.log('📊 Categories received:', data.categories?.length || 0, data.categories);
        
        if (!data.categories || !Array.isArray(data.categories)) {
          console.error('❌ Invalid categories data:', data);
          alert('Fehler: Keine Kategorien erhalten. Bitte versuche es erneut.');
          return;
        }
        
        workflowData.categories = data.categories;
        
        // Update UI for step 3 completion
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(3, 'Kategorien generiert', data.categories.length + ' Kategorien gefunden. Wähle Kategorien aus...', 60);
        }
        
        // Show categories for user selection
        try {
          showCategorySelection(data.categories);
        } catch (error) {
          console.error('❌ Error in showCategorySelection:', error);
          const resultContent = document.getElementById('resultContent');
          if (resultContent) {
            resultContent.innerHTML = 
              '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>❌ Fehler beim Anzeigen der Kategorien:</strong><br>' + 
              (error.message || error || 'Unbekannter Fehler') + 
              '</div>';
          }
          throw error;
        }
      } catch (error) {
        console.error('❌ Error in executeStep3:', error);
        throw error;
      }
    }

    function showCategorySelection(categories) {
      try {
        console.log('📋 Showing categories:', categories.length, categories);
        
        if (!categories || !Array.isArray(categories)) {
          throw new Error('Ungültige Kategorien-Daten: ' + typeof categories);
        }
        
        const result = document.getElementById('result');
        const resultContent = document.getElementById('resultContent');
        
        if (!result || !resultContent) {
          console.error('❌ Result elements not found!');
          alert('Fehler: Ergebnis-Container nicht gefunden. Bitte Seite neu laden.');
          return;
        }
      
      // Ensure result is visible
      result.style.display = 'block';
      result.classList.add('show');
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">📋 Wähle Kategorien aus (' + categories.length + ' gefunden):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Wähle die Kategorien aus, für die Fragen generiert werden sollen. Du kannst auch neue Kategorien hinzufügen.</p>';
      html += '</div>';
      
      html += '<form id="categoryForm" style="margin-top: 20px;">';
      
      if (!categories || categories.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Kategorien gefunden. Bitte versuche es erneut oder füge manuell Kategorien hinzu.';
        html += '</div>';
      } else {
        // Use grid layout for compact display
        html += '<div id="categoriesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; margin-bottom: 16px;">';
        categories.forEach(function(cat, index) {
          const catId = (cat.id || 'cat_' + index).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catName = (cat.name || 'Kategorie ' + (index + 1)).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const catDesc = (cat.description || 'Keine Beschreibung').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          html += '<div class="category-item-compact" data-cat-id="' + catId + '" style="padding: 10px; background: white; border: 1px solid var(--gray-200); border-radius: 6px; transition: all 0.2s; cursor: pointer;">';
          html += '<label style="display: flex; align-items: center; cursor: pointer; gap: 8px; margin: 0;">';
          html += '<input type="checkbox" name="category" value="' + catId + '" checked style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1; min-width: 0;">';
          html += '<strong style="display: block; color: var(--gray-900); font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + catName + '</strong>';
          html += '<span style="display: block; color: var(--gray-600); font-size: 12px; line-height: 1.3; max-height: 2.6em; overflow: hidden; text-overflow: ellipsis;">' + catDesc + '</span>';
          html += '</div>';
          html += '</label>';
          html += '</div>';
        });
        html += '</div>';
      }
      
      // Add custom category input
      html += '<div style="margin-top: 24px; padding: 16px; background: var(--gray-50); border-radius: 8px; border: 2px dashed var(--gray-300);">';
      html += '<h4 style="margin-bottom: 12px; color: var(--gray-900); font-size: 14px; font-weight: 600;">➕ Neue Kategorie hinzufügen</h4>';
      html += '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 12px;">';
      html += '<input type="text" id="newCategoryName" placeholder="Kategorie-Name" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '<input type="text" id="newCategoryDesc" placeholder="Beschreibung" style="padding: 10px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px;">';
      html += '</div>';
      html += '<button type="button" id="addCategoryBtn" class="btn" style="background: var(--gray-600); padding: 10px 20px; font-size: 14px;">Kategorie hinzufügen</button>';
      html += '</div>';
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">✅ Weiter zu Fragen generieren</button>';
      html += '<button type="button" id="regenerateCategoriesBtn" class="btn" style="background: var(--gray-600); padding: 14px 24px; font-size: 16px;">🔄 Kategorien neu generieren</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Add click handlers for category items (click anywhere on card to toggle checkbox)
      const categoryItems = document.querySelectorAll('.category-item-compact');
      categoryItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL' && e.target.tagName !== 'STRONG' && e.target.tagName !== 'SPAN' && e.target.tagName !== 'DIV') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.click();
            }
          }
        });
      });
      
      // Add event listener for adding custom categories
      const addCategoryBtn = document.getElementById('addCategoryBtn');
      if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
          const nameInput = document.getElementById('newCategoryName');
          const descInput = document.getElementById('newCategoryDesc');
          const name = nameInput?.value?.trim();
          const desc = descInput?.value?.trim();
          
          if (!name) {
            alert('Bitte gib einen Kategorie-Namen ein.');
            return;
          }
          
          // Add new category to the form
          const form = document.getElementById('categoryForm');
          if (form) {
            const newCategoryDiv = document.createElement('div');
            newCategoryDiv.style.cssText = 'margin: 12px 0; padding: 16px; background: white; border: 2px solid var(--primary); border-radius: 8px;';
            newCategoryDiv.innerHTML = 
              '<label style="display: flex; align-items: flex-start; cursor: pointer; gap: 12px;">' +
              '<input type="checkbox" name="category" value="custom_' + Date.now() + '" checked style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;">' +
              '<div style="flex: 1;">' +
              '<strong style="display: block; color: var(--gray-900); font-size: 16px; margin-bottom: 4px;">' + name + '</strong>' +
              '<span style="display: block; color: var(--gray-600); font-size: 14px;">' + (desc || 'Benutzerdefinierte Kategorie') + '</span>' +
              '</div>' +
              '</label>';
            
            // Insert before the "Add category" section
            const addSection = document.querySelector('#categoryForm > div:last-of-type');
            if (addSection && addSection.previousElementSibling) {
              addSection.parentNode?.insertBefore(newCategoryDiv, addSection);
            } else {
              form.insertBefore(newCategoryDiv, form.lastElementChild);
            }
            
            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            
            // Add to workflowData
            if (!workflowData.categories) workflowData.categories = [];
            workflowData.categories.push({
              id: 'custom_' + Date.now(),
              name: name,
              description: desc || 'Benutzerdefinierte Kategorie',
              confidence: 0.5,
              sourcePages: []
            });
          }
        });
      }
      
      // Add event listener for regenerate button
      const regenerateBtn = document.getElementById('regenerateCategoriesBtn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', async () => {
          if (confirm('Möchtest du die Kategorien wirklich neu generieren? Die aktuellen Auswahlen gehen verloren.')) {
            await executeStep3();
          }
        });
      }
      
      // Add form submit handler
      const categoryForm = document.getElementById('categoryForm');
      if (categoryForm) {
        console.log('📋 Setting up category form submit handler');
        
        // Remove existing listeners by cloning (but keep the form reference)
        const formClone = categoryForm.cloneNode(true);
        categoryForm.parentNode?.replaceChild(formClone, categoryForm);
        
        // Get the new form element
        const newForm = document.getElementById('categoryForm');
        if (newForm) {
          console.log('✅ Category form found, adding submit listener');
          
          newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔵 Category form submitted!');
            
            const selected = Array.from(document.querySelectorAll('input[name="category"]:checked'))
              .map(cb => cb.value);
            
            console.log('✅ Selected categories:', selected);
            console.log('📊 Available categories:', workflowData.categories?.length || 0);
            
            if (selected.length === 0) {
              alert('Bitte wähle mindestens eine Kategorie aus.');
              return;
            }
            
            // Update workflow data
            workflowData.selectedCategories = selected;
            
            // IMMEDIATE VISUAL FEEDBACK - Disable button and show loading
            const submitBtn = e.target.closest('form')?.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = '⏳ Generiere Fragen...';
              submitBtn.style.opacity = '0.7';
              submitBtn.style.cursor = 'not-allowed';
            }
            
            // Show loading state immediately
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            // Update UI for step 4 start
            if (window.updateAnalysisUI) {
              window.updateAnalysisUI(4, 'Fragen werden generiert', 'GPT generiert Fragen für ' + selected.length + ' ausgewählte Kategorien. Bitte warten...', 60);
            }
            
            // Show progress in result area too
            const resultContent = document.getElementById('resultContent');
            if (resultContent) {
              resultContent.innerHTML = 
                '<div style="text-align: center; padding: 40px;">' +
                '<div style="font-size: 48px; margin-bottom: 20px;">⏳</div>' +
                '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
                '<p style="color: var(--gray-600); margin-bottom: 20px;">GPT generiert ' + (workflowData.questionsPerCategory || 3) + ' Fragen pro Kategorie für ' + selected.length + ' Kategorien.</p>' +
                '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
                '</div>';
              document.getElementById('result').style.display = 'block';
              document.getElementById('result').classList.add('show');
            }
            
            // Add spinning animation CSS if not already present
            if (!document.getElementById('spinnerStyle')) {
              const style = document.createElement('style');
              style.id = 'spinnerStyle';
              style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
              document.head.appendChild(style);
            }
            
            try {
              console.log('🚀 Calling executeStep4...');
              await executeStep4();
            } catch (error) {
              console.error('❌ Error in executeStep4:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Generieren der Fragen: ' + errorMessage);
              
              // Re-enable button
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '✅ Weiter zu Fragen generieren';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
              }
              
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('✅ Category form submit handler attached');
        } else {
          console.error('❌ Could not find categoryForm after clone');
        }
      } else {
        console.error('❌ Category form not found!');
      }
      } catch (error) {
        console.error('❌ Error in showCategorySelection:', error);
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="color: red; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Anzeigen der Kategorien:</strong><br>' + 
            (error && typeof error === 'object' && 'message' in error ? error.message : String(error)) + 
            '<br><small>Bitte versuche es erneut oder lade die Seite neu.</small>' +
            '</div>';
        }
        throw error;
      }
    }

    // Step 4: Generate Prompts
    async function executeStep4() {
      try {
        console.log('🚀 executeStep4 called');
        console.log('📊 Selected categories:', workflowData.selectedCategories);
        console.log('📊 Available categories:', workflowData.categories?.length || 0);
        console.log('📊 Current runId:', currentRunId);
        
        if (!workflowData.selectedCategories || workflowData.selectedCategories.length === 0) {
          throw new Error('Keine Kategorien ausgewählt');
        }
        
        if (!workflowData.categories || workflowData.categories.length === 0) {
          throw new Error('Keine Kategorien verfügbar');
        }
        
        const selectedCats = workflowData.categories.filter(c => 
          workflowData.selectedCategories.includes(c.id)
        );
        
        console.log('📋 Filtered selected categories:', selectedCats.length, selectedCats);
        
        if (selectedCats.length === 0) {
          throw new Error('Keine passenden Kategorien gefunden. Bitte wähle Kategorien aus.');
        }
        
        const questionsPerCategory = workflowData.questionsPerCategory || 3;
        const totalQuestions = selectedCats.length * questionsPerCategory;
        console.log('📊 Questions per category:', questionsPerCategory);
        console.log('📊 Total questions to generate:', totalQuestions);
        
        // Update progress with detailed info
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(4, 'Fragen werden generiert', 'GPT generiert ' + questionsPerCategory + ' Fragen pro Kategorie für ' + selectedCats.length + ' Kategorien. Dies kann einige Sekunden dauern...', 65);
        }
        
        // Update result area with progress
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">⏳</div>' +
            '<h3 style="color: var(--gray-900); margin-bottom: 12px;">Fragen werden generiert...</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 8px;">Generiere ' + questionsPerCategory + ' Fragen pro Kategorie</p>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">für ' + selectedCats.length + ' Kategorien = ' + totalQuestions + ' Fragen insgesamt</p>' +
            '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>' +
            '<p style="color: var(--gray-500); font-size: 12px; margin-top: 20px;">Bitte warten, dies kann 30-60 Sekunden dauern...</p>' +
            '</div>';
        }
        
        console.log('📡 Making API call to /api/workflow/step4');
        console.log('📊 Sending questionsPerCategory:', questionsPerCategory);
        const response = await fetch('/api/workflow/step4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            categories: selectedCats,
            userInput: workflowData,
            content: workflowData.content || '',
            questionsPerCategory: questionsPerCategory
          })
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error('API Fehler: ' + response.status + ' - ' + errorText.substring(0, 200));
        }
        
        const data = await response.json();
        console.log('✅ API Response data:', data);
        console.log('📋 Prompts received:', data.prompts?.length || 0);
        
        if (!data.prompts || !Array.isArray(data.prompts)) {
          throw new Error('Keine Fragen erhalten. Bitte versuche es erneut.');
        }
        
        workflowData.prompts = data.prompts;
        
        // Update progress to 80%
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(4, 'Fragen generiert', data.prompts.length + ' Fragen erfolgreich generiert. Bitte überprüfe und bearbeite die Fragen.', 80);
        }
        
        // Show success message briefly before showing prompts
        if (resultContent) {
          resultContent.innerHTML = 
            '<div style="text-align: center; padding: 40px;">' +
            '<div style="font-size: 48px; margin-bottom: 20px;">✅</div>' +
            '<h3 style="color: var(--success); margin-bottom: 12px;">Fragen erfolgreich generiert!</h3>' +
            '<p style="color: var(--gray-600); margin-bottom: 20px;">' + data.prompts.length + ' Fragen wurden generiert und werden gleich angezeigt...</p>' +
            '</div>';
        }
        
        // Wait a moment to show success, then display prompts
        setTimeout(function() {
          showPromptSelection(data.prompts);
        }, 1000);
      } catch (error) {
        console.error('❌ Error in executeStep4:', error);
        const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        const errorStack = error && typeof error === 'object' && 'stack' in error ? error.stack : '';
        console.error('Error details:', errorMessage, errorStack);
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '❌ Fehler beim Generieren der Fragen';
        if (statusDetailsEl) statusDetailsEl.textContent = errorMessage || 'Unbekannter Fehler';
        
        alert('Fehler beim Generieren der Fragen: ' + errorMessage);
        throw error;
      }
    }

    function showPromptSelection(prompts) {
      console.log('📋 Showing prompts:', prompts.length);
      const resultContent = document.getElementById('resultContent');
      if (!resultContent) {
        console.error('❌ resultContent not found!');
        return;
      }
      
      let html = '<div style="margin-bottom: 20px;">';
      html += '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">❓ Generierte Fragen (' + prompts.length + '):</h3>';
      html += '<p style="color: var(--gray-600); font-size: 14px; margin-bottom: 20px;">Du kannst die Fragen bearbeiten oder einzelne deaktivieren, bevor die Analyse startet.</p>';
      html += '</div>';
      
      html += '<form id="promptForm" style="margin-top: 20px;">';
      
      if (!prompts || prompts.length === 0) {
        html += '<div style="padding: 20px; background: var(--gray-100); border-radius: 8px; color: var(--gray-600);">';
        html += 'Keine Fragen gefunden. Bitte versuche es erneut.';
        html += '</div>';
      } else {
        prompts.forEach((prompt, idx) => {
          const promptId = prompt.id || 'prompt_' + idx;
          const promptQuestion = prompt.question || prompt.text || '';
          html += '<div style="margin-bottom: 16px; padding: 16px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; transition: all 0.2s;">';
          html += '<div style="display: flex; align-items: flex-start; gap: 12px;">';
          html += '<input type="checkbox" name="selected" value="' + promptId + '" checked style="width: 20px; height: 20px; margin-top: 4px; cursor: pointer; flex-shrink: 0;">';
          html += '<div style="flex: 1;">';
          html += '<label style="display: block; color: var(--gray-700); font-size: 12px; font-weight: 600; margin-bottom: 6px;">Frage ' + (idx + 1) + ':</label>';
          html += '<textarea name="prompt_' + promptId + '" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 60px;" rows="2">' + promptQuestion.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
      }
      
      html += '<div style="margin-top: 24px; display: flex; gap: 12px;">';
      html += '<button type="submit" class="btn btn-primary" style="flex: 1; padding: 14px 24px; font-size: 16px;">🚀 Analyse mit GPT-5 starten</button>';
      html += '</div>';
      html += '</form>';
      
      resultContent.innerHTML = html;
      
      // Remove existing form and recreate to avoid duplicate listeners
      const promptForm = document.getElementById('promptForm');
      if (promptForm) {
        const formClone = promptForm.cloneNode(true);
        promptForm.parentNode?.replaceChild(formClone, promptForm);
        
        const newPromptForm = document.getElementById('promptForm');
        if (newPromptForm) {
          newPromptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔵 Prompt form submitted!');
            
            const updatedPrompts = prompts.map(p => {
              const textarea = document.querySelector('textarea[name="prompt_' + p.id + '"]');
              const checkbox = document.querySelector('input[name="selected"][value="' + p.id + '"]');
              return {
                ...p,
                question: textarea ? textarea.value : p.question,
                isSelected: checkbox ? checkbox.checked : true
              };
            }).filter(p => p.isSelected);
            
            console.log('✅ Updated prompts:', updatedPrompts.length);
            
            if (updatedPrompts.length === 0) {
              alert('Bitte wähle mindestens eine Frage aus.');
              return;
            }
            
            workflowData.prompts = updatedPrompts;
            
            // Show loading
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'block';
              loading.classList.add('show');
            }
            
            // Update UI for step 5 start
            if (window.updateAnalysisUI) {
              window.updateAnalysisUI(5, 'GPT-5 Ausführung', 'Führe ' + updatedPrompts.length + ' Fragen aus...', 80);
            }
            
            try {
              await executeStep5();
            } catch (error) {
              console.error('❌ Error in executeStep5:', error);
              const errorMessage = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
              alert('Fehler beim Ausführen der Fragen: ' + errorMessage);
              if (loading) {
                loading.style.display = 'none';
              }
            }
          });
          
          console.log('✅ Prompt form submit handler attached');
        }
      }
    }

    // Step 5: Execute with GPT-5 (with live updates)
    async function executeStep5() {
      try {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const resultContent = document.getElementById('resultContent');
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        
        // Initialize result area
        resultContent.innerHTML = 
          '<div style="margin-bottom: 20px;">' +
          '<h3 style="margin-bottom: 16px; color: var(--gray-900); font-size: 20px;">🤖 GPT-5 Antworten (Live):</h3>' +
          '<p style="color: var(--gray-600); font-size: 14px;">Jede Frage wird einzeln ausgeführt und live angezeigt...</p>' +
          '</div>' +
          '<div id="responsesList" style="display: flex; flex-direction: column; gap: 16px;"></div>';
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').classList.add('show');
        
        const responsesList = document.getElementById('responsesList');
        let executedCount = 0;
        const promptsLength = workflowData.prompts.length;
        
        // Store all questions and answers for summary
        const allQuestionsAndAnswers = [];
        
        // Update status
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(5, 'GPT-5 Ausführung läuft', 'Führe ' + promptsLength + ' Fragen mit Web Search aus...', 80);
        }
        
        // Execute prompts one by one with live updates
        for (let i = 0; i < promptsLength; i++) {
          const prompt = workflowData.prompts[i];
          const progressPercent = 80 + ((i / promptsLength) * 20);
          
          // Update progress
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(5, 'GPT-5 Ausführung läuft', 'Frage ' + (i + 1) + '/' + promptsLength + ' wird ausgeführt...', progressPercent);
          }
          
          // Show "processing" indicator for current question
          const processingDiv = document.createElement('div');
          processingDiv.id = 'processing_' + i;
          processingDiv.style.cssText = 'padding: 16px; background: var(--gray-100); border: 2px dashed var(--gray-300); border-radius: 8px; text-align: center;';
          processingDiv.innerHTML = 
            '<div style="display: inline-block; width: 24px; height: 24px; border: 3px solid var(--gray-300); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;"></div>' +
            '<p style="color: var(--gray-700); font-weight: 600; margin: 0;">Frage ' + (i + 1) + ' wird ausgeführt...</p>' +
            '<p style="color: var(--gray-600); font-size: 14px; margin: 4px 0 0 0;">' + prompt.question + '</p>';
          responsesList.appendChild(processingDiv);
          processingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          try {
            const response = await fetch('/api/workflow/executePrompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                runId: currentRunId,
                prompt: prompt,
                userInput: workflowData
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'API Fehler: ' + response.status);
            }
            
            const data = await response.json();
            
            console.log('📡 API Response data:', JSON.stringify(data, null, 2));
            console.log('📊 Response outputText:', data.response?.outputText);
            console.log('📊 Response citations:', JSON.stringify(data.response?.citations, null, 2));
            console.log('📊 Analysis citations:', JSON.stringify(data.analysis?.citations, null, 2));
            console.log('📊 Citations count in response:', data.response?.citations?.length || 0);
            console.log('📊 Citations count in analysis:', data.analysis?.citations?.length || 0);
            console.log('📊 Full response object keys:', data.response ? Object.keys(data.response) : 'no response');
            console.log('📊 Full analysis object keys:', data.analysis ? Object.keys(data.analysis) : 'no analysis');
            
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            if (data.response && data.analysis) {
              executedCount++;
              let answerText = data.response.outputText || '';
              
              console.log('✅ Answer text length:', answerText.length);
              console.log('✅ Answer text preview:', answerText.substring(0, 100));
              console.log('📊 Full response object:', data.response);
              
              // If answer is empty, try to get it from different paths
              if (!answerText || answerText.trim().length === 0) {
                console.warn('⚠️ Empty answer text! Trying fallback paths...');
                if (data.response?.text) {
                  answerText = data.response.text;
                  console.log('✅ Found text in response.text');
                } else if (data.response?.content) {
                  answerText = typeof data.response.content === 'string' 
                    ? data.response.content 
                    : JSON.stringify(data.response.content);
                  console.log('✅ Found text in response.content');
                } else if (data.outputText) {
                  answerText = data.outputText;
                  console.log('✅ Found text in data.outputText');
                } else {
                  console.warn('⚠️ No answer text found anywhere! Full data:', JSON.stringify(data, null, 2));
                  answerText = '⚠️ Keine Antwort erhalten. Bitte Browser-Konsole für Details prüfen.';
                }
              }
              
              // Use citations directly from GPT-5 Web Search response (response.citations)
              // Fallback to analysis.citations if response.citations is not available
              const responseCitations = data.response?.citations || [];
              const analysisCitations = data.analysis?.citations || [];
              const citations = responseCitations.length > 0 ? responseCitations : analysisCitations;
              
              const brandMentions = data.analysis.brandMentions || { exact: 0, fuzzy: 0, contexts: [], citations: 0 };
              const competitors = data.analysis.competitors || [];
              const sentiment = data.analysis.sentiment || { tone: 'neutral', confidence: 0 };
              
              // Store question and answer for summary
              allQuestionsAndAnswers.push({
                question: prompt.question,
                answer: answerText,
                citations: citations,
                brandMentions: brandMentions,
                competitors: competitors
              });
              
              // Create response card
              const responseDiv = document.createElement('div');
              responseDiv.style.cssText = 'padding: 20px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
              
              let citationsHtml = '';
              if (citations.length > 0) {
                citationsHtml = '<div style="margin-top: 16px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; font-weight: 500; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Quellen (' + citations.length + ')</div>';
                citationsHtml += '<div style="display: flex; flex-direction: column; gap: 8px;">';
                citations.forEach(function(citation, idx) {
                  const url = citation.url || '';
                  const title = citation.title || url || 'Unbenannte Quelle';
                  const snippet = citation.snippet || '';
                  citationsHtml += '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="citation-link" style="color: #0369a1; font-size: 13px; text-decoration: none; padding: 12px; background: #ffffff; border-radius: 6px; display: block; border: 1px solid #e5e7eb; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;">';
                  citationsHtml += '<div style="display: flex; align-items: start; gap: 10px;">';
                  citationsHtml += '<span style="font-weight: 600; color: #3b82f6; font-size: 13px; min-width: 24px; padding-top: 2px;">' + (idx + 1) + '.</span>';
                  citationsHtml += '<div style="flex: 1;">';
                  citationsHtml += '<div style="font-weight: 500; color: #111827; margin-bottom: 4px; line-height: 1.4;">' + title.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                  if (url) {
                    try {
                      const hostname = new URL(url).hostname;
                      citationsHtml += '<div style="color: #6b7280; font-size: 11px; margin-bottom: 6px; font-family: ui-monospace, monospace;">' + hostname + '</div>';
                    } catch (e) {
                      // Invalid URL, skip hostname
                    }
                  }
                  if (snippet && snippet.trim().length > 0) {
                    citationsHtml += '<div style="color: #6b7280; font-size: 12px; line-height: 1.5; font-style: normal;">';
                    citationsHtml += snippet.substring(0, 120).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (snippet.length > 120 ? '...' : '');
                    citationsHtml += '</div>';
                  }
                  citationsHtml += '</div></div></a>';
                });
                citationsHtml += '</div></div>';
                // Add CSS for citation links hover effect (after HTML is inserted)
                if (!document.getElementById('citation-link-style')) {
                  const style = document.createElement('style');
                  style.id = 'citation-link-style';
                  style.textContent = '.citation-link:hover { border-color: #3b82f6 !important; box-shadow: 0 2px 4px rgba(59,130,246,0.1) !important; transform: translateY(-1px) !important; }';
                  document.head.appendChild(style);
                }
              } else {
                // Show message if no citations available
                citationsHtml = '<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">';
                citationsHtml += '<div style="font-size: 13px; color: #6b7280;">Keine Quellen verfügbar</div>';
                citationsHtml += '</div>';
              }
              
              let mentionsHtml = '';
              const totalMentions = brandMentions.exact + brandMentions.fuzzy;
              if (totalMentions > 0) {
                mentionsHtml = '<div style="margin-top: 16px; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">';
                mentionsHtml += '<div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">';
                mentionsHtml += '<span style="color: #10b981; font-weight: 600;">Markenerwähnungen gefunden</span>';
                mentionsHtml += '<span style="color: #6b7280;">•</span>';
                mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.exact + '</strong> exakt</span>';
                if (brandMentions.fuzzy > 0) {
                  mentionsHtml += '<span style="color: #6b7280;">•</span>';
                  mentionsHtml += '<span style="color: #374151;"><strong>' + brandMentions.fuzzy + '</strong> ähnlich</span>';
                }
                mentionsHtml += '</div></div>';
              }
              
              // Competitors section removed as requested
              let competitorsHtml = '';
              
              responseDiv.innerHTML = 
                '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">' +
                '<span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #3b82f6; color: white; border-radius: 8px; font-weight: 600; font-size: 15px; flex-shrink: 0;">' + (i + 1) + '</span>' +
                '<h4 style="margin: 0; color: #111827; font-size: 17px; font-weight: 600; line-height: 1.4;">' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h4>' +
                '</div>' +
                '<div style="margin-bottom: 16px;">' +
                '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Antwort</div>' +
                '<div style="white-space: pre-wrap; background: #f9fafb; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; color: #374151; line-height: 1.7; font-size: 14px; max-height: 400px; overflow-y: auto;">' + 
                answerText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
                '</div>' +
                '</div>' +
                mentionsHtml +
                citationsHtml;
              
              responsesList.appendChild(responseDiv);
              responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              throw new Error('Ungültige Antwort vom Server');
            }
          } catch (error) {
            // Remove processing indicator
            const processingEl = document.getElementById('processing_' + i);
            if (processingEl) processingEl.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; border-left: 4px solid #f44336;';
            errorDiv.innerHTML = 
              '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
              '<span style="font-size: 20px;">❌</span>' +
              '<strong style="color: #c62828;">Fehler bei Frage ' + (i + 1) + ':</strong>' +
              '</div>' +
              '<p style="margin: 4px 0; color: var(--gray-700);">' + prompt.question + '</p>' +
              '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
            responsesList.appendChild(errorDiv);
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        
        // Final update
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(5, 'Analyse abgeschlossen', executedCount + ' von ' + promptsLength + ' Fragen erfolgreich ausgeführt. Ergebnisse sind unten sichtbar.', 100);
        }
        
        // Save all responses
        try {
          await fetch('/api/workflow/step5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: currentRunId,
              prompts: workflowData.prompts
            })
          });
        } catch (error) {
          console.error('Error saving responses:', error);
        }
        
        // Generate summary/fazit after all questions are answered
        if (executedCount > 0 && allQuestionsAndAnswers.length > 0) {
          await generateSummary(allQuestionsAndAnswers, workflowData);
        }
        
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'none';
          loading.classList.remove('show');
        }
      } catch (error) {
        console.error('Error in executeStep5:', error);
        throw error;
      }
    }

    async function generateSummary(questionsAndAnswers, workflowData) {
      try {
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        const responsesList = document.getElementById('responsesList');
        
        if (statusEl) {
          statusEl.textContent = '📊 Fazit wird generiert...';
          statusEl.style.color = '#7c3aed';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT analysiert alle Fragen und Antworten...';
        }
        
        // Check if responsesList exists
        if (!responsesList) {
          console.error('❌ responsesList element not found');
          throw new Error('Responses list element not found');
        }
        
        // Show loading indicator
        const summaryLoadingDiv = document.createElement('div');
        summaryLoadingDiv.id = 'summaryLoading';
        summaryLoadingDiv.style.cssText = 'padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; margin-top: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        summaryLoadingDiv.innerHTML = 
          '<div style="display: inline-block; width: 32px; height: 32px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>' +
          '<p style="color: white; font-weight: 600; margin: 0; font-size: 16px;">Fazit wird generiert...</p>' +
          '<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">GPT analysiert alle Fragen und Antworten</p>';
        responsesList.appendChild(summaryLoadingDiv);
        summaryLoadingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Call API to generate summary
        const response = await fetch('/api/workflow/generateSummary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: currentRunId,
            questionsAndAnswers: questionsAndAnswers,
            userInput: workflowData
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Fehler beim Generieren des Fazits';
          throw new Error(errorMessage);
        }
        
        const summaryData = await response.json();
        
        // Remove loading indicator
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        // Display summary
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'summary';
        summaryDiv.style.cssText = 'padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-top: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;';
        
        const totalMentions = summaryData.totalMentions || 0;
        const totalCitations = summaryData.totalCitations || 0;
        const bestPrompts = summaryData.bestPrompts || [];
        const otherSources = summaryData.otherSources || {};
        
        let bestPromptsHtml = '';
        if (bestPrompts.length > 0) {
          bestPromptsHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          bestPromptsHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">🏆 Beste Prompts:</h4>';
          bestPromptsHtml += '<ul style="margin: 0; padding-left: 20px; list-style: none;">';
          bestPrompts.forEach(function(prompt, idx) {
            bestPromptsHtml += '<li style="margin-bottom: 8px; padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border-left: 3px solid white;">';
            bestPromptsHtml += '<span style="font-weight: 600; margin-right: 8px;">' + (idx + 1) + '.</span>';
            bestPromptsHtml += '<span>' + prompt.question.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
            bestPromptsHtml += '<div style="margin-top: 4px; font-size: 12px; opacity: 0.9;">Erwähnungen: ' + prompt.mentions + ', Zitierungen: ' + prompt.citations + '</div>';
            bestPromptsHtml += '</li>';
          });
          bestPromptsHtml += '</ul></div>';
        }
        
        let otherSourcesHtml = '';
        const sourceEntries = Object.entries(otherSources);
        if (sourceEntries.length > 0) {
          otherSourcesHtml = '<div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px);">';
          otherSourcesHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">🔗 Andere Links (Zitierungen):</h4>';
          otherSourcesHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">';
          sourceEntries.forEach(function([source, count]) {
            otherSourcesHtml += '<div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">';
            otherSourcesHtml += '<div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">' + count + '</div>';
            otherSourcesHtml += '<div style="font-size: 12px; opacity: 0.9; word-break: break-word;">' + source.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            otherSourcesHtml += '</div>';
          });
          otherSourcesHtml += '</div></div>';
        }
        
        summaryDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">' +
          '<span style="font-size: 32px;">📊</span>' +
          '<h3 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Fazit</h3>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalMentions + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Erwähnungen</div>' +
          '</div>' +
          '<div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">' +
          '<div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">' + totalCitations + '</div>' +
          '<div style="font-size: 14px; opacity: 0.9;">Anzahl Zitierungen</div>' +
          '</div>' +
          '</div>' +
          bestPromptsHtml +
          otherSourcesHtml;
        
        // Check if responsesList still exists before appending
        if (responsesList) {
          responsesList.appendChild(summaryDiv);
          summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          console.error('❌ responsesList element not found when trying to append summary');
        }
        
        if (statusEl) {
          statusEl.textContent = '✅ Fazit generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Analysen abgeschlossen';
        }
      } catch (error) {
        console.error('Error generating summary:', error);
        const loadingEl = document.getElementById('summaryLoading');
        if (loadingEl) loadingEl.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 16px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px; margin-top: 24px;';
        errorDiv.innerHTML = 
          '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
          '<span style="font-size: 20px;">❌</span>' +
          '<strong style="color: #c62828;">Fehler beim Generieren des Fazits:</strong>' +
          '</div>' +
          '<small style="color: #d32f2f;">' + (error.message || 'Unbekannter Fehler') + '</small>';
        const responsesList = document.getElementById('responsesList');
        if (responsesList) responsesList.appendChild(errorDiv);
      }
    }

    const analyzeForm = document.getElementById('analyzeForm');
    if (!analyzeForm) {
      console.error('❌ Form element not found!');
      alert('Fehler: Formular nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('✅ Form found, adding event listeners...');
    
    // Handle button click - PRIMARY METHOD
    const startBtn = document.getElementById('startAnalysisBtn');
    if (!startBtn) {
      console.error('❌ Start button not found!');
      alert('Fehler: Start-Button nicht gefunden. Bitte Seite neu laden.');
      return;
    }
    
    console.log('✅ Start button found, attaching click handler...');
    
    // Override the inline onclick with our full handler
    startBtn.onclick = async function(e) {
      console.log('🔵 Button clicked via onclick handler!');
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      try {
        // Visual feedback immediately
        startBtn.disabled = true;
        const originalText = startBtn.textContent;
        startBtn.textContent = 'Starte Analyse...';
        startBtn.style.opacity = '0.7';
        startBtn.style.cursor = 'not-allowed';
        
        console.log('🔵 Calling handleFormSubmit...');
        await handleFormSubmit();
        
        // Re-enable button after completion
        startBtn.disabled = false;
        startBtn.textContent = originalText;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      } catch (error) {
        console.error('❌ Error in button click handler:', error);
        alert('Fehler beim Starten der Analyse: ' + (error.message || error));
        
        // Re-enable button on error
        startBtn.disabled = false;
        startBtn.textContent = 'Analyse starten';
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
      }
    };
    
    console.log('✅ Button onclick handler attached');
    
    // Prevent form submission on Enter key in input fields
    const formInputs = analyzeForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔵 Enter key pressed, triggering button click');
          startBtn.click();
        }
      });
    });
    
    // Also handle form submit (as fallback)
    analyzeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔵 Form submitted (fallback)!');
      startBtn.click(); // Trigger button click instead
    });
    
    
    console.log('✅ All event listeners attached successfully');
    
    // Make functions available globally for startAnalysisNow
    window.executeStep1 = executeStep1;
    window.executeStep2 = executeStep2;
    window.executeStep3 = executeStep3;
    window.executeStep4 = executeStep4;
    window.executeStep5 = executeStep5;

    // Helper functions
    function hideAllSections() {
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const configurationCard = document.querySelector('.content-area > .card');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (configurationCard) configurationCard.style.display = 'none';
    }
    
    function updateNavActive(event) {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      if (event && event.target) {
        event.target.closest('.nav-item')?.classList.add('active');
      }
    }
    
    // Dashboard functionality
    function showDashboard(event) {
      hideAllSections();
      const dashboardSection = document.getElementById('dashboardSection');
      if (dashboardSection) {
        dashboardSection.style.display = 'block';
        // Initialize dashboard if not already initialized
        if (!window.dashboardPage) {
          window.dashboardPage = new DashboardPage();
        }
        window.dashboardPage.show();
      }
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) headerTitle.textContent = 'Dashboard';
      updateNavActive(event);
    }
    
    // Dashboard Page Class (for legacy support)
    class DashboardPage {
      constructor() {
        this.dashboardSection = document.getElementById('dashboardSection');
        this.viewMode = 'local';
        this.selectedCompanyId = null;
        this.selectedCategory = null;
        this.selectedAnalysisId = null;
      }
      
      async render() {
        if (!this.dashboardSection) return;
        
        try {
          const content = this.viewMode === 'local' 
            ? await this.renderLocalView() 
            : await this.renderGlobalView();
            
          this.dashboardSection.innerHTML = `
            <div class="dashboard-container">
              <div class="dashboard-header">
                <div class="view-toggle">
                  <button class="toggle-btn ${this.viewMode === 'local' ? 'active' : ''}" data-mode="local">
                    Lokal
                  </button>
                  <button class="toggle-btn ${this.viewMode === 'global' ? 'active' : ''}" data-mode="global">
                    Global
                  </button>
                </div>
              </div>
              <div class="dashboard-content">
                ${content}
              </div>
            </div>
          `;
          
          this.attachEventListeners();
        } catch (error) {
          console.error('Error rendering dashboard:', error);
          if (this.dashboardSection) {
            this.dashboardSection.innerHTML = `
              <div class="error-state">
                <p>Fehler beim Laden: ${error.message}</p>
              </div>
            `;
          }
        }
      }
      
      attachEventListeners() {
        // Toggle buttons
        const toggleButtons = this.dashboardSection.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            if (mode) {
              this.viewMode = mode;
              this.selectedCompanyId = null;
              this.selectedCategory = null;
              this.selectedAnalysisId = null;
              this.render();
            }
          });
        });
        
        // Company cards (local view)
        if (this.viewMode === 'local' && !this.selectedCompanyId && !this.selectedAnalysisId) {
          const companyCards = this.dashboardSection.querySelectorAll('.company-card');
          companyCards.forEach(card => {
            card.addEventListener('click', () => {
              this.selectedCompanyId = card.dataset.companyId;
              this.selectedAnalysisId = null;
              this.render();
            });
          });
        }
        
        // Analysis cards (local view - when company is selected)
        if (this.viewMode === 'local' && this.selectedCompanyId && !this.selectedAnalysisId) {
          const analysisCards = this.dashboardSection.querySelectorAll('.analysis-card');
          analysisCards.forEach(card => {
            card.addEventListener('click', async () => {
              this.selectedAnalysisId = card.dataset.runId;
              await this.render();
            });
          });
        }
        
        // Category cards (global view)
        if (this.viewMode === 'global' && !this.selectedCategory) {
          const categoryCards = this.dashboardSection.querySelectorAll('.category-card');
          categoryCards.forEach(card => {
            card.addEventListener('click', () => {
              this.selectedCategory = card.dataset.categoryName;
              this.render();
            });
          });
        }
        
        // Back button
        const backBtn = this.dashboardSection.querySelector('.back-btn');
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            if (this.viewMode === 'local') {
              if (this.selectedAnalysisId) {
                this.selectedAnalysisId = null;
              } else {
                this.selectedCompanyId = null;
              }
            } else {
              this.selectedCategory = null;
            }
            this.render();
          });
        }
      }
      
      async renderLocalView() {
        if (this.selectedAnalysisId) {
          // Show analysis questions and summary
          try {
            // Fetch prompts and summary
            const promptsSummaryResponse = await fetch(window.getApiUrl('/api/analysis/' + this.selectedAnalysisId + '/prompts-summary'));
            const promptsSummaryData = await promptsSummaryResponse.json();
            
            const prompts = promptsSummaryData.prompts || [];
            const summary = promptsSummaryData.summary;
            
            let promptsHtml = '';
            if (prompts.length > 0) {
              promptsHtml = `
                <div class="summary-section" style="margin-bottom: 32px;">
                  <h4 style="margin-bottom: 16px; font-size: 18px; font-weight: 700; color: var(--text);">Fragen der Analyse</h4>
                  <div class="prompts-list" style="display: flex; flex-direction: column; gap: 16px;">
                    ${prompts.map((prompt, idx) => `
                      <div class="prompt-card" style="padding: 16px; background: var(--bg-glass); border: 1px solid var(--border-light); border-radius: 8px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                          <span style="flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-weight: 700; font-size: 14px;">${idx + 1}</span>
                          <div style="flex: 1;">
                            <p style="margin: 0; font-weight: 500; color: var(--text); line-height: 1.5;">${prompt.question}</p>
                            ${prompt.categoryName ? `
                              <span style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-radius: 4px; font-size: 12px;">${prompt.categoryName}</span>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }
            
            let summaryHtml = '';
            if (summary) {
              const bestPrompts = summary.bestPrompts || [];
              const otherSources = summary.otherSources || {};
              
              let bestPromptsHtml = '';
              if (bestPrompts.length > 0) {
                bestPromptsHtml = `
                  <div style="margin-top: 16px;">
                    <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: var(--text-secondary);">Beste Prompts:</h5>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      ${bestPrompts.slice(0, 5).map(p => `
                        <li style="padding: 8px 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid var(--primary);">
                          <div style="font-size: 13px; color: var(--text);">${p.question}</div>
                          <div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">
                            Erwähnungen: ${p.mentions}, Zitierungen: ${p.citations}
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                `;
              }
              
              let otherSourcesHtml = '';
              const sourceEntries = Object.entries(otherSources);
              if (sourceEntries.length > 0) {
                otherSourcesHtml = `
                  <div style="margin-top: 16px;">
                    <h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: var(--text-secondary);">Andere Quellen:</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                      ${sourceEntries.slice(0, 10).map(([source, count]) => `
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; text-align: center;">
                          <div style="font-size: 20px; font-weight: 700; color: var(--text);">${count}</div>
                          <div style="font-size: 11px; color: var(--text-secondary); word-break: break-word; margin-top: 4px;">${source}</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              }
              
              summaryHtml = `
                <div class="summary-section" style="padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 32px;">
                  <h4 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: white;">📊 Fazit</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${summary.totalMentions || 0}</div>
                      <div style="font-size: 14px; opacity: 0.9;">Anzahl Erwähnungen</div>
                    </div>
                    <div style="padding: 16px; background: rgba(255,255,255,0.15); border-radius: 8px; backdrop-filter: blur(10px); text-align: center;">
                      <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${summary.totalCitations || 0}</div>
                      <div style="font-size: 14px; opacity: 0.9;">Anzahl Zitierungen</div>
                    </div>
                  </div>
                  ${bestPromptsHtml}
                  ${otherSourcesHtml}
                </div>
              `;
            } else {
              summaryHtml = `
                <div class="summary-section" style="padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; margin-bottom: 32px;">
                  <p style="margin: 0; color: var(--text-secondary); font-style: italic;">Kein Fazit verfügbar für diese Analyse.</p>
                </div>
              `;
            }
            
            return `
              <div class="local-view">
                <button class="back-btn">← Zurück</button>
                <h3 style="margin-bottom: 24px;">Analyse-Details</h3>
                ${promptsHtml}
                ${summaryHtml}
              </div>
            `;
          } catch (error) {
            console.error('Error loading analysis:', error);
            return `
              <div class="error-state">
                <p>Fehler beim Laden der Analyse: ${error.message}</p>
                <button class="back-btn" onclick="window.dashboardPage.selectedAnalysisId = null; window.dashboardPage.render();">← Zurück</button>
              </div>
            `;
          }
        } else if (this.selectedCompanyId) {
          // Show analyses for selected company
          const response = await fetch(window.getApiUrl('/api/companies/' + this.selectedCompanyId + '/analyses'));
          const analyses = await response.json();
          const companiesResponse = await fetch(window.getApiUrl('/api/companies'));
          const companies = await companiesResponse.json();
          const company = companies.find(c => c.id === this.selectedCompanyId);
          
          return `
            <div class="local-view">
              <button class="back-btn">← Zurück</button>
              <h3>Analysen: ${company?.name || company?.websiteUrl || 'Unbekannt'}</h3>
              <div class="analyses-grid">
                ${analyses.length === 0 
                  ? '<div class="empty-state">Keine Analysen gefunden</div>'
                  : analyses.map(analysis => `
                    <div class="analysis-card" data-run-id="${analysis.id}">
                      <div class="analysis-header">
                        <h4>${new URL(analysis.websiteUrl).hostname}</h4>
                        <span class="status-badge ${analysis.status}">${analysis.status}</span>
                      </div>
                      <div class="analysis-details">
                        <div class="detail-item">
                          <span class="label">Land:</span>
                          <span>${analysis.country}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">Sprache:</span>
                          <span>${analysis.language}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">Erstellt:</span>
                          <span>${new Date(analysis.createdAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>
          `;
        } else {
          // Show company list
          const response = await fetch(window.getApiUrl('/api/companies'));
          const companies = await response.json();
          
          return `
            <div class="local-view">
              <h3>Verfügbare Firmen</h3>
              <div class="companies-grid">
                ${companies.length === 0 
                  ? '<div class="empty-state">Keine Firmen gefunden</div>'
                  : companies.map(company => `
                    <div class="company-card" data-company-id="${company.id}">
                      <div class="company-header">
                        <h4>${company.name}</h4>
                      </div>
                      <div class="company-details">
                        <div class="detail-item">
                          <span class="label">Website:</span>
                          <span>${company.websiteUrl}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">Land:</span>
                          <span>${company.country}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label">Sprache:</span>
                          <span>${company.language}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>
          `;
        }
      }
      
      async renderGlobalView() {
        if (this.selectedCategory) {
          // Show prompts for selected category
          const response = await fetch(window.getApiUrl('/api/global/categories/' + encodeURIComponent(this.selectedCategory) + '/prompts'));
          const prompts = await response.json();
          
          return `
            <div class="global-view">
              <button class="back-btn">← Zurück</button>
              <h3>Kategorie: ${this.selectedCategory}</h3>
              <div class="prompts-list">
                ${prompts.length === 0 
                  ? '<div class="empty-state">Keine Fragen in dieser Kategorie gefunden</div>'
                  : prompts.map(prompt => `
                    <div class="prompt-card" style="padding: 20px; background: var(--bg-glass); border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 16px;">
                      <div class="prompt-question" style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text);">Frage:</h4>
                        <p style="margin: 0; color: var(--text); line-height: 1.6;">${prompt.question}</p>
                      </div>
                      ${prompt.answer && prompt.answer.trim() ? `
                        <div class="prompt-answer" style="margin-bottom: 16px;">
                          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text);">Antwort:</h4>
                          <div style="max-height: 500px; overflow-y: auto; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: var(--text);">${prompt.answer}</p>
                          </div>
                        </div>
                      ` : prompt.answer === null || prompt.answer === undefined ? `
                        <div class="prompt-answer" style="margin-bottom: 16px; opacity: 0.6;">
                          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text);">Antwort:</h4>
                          <p style="margin: 0; font-style: italic; color: var(--text-secondary);">Keine Antwort verfügbar</p>
                        </div>
                      ` : ''}
                      <div class="prompt-details" style="display: flex; flex-wrap: wrap; gap: 12px; padding-top: 12px; border-top: 1px solid var(--border-light);">
                        <div class="detail-item">
                          <span class="label" style="font-weight: 600; color: var(--text-secondary); margin-right: 8px;">Website:</span>
                          <span style="color: var(--text);">${new URL(prompt.websiteUrl).hostname}</span>
                        </div>
                        <div class="detail-item">
                          <span class="label" style="font-weight: 600; color: var(--text-secondary); margin-right: 8px;">Sprache:</span>
                          <span style="color: var(--text);">${prompt.language}</span>
                        </div>
                        ${prompt.country ? `
                          <div class="detail-item">
                            <span class="label" style="font-weight: 600; color: var(--text-secondary); margin-right: 8px;">Land:</span>
                            <span style="color: var(--text);">${prompt.country}</span>
                          </div>
                        ` : ''}
                        <div class="detail-item">
                          <span class="label" style="font-weight: 600; color: var(--text-secondary); margin-right: 8px;">Erstellt:</span>
                          <span style="color: var(--text);">${new Date(prompt.createdAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>
          `;
        } else {
          // Show category list
          const response = await fetch(window.getApiUrl('/api/global/categories'));
          const categories = await response.json();
          
          return `
            <div class="global-view">
              <h3>Alle Kategorien</h3>
              <div class="categories-grid">
                ${categories.length === 0 
                  ? '<div class="empty-state">Keine Kategorien gefunden</div>'
                  : categories.map(category => `
                    <div class="category-card" data-category-name="${category.name}">
                      <div class="category-header">
                        <h4>${category.name}</h4>
                        <span class="count-badge">${category.count}</span>
                      </div>
                      <div class="category-description">
                        <p>${category.description || 'Keine Beschreibung'}</p>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>
          `;
        }
      }
      
      async renderAnalysisSummary(analysisResult) {
        const competitive = analysisResult.competitiveAnalysis || {};
        const categoryMetrics = analysisResult.categoryMetrics || [];
        const analyses = analysisResult.analyses || [];
        
        // Calculate summary statistics
        const totalMentions = analyses.reduce((sum, a) => sum + (a.brandMentions?.exact || 0) + (a.brandMentions?.fuzzy || 0), 0);
        const totalCitations = analyses.reduce((sum, a) => sum + (a.citationCount || 0), 0);
        const avgVisibility = categoryMetrics.length > 0 
          ? categoryMetrics.reduce((sum, m) => sum + (m.visibilityScore || 0), 0) / categoryMetrics.length 
          : 0;
        
        // Get top competitors
        const competitors = Object.entries(competitive.competitorShares || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        return `
          <div class="local-view">
            <button class="back-btn">← Zurück</button>
            <h3>Analyse-Ergebnisse</h3>
            
            <div class="analysis-summary">
              <!-- Key Metrics -->
              <div class="summary-section">
                <h4>Zusammenfassung</h4>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${Math.round(avgVisibility)}%</div>
                    <div class="metric-label">Sichtbarkeits-Score</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${totalMentions}</div>
                    <div class="metric-label">Marken-Erwähnungen</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${totalCitations}</div>
                    <div class="metric-label">Zitate</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${Math.round(competitive.brandShare || 0)}%</div>
                    <div class="metric-label">Marktanteil</div>
                  </div>
                </div>
              </div>
              
              <!-- Category Performance -->
              ${categoryMetrics.length > 0 ? `
                <div class="summary-section">
                  <h4>Kategorie-Performance</h4>
                  <div class="category-metrics">
                    ${categoryMetrics.map(metric => {
                      const category = analysisResult.categories?.find(c => c.id === metric.categoryId);
                      return `
                        <div class="category-metric-item">
                          <div class="category-name">${category?.name || 'Unbekannt'}</div>
                          <div class="category-score">
                            <div class="score-bar">
                              <div class="score-fill" style="width: ${metric.visibilityScore}%"></div>
                            </div>
                            <span class="score-value">${Math.round(metric.visibilityScore)}%</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              
              <!-- Competitive Analysis -->
              ${competitors.length > 0 ? `
                <div class="summary-section">
                  <h4>Wettbewerber</h4>
                  <div class="competitors-list">
                    ${competitors.map(([name, share]) => `
                      <div class="competitor-item">
                        <span class="competitor-name">${name}</span>
                        <span class="competitor-share">${Math.round(share)}%</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              <!-- White Space Topics -->
              ${competitive.whiteSpaceTopics && competitive.whiteSpaceTopics.length > 0 ? `
                <div class="summary-section">
                  <h4>White Space Themen</h4>
                  <div class="topics-list">
                    ${competitive.whiteSpaceTopics.map(topic => `
                      <div class="topic-item">${topic}</div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              <!-- Missing Brand Prompts -->
              ${competitive.missingBrandPrompts && competitive.missingBrandPrompts.length > 0 ? `
                <div class="summary-section">
                  <h4>Fehlende Marken-Erwähnungen</h4>
                  <div class="prompts-list">
                    ${competitive.missingBrandPrompts.slice(0, 5).map(prompt => `
                      <div class="prompt-item">${prompt}</div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
      
      show() {
        const configurationCard = document.querySelector('.content-area > .card');
        const analysesSection = document.getElementById('analysesSection');
        const analysisDetailSection = document.getElementById('analysisDetailSection');
        
        if (configurationCard) configurationCard.style.display = 'none';
        if (analysesSection) analysesSection.style.display = 'none';
        if (analysisDetailSection) analysisDetailSection.style.display = 'none';
        
        if (this.dashboardSection) {
          this.dashboardSection.style.display = 'block';
        }
        
        this.render();
      }
    }
    
    // Make DashboardPage available globally
    window.DashboardPage = DashboardPage;
    
    // AI Analysis functionality
    function showAIAnalysis(event) {
      console.log('🔵 showAIAnalysis called');
      if (event) event.preventDefault();
      
      // Hide all sections explicitly
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      
      if (dashboardSection) {
        dashboardSection.style.display = 'none';
        console.log('✅ Hidden dashboardSection');
      }
      if (aiReadabilitySection) aiReadabilitySection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Show AI Analysis section
      if (aiAnalysisSection) {
        aiAnalysisSection.style.display = 'flex'; // Use flex to match CSS
        aiAnalysisSection.style.visibility = 'visible';
        console.log('✅ Showing aiAnalysisSection');
        
        // Make sure the configuration card is visible (it's inside aiAnalysisSection)
        const configurationCard = document.getElementById('configurationCard');
        if (configurationCard) {
          configurationCard.style.display = 'block';
          configurationCard.classList.remove('hidden');
          console.log('✅ Showing configurationCard');
        } else {
          console.warn('⚠️ configurationCard not found');
        }
      } else {
        console.error('❌ aiAnalysisSection not found!');
      }
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) {
        headerTitle.textContent = 'AI Analyse';
        console.log('✅ Updated header title');
      }
      
      // Update navigation
      updateNavActive(event);
      console.log('✅ showAIAnalysis completed');
    }
    
    // AI Readability functionality
    function showAIReadability(event) {
      console.log('🔵 showAIReadability called');
      if (event) event.preventDefault();
      
      // Hide all sections explicitly
      const dashboardSection = document.getElementById('dashboardSection');
      const aiAnalysisSection = document.getElementById('aiAnalysisSection');
      const aiReadabilitySection = document.getElementById('aiReadabilitySection');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      
      if (dashboardSection) dashboardSection.style.display = 'none';
      if (aiAnalysisSection) aiAnalysisSection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      
      // Show AI Readability section
      if (aiReadabilitySection) {
        aiReadabilitySection.style.display = 'flex'; // Use flex to match CSS
        aiReadabilitySection.style.visibility = 'visible';
        console.log('✅ Showing aiReadabilitySection');
      } else {
        console.error('❌ aiReadabilitySection not found!');
      }
      
      // Update header
      const headerTitle = document.getElementById('headerTitle');
      if (headerTitle) {
        headerTitle.textContent = 'AI Readability';
        console.log('✅ Updated header title');
      }
      
      // Update navigation
      updateNavActive(event);
      console.log('✅ showAIReadability completed');
    }
    
    // Analyses functionality
    function showAnalyses(event) {
      hideAllSections();
      const analysesSection = document.getElementById('analysesSection');
      if (analysesSection) {
        analysesSection.style.display = 'block';
        loadAnalyses();
      }
      updateNavActive(event);
    }
    
    // AI Readiness functionality removed
    
    function loadAnalyses() {
      const analysesList = document.getElementById('analysesList');
      if (!analysesList) return;
      
      // Ensure grid class is applied
      if (!analysesList.classList.contains('dashboard-grid-2')) {
        analysesList.classList.add('dashboard-grid-2');
      }
      
      analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">Lade Analysen...</div>';
      
      fetch('/api/analyses')
        .then(res => res.json())
        .then(analyses => {
          if (analyses.length === 0) {
            analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">Keine Analysen vorhanden. Starte eine neue Analyse.</div>';
            return;
          }
          
          analysesList.innerHTML = analyses.map(function(analysis) {
            const createdAt = new Date(analysis.createdAt);
            const statusBadge = analysis.status === 'completed' 
              ? '<span style="padding: 4px 12px; background: #059669; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">Abgeschlossen</span>'
              : analysis.status === 'running'
              ? '<span style="padding: 4px 12px; background: #d97706; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">Läuft</span>'
              : '<span style="padding: 4px 12px; background: #cbd5e1; color: white; border-radius: 12px; font-size: 12px; font-weight: 600;">' + analysis.status + '</span>';
            
            const runId = analysis.id || '';
            return '<div class="analysis-card" style="padding: 20px; background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); transition: var(--transition); width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px;">' +
              '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                '<div style="flex: 1;">' +
                  '<h4 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: var(--gray-900);">' + (analysis.websiteUrl || 'Unbekannte URL') + '</h4>' +
                  '<p style="margin: 0; font-size: 13px; color: var(--gray-500);">' + createdAt.toLocaleString('de-DE') + '</p>' +
                '</div>' +
                statusBadge +
              '</div>' +
              '<div class="analysis-metadata-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; margin-top: 16px;">' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Land</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.country || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Sprache</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.language || '') + '</div>' +
                '</div>' +
                '<div>' +
                  '<div style="font-size: 11px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Region</div>' +
                  '<div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">' + (analysis.region || '-') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="margin-top: 16px; display: flex; gap: 8px;">' +
                '<button class="btn btn-primary" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" style="flex: 1; padding: 8px 16px; font-size: 13px;">' +
                  '📊 Details anzeigen' +
                '</button>' +
                (analysis.status === 'running' 
                  ? '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="pauseAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--warning); color: white;">⏸ Pausieren</button>'
                  : '') +
                '<button class="btn" data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="deleteAnalysis(this.dataset.runId)" style="padding: 8px 16px; font-size: 13px; background: var(--error); color: white;">🗑 Löschen</button>' +
              '</div>' +
            '</div>';
          }).join('');
        })
        .catch(err => {
          console.error('Error loading analyses:', err);
          analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--error); grid-column: 1 / -1;">Fehler beim Laden der Analysen.</div>';
        });
    }
    
    function viewAnalysisDetails(runId) {
      console.log('🔍 Loading analysis details for runId:', runId);
      hideAllSections();
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const analysisDetailContent = document.getElementById('analysisDetailContent');
      const analysisDetailTitle = document.getElementById('analysisDetailTitle');
      
      if (!analysisDetailSection || !analysisDetailContent) {
        console.error('❌ Analysis detail elements not found!');
        return;
      }
      
      analysisDetailSection.style.display = 'block';
      analysisDetailContent.innerHTML = 
        '<div style="text-align: center; padding: 40px; color: var(--gray-500);">' +
        '<div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>' +
        '<p style="margin-top: 16px; font-size: 14px;">Lade Analyse-Insights...</p>' +
        '<p style="margin-top: 8px; font-size: 12px; color: var(--gray-400);">Dies kann einige Sekunden dauern</p>' +
        '</div>';
      
      // Add spinner animation if not already present
      if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }
      
      // Fetch insights instead of full analysis
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetch('/api/analysis/' + runId + '/insights', {
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error('HTTP ' + res.status + ': ' + text.substring(0, 200));
            });
          }
          return res.json();
        })
        .then(insights => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log('✅ Insights loaded in', loadTime, 'seconds');
          
          if (insights.error) {
            console.error('❌ API returned error:', insights.error);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px;">Fehler: ' + insights.error + '</div>';
            return;
          }
          
          // Validate that insights has required structure
          if (!insights || !insights.summary) {
            console.error('❌ Invalid insights data structure:', insights);
            analysisDetailContent.innerHTML = '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
              '<strong>❌ Fehler beim Laden der Insights</strong><br>' +
              '<p style="margin-top: 8px; color: #c62828;">Ungültige Datenstruktur erhalten. Bitte versuche es erneut.</p>' +
              '<p style="margin-top: 12px; font-size: 12px; color: #666;">Empfangen: ' + JSON.stringify(insights).substring(0, 200) + '</p>' +
              '</div>';
            return;
          }
          
          // Ensure all required fields exist with defaults
          if (!insights.summary) {
            insights.summary = { totalBrandMentions: 0, totalBrandCitations: 0, promptsWithMentions: 0, totalPrompts: 0 };
          }
          if (!insights.promptsWithMentions) {
            insights.promptsWithMentions = [];
          }
          if (!insights.allCompetitors) {
            insights.allCompetitors = [];
          }
          if (!insights.detailedData) {
            insights.detailedData = [];
          }
          
          console.log('📊 Insights data:', {
            totalBrandMentions: insights.summary.totalBrandMentions,
            totalBrandCitations: insights.summary.totalBrandCitations,
            promptsWithMentions: insights.summary.promptsWithMentions,
            totalPrompts: insights.summary.totalPrompts
          });
          
          // Build insights dashboard - Professional design
          let html = '<div style="margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">';
          html += '<h2 style="margin: 0 0 8px 0; color: #111827; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Analyse-Ergebnisse</h2>';
          html += '<div style="display: flex; gap: 24px; margin-top: 12px; font-size: 14px; color: #6b7280;">';
          html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span> ' + (insights.websiteUrl || '') + '</span>';
          if (insights.brandName) {
            html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span> ' + insights.brandName + '</span>';
          }
          html += '</div>';
          html += '</div>';
          
          // Summary Metrics Cards - Clean, professional design
          html += '<div class="dashboard-metrics-grid dashboard-grid-3" style="margin-bottom: 48px;">';
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Markenerwähnungen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Gesamtanzahl</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Zitationen</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.totalBrandCitations || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">Von dieser Marke</div>';
          html += '</div>';
          
          html += '<div style="padding: 28px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">';
          html += '<div style="font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Erfolgreiche Prompts</div>';
          html += '<div style="font-size: 42px; font-weight: 700; color: #111827; margin-bottom: 4px; line-height: 1;">' + (insights.summary?.promptsWithMentions || 0) + '</div>';
          html += '<div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">von ' + (insights.summary?.totalPrompts || 0) + ' analysiert</div>';
          html += '</div>';
          html += '</div>';
          
          // Prompts where brand is mentioned - Professional design
          if (insights.promptsWithMentions && insights.promptsWithMentions.length > 0) {
            html += '<div style="margin-bottom: 48px;">';
            html += '<h3 style="margin: 0 0 24px 0; color: #111827; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Prompts mit Markenerwähnungen</h3>';
            html += '<div class="prompts-grid dashboard-grid" style="gap: 16px;">';
            insights.promptsWithMentions.forEach(function(prompt) {
              html += '<div style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
              html += '<div style="font-weight: 500; color: #111827; margin-bottom: 12px; font-size: 15px; line-height: 1.5;">' + (prompt?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
              html += '<div style="display: flex; gap: 24px; font-size: 13px; color: #6b7280; padding-top: 12px; border-top: 1px solid #f3f4f6;">';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #3b82f6; font-weight: 600;">' + (prompt?.mentionCount || 0) + '</span> Erwähnungen</span>';
              html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="color: #10b981; font-weight: 600;">' + (prompt?.citationCount || 0) + '</span> Zitationen</span>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div></div>';
          }
          
          // Competitors section removed as requested
          
          // Detailed data (collapsible) - Professional design
          html += '<div style="margin-bottom: 32px;">';
          html += '<details style="cursor: pointer;">';
          html += '<summary style="padding: 18px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 500; color: #111827; font-size: 15px; user-select: none; transition: background 0.2s;">Detaillierte Analyse-Ergebnisse</summary>';
          html += '<div class="detailed-data-grid dashboard-grid" style="margin-top: 20px;">';
          (insights.detailedData || []).forEach(function(data) {
            html += '<div style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">';
            html += '<div style="font-weight: 500; color: #111827; margin-bottom: 16px; font-size: 16px; line-height: 1.5;">' + (data?.question || 'Unbekannte Frage').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            if (data?.answer) {
              const answerText = String(data.answer || '');
              html += '<div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: #374151; line-height: 1.7;">';
              html += answerText.substring(0, 400).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (answerText.length > 400 ? '...' : '');
              html += '</div>';
            }
            html += '<div class="detailed-metadata-grid dashboard-grid-3" style="padding-top: 16px; border-top: 1px solid #f3f4f6; gap: 16px;">';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Erwähnungen</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.brandMentions?.total || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (Marke)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.brandCitations || 0) + '</span></div>';
            html += '<div style="font-size: 13px;"><span style="color: #6b7280; display: block; margin-bottom: 4px;">Zitate (gesamt)</span><span style="color: #111827; font-weight: 600; font-size: 18px;">' + (data?.citations?.total || 0) + '</span></div>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div></details></div>';
          
          analysisDetailContent.innerHTML = html;
          console.log('✅ Analysis details rendered successfully');
          
        })
        .catch(err => {
          clearTimeout(timeoutId);
          const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error('❌ Error loading analysis insights after', loadTime, 'seconds:', err);
          
          let errorMessage = 'Unbekannter Fehler';
          if (err.name === 'AbortError') {
            errorMessage = 'Zeitüberschreitung: Die Anfrage hat zu lange gedauert (>30 Sekunden). Bitte versuche es erneut.';
          } else if (err && err.message) {
            errorMessage = err.message;
          }
          analysisDetailContent.innerHTML = 
            '<div style="color: #dc2626; padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">' +
            '<strong>❌ Fehler beim Laden der Analyse-Insights</strong><br>' +
            '<p style="margin-top: 8px; color: #c62828;">' + errorMessage + '</p>' +
            '<p style="margin-top: 12px; font-size: 12px; color: #666;">Bitte überprüfe die Browser-Konsole für weitere Details oder versuche es später erneut.</p>' +
            '<button data-run-id="' + String(runId).replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" onclick="viewAnalysisDetails(this.dataset.runId)" class="btn" style="margin-top: 12px; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Erneut versuchen</button>' +
            '</div>';
        });
    }
    
    function deleteAnalysis(runId) {
      if (!confirm('Möchtest du diese Analyse wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        return;
      }
      
      fetch('/api/analysis/' + runId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich gelöscht!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim Löschen: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error deleting analysis:', err);
          alert('Fehler beim Löschen der Analyse.');
        });
    }
    
    function pauseAnalysis(runId) {
      if (!confirm('Möchtest du diese Analyse pausieren?')) {
            return;
          }
          
      fetch('/api/analysis/' + runId + '/pause', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
          })
            .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('Analyse erfolgreich pausiert!');
            loadAnalyses(); // Reload the list
          } else {
            alert('Fehler beim Pausieren: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch(err => {
          console.error('Error pausing analysis:', err);
          alert('Fehler beim Pausieren der Analyse.');
        });
    }
    
    // AI Readability functionality
    const fetchContentBtn = document.getElementById('fetchContentBtn');
    if (fetchContentBtn) {
      fetchContentBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const urlInput = document.getElementById('readabilityUrl');
        const contentDisplay = document.getElementById('readabilityContentDisplay');
        const contentSection = document.getElementById('readabilityContent');
        
        if (!urlInput || !urlInput.value.trim()) {
          alert('Bitte geben Sie eine URL ein.');
          return;
        }
        
        let url = urlInput.value.trim();
        // Add https:// if missing
        if (!url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
        }
        
        // Validate URL
        try {
          new URL(url);
        } catch (e) {
          alert('Ungültige URL. Bitte geben Sie eine gültige URL ein.');
          return;
        }
        
        // Update button state
        fetchContentBtn.disabled = true;
        fetchContentBtn.textContent = 'Lädt...';
        
        try {
          // Use backend API to fetch content (avoids CORS issues)
          const response = await (window.apiFetch 
            ? window.apiFetch('/api/workflow/fetchUrl', {
                method: 'POST',
                body: JSON.stringify({ url })
              })
            : fetch(window.getApiUrl ? window.getApiUrl('/api/workflow/fetchUrl') : '/api/workflow/fetchUrl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              }));
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // The API returns text content
          const textContent = data.text || data.content || 'Kein Textinhalt gefunden.';
          
          if (contentDisplay) {
            // Display the content with proper formatting
            contentDisplay.textContent = textContent;
          }
          
          if (contentSection) {
            contentSection.style.display = 'block';
          }
          
        } catch (error) {
          console.error('Error fetching content:', error);
          alert('Fehler beim Laden der Seite: ' + (error.message || 'Unbekannter Fehler'));
          
          // Try to show error in content display
          if (contentDisplay) {
            contentDisplay.textContent = 'Fehler beim Laden: ' + (error.message || 'Unbekannter Fehler');
          }
          if (contentSection) {
            contentSection.style.display = 'block';
          }
        } finally {
          fetchContentBtn.disabled = false;
          fetchContentBtn.textContent = 'Inhalt holen';
        }
      });
    }
    
    // Store full implementations for use by global stubs
    window.showDashboardFull = showDashboard;
    window.showAnalysesFull = showAnalyses;
    window.loadAnalyses = loadAnalyses;
    window.viewAnalysisDetailsFull = viewAnalysisDetails;
    window.deleteAnalysisFull = deleteAnalysis;
    window.pauseAnalysisFull = pauseAnalysis;
    
    // Update global functions to use full implementations
    window.showDashboard = showDashboard;
    window.showAIAnalysis = showAIAnalysis;
    window.showAIReadability = showAIReadability;
    window.showAnalyses = showAnalyses;
    window.viewAnalysisDetails = viewAnalysisDetails;
    window.deleteAnalysis = deleteAnalysis;
    window.pauseAnalysis = pauseAnalysis;
    
    // Initialize dashboard on page load
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection && dashboardSection.style.display !== 'none') {
      // Only initialize if dashboard is visible (default view)
      if (!window.dashboardPage) {
        window.dashboardPage = new DashboardPage();
      }
      window.dashboardPage.show();
    }
    }); // End of DOMContentLoaded
  