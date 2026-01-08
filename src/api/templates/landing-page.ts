/**
 * Landing Page HTML Template
 */

export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GEO Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      /* Modern Vibrant Color Palette */
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-light: #818cf8;
      --accent: #06b6d4;
      --accent-hover: #0891b2;
      --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      --gradient-accent: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
      
      /* Text Colors */
      --text: #0f172a;
      --text-secondary: #475569;
      --text-light: #94a3b8;
      --text-muted: #cbd5e1;
      
      /* Background Colors */
      --bg: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-tertiary: #f1f5f9;
      --bg-hover: rgba(99, 102, 241, 0.08);
      --bg-glass: rgba(255, 255, 255, 0.7);
      --bg-glass-dark: rgba(15, 23, 42, 0.7);
      
      /* Border & Shadow */
      --border: rgba(226, 232, 240, 0.8);
      --border-light: rgba(226, 232, 240, 0.5);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
      
      /* Status Colors */
      --success: #10b981;
      --success-light: rgba(16, 185, 129, 0.1);
      --warning: #f59e0b;
      --warning-light: rgba(245, 158, 11, 0.1);
      --error: #ef4444;
      --error-light: rgba(239, 68, 68, 0.1);
      --info: #3b82f6;
      --info-light: rgba(59, 130, 246, 0.1);
      
      /* Layout */
      --sidebar-width: 220px;
      --sidebar-collapsed-width: 60px;
      --radius-sm: 8px;
      --radius: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      
      /* Transitions */
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f0f9ff 100%);
      background-attachment: fixed;
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
    .app-container {
      display: flex;
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid var(--border-light);
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      transition: width var(--transition), transform var(--transition);
    }
    .sidebar.collapsed {
      width: var(--sidebar-collapsed-width);
    }
    .sidebar.collapsed .sidebar-header h1,
    .sidebar.collapsed .sidebar-header p,
    .sidebar.collapsed .nav-item span {
      opacity: 0;
      visibility: hidden;
      white-space: nowrap;
    }
    .sidebar.collapsed .sidebar-header {
      padding: 24px 12px;
      text-align: center;
    }
    .sidebar.collapsed .nav-item {
      padding: 14px 12px;
      justify-content: center;
      margin: 4px 8px;
    }
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid var(--border-light);
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: padding var(--transition);
    }
    .sidebar-header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 800;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
      margin-bottom: 6px;
      position: relative;
      transition: opacity var(--transition), visibility var(--transition);
    }
    .sidebar-header h1::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 40px;
      height: 3px;
      background: var(--gradient-primary);
      border-radius: 2px;
    }
    .sidebar-header p {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-top: 8px;
    }
    .sidebar-nav {
      padding: 16px 0;
    }
    .nav-item {
      padding: 14px 20px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      margin: 4px 10px;
      border-radius: var(--radius);
      position: relative;
    }
    .nav-item span {
      transition: opacity var(--transition), visibility var(--transition);
    }
    .nav-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 0;
      background: var(--gradient-primary);
      border-radius: 0 4px 4px 0;
      transition: var(--transition);
    }
    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--primary);
      transform: translateX(4px);
    }
    .nav-item.active {
      background: var(--bg-hover);
      color: var(--primary);
      font-weight: 600;
      box-shadow: var(--shadow-sm);
    }
    .nav-item.active::before {
      height: 60%;
    }
    .nav-item-icon {
      width: 18px;
      font-size: 16px;
    }
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-height: 100vh;
      position: relative;
      transition: margin-left var(--transition);
      width: calc(100% - var(--sidebar-width));
      box-sizing: border-box;
    }
    body.sidebar-collapsed .main-content {
      margin-left: var(--sidebar-collapsed-width);
      width: calc(100% - var(--sidebar-collapsed-width));
    }
    .top-header {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-light);
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    .sidebar-toggle {
      background: var(--bg-glass);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 10px 14px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: var(--text-secondary);
      box-shadow: var(--shadow-sm);
      margin-right: 16px;
    }
    .sidebar-toggle:hover {
      background: var(--bg-hover);
      color: var(--primary);
      transform: scale(1.05);
    }
    .top-header h2 {
      font-size: 24px;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .content-area {
      padding: 40px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    
    /* Unified Section Container - All sections use this base */
    .dashboard-section {
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      min-height: 0;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    /* Apply unified styling to all main sections */
    #analysesSection,
    #analysisDetailSection,
    #aiReadinessSection,
    .dashboard-section {
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      min-height: 0;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    /* Unified Card Styling - All cards in sections */
    .dashboard-section > .card,
    #analysesSection > .card,
    #analysisDetailSection > .card,
    #aiReadinessSection > .card,
    .content-area > .card {
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      flex-shrink: 0;
    }
    
    /* Unified spacing for all section children */
    #aiReadinessSection > *,
    #analysesSection > *,
    #analysisDetailSection > * {
      width: 100%;
      box-sizing: border-box;
    }
    
    /* Consistent margin for AI Readiness cards */
    #aiReadinessSection .ai-readiness-hero,
    #aiReadinessSection .ai-readiness-form-card,
    #aiReadinessSection .ai-readiness-progress-card,
    #aiReadinessSection .ai-readiness-steps-card,
    #aiReadinessSection .ai-readiness-console-card,
    #aiReadinessSection .ai-readiness-results-card {
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 24px;
    }
    
    /* Unified Grid System for all sections */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .dashboard-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      width: 100%;
      box-sizing: border-box;
    }
    
    .dashboard-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      width: 100%;
      box-sizing: border-box;
    }
    .card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-light);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
    }
    .card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .card-header {
      padding: 24px 32px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
    }
    .card-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.3px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .card-body {
      padding: 32px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      font-size: 11px;
    }
    .form-group input,
    .form-group select {
      padding: 14px 18px;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      font-size: 15px;
      transition: var(--transition);
      background: var(--bg);
      color: var(--text);
      font-family: inherit;
      box-shadow: var(--shadow-sm);
    }
    .form-group input:hover,
    .form-group select:hover {
      border-color: var(--primary-light);
      box-shadow: var(--shadow);
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-md);
      transform: translateY(-1px);
    }
    .btn {
      padding: 14px 28px;
      border: none;
      border-radius: var(--radius);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-family: inherit;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    .btn:hover::before {
      width: 300px;
      height: 300px;
    }
    .btn-primary {
      background: var(--gradient-primary);
      color: white;
      box-shadow: var(--shadow-md), var(--shadow-glow);
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }
    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 16px 32px;
      font-size: 16px;
    }
    /* Progress */
    .progress-container {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 32px;
      margin: 32px 0;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
    }
    .progress-bar {
      width: 100%;
      height: 12px;
      background: var(--bg-tertiary);
      border-radius: var(--radius);
      overflow: hidden;
      margin: 20px 0;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .progress-fill {
      height: 100%;
      background: var(--gradient-primary);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: var(--radius);
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .progress-text {
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-top: 16px;
      font-family: 'Space Grotesk', sans-serif;
    }
    /* Status Messages */
    .status-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 1px solid var(--border-light);
      margin: 24px 0;
      box-shadow: var(--shadow-md);
    }
    .status-title {
      font-weight: 700;
      color: var(--text);
      margin-bottom: 10px;
      font-size: 16px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .status-details {
      color: var(--text-secondary);
      font-size: 15px;
      line-height: 1.6;
    }
    /* Results */
    .results-container {
      margin-top: 40px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .data-table th {
      text-align: left;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 2px solid var(--border-light);
    }
    .data-table td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-light);
      font-size: 14px;
      color: var(--text-secondary);
    }
    .data-table tr:hover {
      background: var(--bg-hover);
    }
    /* Badges */
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: var(--radius);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      box-shadow: var(--shadow-sm);
    }
    .badge-success { background: var(--success-light); color: var(--success); }
    .badge-warning { background: var(--warning-light); color: var(--warning); }
    .badge-danger { background: var(--error-light); color: var(--error); }
    .badge-primary { background: var(--info-light); color: var(--primary); }
    
    /* Analysis Cards Styling */
    .analysis-card {
      padding: 20px;
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      transition: var(--transition);
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .analysis-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
      border-color: var(--primary-light);
    }
    .analysis-metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
      width: 100%;
    }
    /* Loading */
    .loading {
      display: none;
    }
    .loading.show {
      display: block;
    }
    /* Analysis Progress - Modern Design */
    .analysis-progress {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-light);
      padding: 40px;
      margin-bottom: 32px;
      transition: var(--transition);
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
    }
    .analysis-progress::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-primary);
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .current-step-indicator {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      flex: 1;
    }
    .step-number {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-lg);
      background: var(--gradient-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      flex-shrink: 0;
      box-shadow: var(--shadow-lg), var(--shadow-glow);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .step-content {
      flex: 1;
      padding-top: 8px;
    }
    .step-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
      letter-spacing: -0.4px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .step-description {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .progress-percentage {
      font-size: 48px;
      font-weight: 800;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -2px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .progress-bar-container {
      margin-top: 16px;
    }
    .progress-bar-track {
      width: 100%;
      height: 12px;
      background: var(--bg-tertiary);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      width: 0%;
      position: relative;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }
    .progress-bar-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: progressShimmer 2s infinite;
    }
    @keyframes progressShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    /* Configuration Card Transition */
    #configurationCard {
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #configurationCard.hidden {
      opacity: 0;
      transform: translateY(-10px);
      pointer-events: none;
      max-height: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
      border: none;
    }
    /* Header Status Update */
    .header-step-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .header-step-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .header-step-subtitle {
      font-size: 13px;
      color: var(--text-light);
    }
    /* AI Readiness Modern Design */
    .ai-readiness-hero {
      background: var(--gradient-primary);
      border-radius: var(--radius-lg);
      padding: 32px 32px;
      margin-bottom: 24px;
      color: white;
      text-align: center;
      box-shadow: var(--shadow-lg), var(--shadow-glow);
      position: relative;
      overflow: hidden;
    }
    .ai-readiness-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .ai-readiness-hero h2 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 12px;
      color: white;
      letter-spacing: -0.5px;
      font-family: 'Space Grotesk', sans-serif;
      position: relative;
      z-index: 1;
    }
    .ai-readiness-hero p {
      font-size: 14px;
      opacity: 0.95;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    .ai-readiness-form-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
      margin-bottom: 24px;
      transition: var(--transition);
    }
    .ai-readiness-form-card:hover {
      box-shadow: var(--shadow-xl);
      transform: translateY(-2px);
    }
    .ai-readiness-input-wrapper {
      position: relative;
      margin-bottom: 28px;
    }
    .ai-readiness-input-wrapper label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    .ai-readiness-input-wrapper input {
      width: 100%;
      padding: 18px 24px;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      font-size: 16px;
      transition: var(--transition);
      background: var(--bg);
      box-shadow: var(--shadow-sm);
    }
    .ai-readiness-input-wrapper input:hover {
      border-color: var(--primary-light);
      box-shadow: var(--shadow);
    }
    .ai-readiness-input-wrapper input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-md);
      transform: translateY(-1px);
    }
    .ai-readiness-btn {
      width: 100%;
      padding: 18px 40px;
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
      position: relative;
      overflow: hidden;
    }
    .ai-readiness-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    .ai-readiness-btn:hover::before {
      width: 400px;
      height: 400px;
    }
    .ai-readiness-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: var(--shadow-xl), var(--shadow-glow);
    }
    .ai-readiness-btn:active:not(:disabled) {
      transform: translateY(-1px);
    }
    .ai-readiness-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .ai-readiness-progress-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .ai-readiness-progress-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-primary);
    }
    .ai-readiness-status-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .ai-readiness-status-icon {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-lg);
      background: var(--gradient-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: white;
      box-shadow: var(--shadow-lg), var(--shadow-glow);
      animation: pulse 2s ease-in-out infinite;
    }
    .ai-readiness-status-text {
      flex: 1;
    }
    .ai-readiness-status-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -0.3px;
    }
    .ai-readiness-status-subtitle {
      font-size: 15px;
      color: var(--text-secondary);
    }
    .ai-readiness-progress-bar-wrapper {
      background: var(--bg-tertiary);
      border-radius: var(--radius);
      height: 14px;
      overflow: hidden;
      margin-bottom: 20px;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .ai-readiness-progress-bar {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }
    .ai-readiness-progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: aiReadinessShimmer 2s infinite;
    }
    @keyframes aiReadinessShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .ai-readiness-progress-percentage {
      text-align: center;
      font-size: 36px;
      font-weight: 800;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -1px;
    }
    .ai-readiness-steps-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
      margin-bottom: 24px;
    }
    .ai-readiness-steps-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border-light);
    }
    .ai-readiness-steps-header h4 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -0.3px;
    }
    .ai-readiness-step-item {
      background: var(--bg-tertiary);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 16px;
      border: 2px solid transparent;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
    }
    .ai-readiness-step-item:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow);
    }
    .ai-readiness-step-item.active {
      border-color: var(--primary);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
      box-shadow: var(--shadow-md), 0 0 0 1px rgba(99, 102, 241, 0.2);
    }
    .ai-readiness-step-item.completed {
      border-color: var(--success);
      background: var(--success-light);
    }
    .ai-readiness-step-item.error {
      border-color: var(--error);
      background: var(--error-light);
    }
    .ai-readiness-step-header {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
    }
    .ai-readiness-step-number {
      width: 48px;
      height: 48px;
      border-radius: var(--radius);
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      color: var(--text-light);
      flex-shrink: 0;
      border: 2px solid var(--border);
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
    }
    .ai-readiness-step-item.active .ai-readiness-step-number {
      background: var(--gradient-primary);
      color: white;
      border-color: transparent;
      box-shadow: var(--shadow-md), var(--shadow-glow);
      transform: scale(1.1);
    }
    .ai-readiness-step-item.completed .ai-readiness-step-number {
      background: var(--gradient-success);
      color: white;
      border-color: transparent;
      box-shadow: var(--shadow-md);
    }
    .ai-readiness-step-item.error .ai-readiness-step-number {
      background: var(--error);
      color: white;
      border-color: transparent;
      box-shadow: var(--shadow-md);
    }
    .ai-readiness-step-content {
      flex: 1;
    }
    .ai-readiness-step-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 4px;
    }
    .ai-readiness-step-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-light);
      flex-wrap: wrap;
    }
    .ai-readiness-step-status {
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 11px;
    }
    .ai-readiness-step-status.pending {
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }
    .ai-readiness-step-status.active {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }
    .ai-readiness-step-status.completed {
      background: rgba(5, 150, 105, 0.1);
      color: var(--success);
    }
    .ai-readiness-step-status.error {
      background: rgba(220, 38, 38, 0.1);
      color: var(--error);
    }
    .ai-readiness-console-card {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-xl);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 32px;
    }
    .ai-readiness-console-header {
      background: rgba(45, 45, 45, 0.8);
      backdrop-filter: blur(10px);
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .ai-readiness-console-header h4 {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .ai-readiness-console-content {
      padding: 24px;
      font-family: 'Courier New', 'Monaco', 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.8;
      color: #d4d4d4;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .ai-readiness-results-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
    }
    .ai-readiness-results-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border-light);
    }
    .ai-readiness-results-header h3 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -0.4px;
    }
    .ai-readiness-results-content {
      font-size: 16px;
      line-height: 1.8;
      color: var(--text);
      white-space: pre-wrap;
    }
    /* Responsive Design - Unified Breakpoints */
    @media (max-width: 1200px) {
      .content-area {
        padding: 32px;
        max-width: 100%;
      }
      .dashboard-grid-2 {
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
      }
      .dashboard-grid-3 {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
    }
    
    @media (max-width: 968px) {
      .content-area {
        padding: 28px;
      }
      .card-header {
        padding: 20px 24px;
      }
      .card-body {
        padding: 24px;
      }
      .dashboard-grid,
      .dashboard-grid-2,
      .dashboard-grid-3 {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }
      .form-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
    }
    
    @media (max-width: 768px) {
      :root {
        --sidebar-width: 0px;
      }
      .sidebar {
        transform: translateX(-100%);
        transition: var(--transition);
      }
      .sidebar-toggle {
        display: none;
      }
      .main-content {
        margin-left: 0;
        width: 100%;
      }
      .content-area {
        padding: 20px;
        max-width: 100%;
      }
      
      /* Unified section styling on mobile */
      .dashboard-section,
      #analysesSection,
      #analysisDetailSection,
      #aiReadinessSection {
        width: 100%;
        margin: 0;
        padding: 0;
        gap: 16px;
      }
      
      /* Unified card styling on mobile */
      .dashboard-section > .card,
      #analysesSection > .card,
      #analysisDetailSection > .card,
      #aiReadinessSection > .card,
      .content-area > .card {
        width: 100%;
        margin: 0;
      }
      
      .card-header {
        padding: 16px 20px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .card-header h3 {
        font-size: 16px;
      }
      .card-body {
        padding: 20px;
      }
      
      .top-header {
        padding: 16px 20px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .top-header h2 {
        font-size: 18px;
      }
      
      /* Unified grid system on mobile */
      .dashboard-grid,
      .dashboard-grid-2,
      .dashboard-grid-3,
      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      /* AI Readiness mobile adjustments */
      .ai-readiness-hero {
        padding: 20px 16px;
        margin-bottom: 16px;
      }
      .ai-readiness-hero h2 {
        font-size: 20px;
      }
      .ai-readiness-hero p {
        font-size: 13px;
      }
      .ai-readiness-form-card,
      .ai-readiness-progress-card,
      .ai-readiness-steps-card,
      .ai-readiness-results-card {
        padding: 16px;
        margin-bottom: 16px;
      }
      
      /* Analysis progress mobile */
      .analysis-progress {
        padding: 20px;
      }
      .progress-header {
        flex-direction: column;
        gap: 16px;
      }
      .current-step-indicator {
        flex-direction: column;
        gap: 12px;
      }
      .step-number {
        width: 48px;
        height: 48px;
        font-size: 20px;
      }
      .progress-percentage {
        font-size: 32px;
        text-align: center;
      }
    }
    
    @media (max-width: 480px) {
      .content-area {
        padding: 16px;
      }
      .card-header {
        padding: 14px 16px;
      }
      .card-body {
        padding: 16px;
      }
      .dashboard-section,
      #analysesSection,
      #analysisDetailSection,
      #aiReadinessSection {
        gap: 12px;
      }
      .ai-readiness-hero {
        padding: 16px;
      }
      .ai-readiness-hero h2 {
        font-size: 18px;
      }
      .form-grid {
        gap: 12px;
      }
      .analysis-card {
        padding: 16px;
        gap: 12px;
      }
      .analysis-metadata-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }
  </style>
  <script>
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
                      '<div class="ai-readiness-step-header" onclick="const detail = document.getElementById(\\'' + detailId + '\\'); detail.style.display = detail.style.display === \\'none\\' ? \\'block\\' : \\'none\\';">' +
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
                        '<div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; font-family: \\'Courier New\\', monospace; font-size: 12px; color: var(--text); max-height: 300px; overflow-y: auto; border: 1px solid var(--border);">' +
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
                      '<div style="margin-left: 20px; margin-top: 4px; color: #ce9178; font-size: 11px; font-family: \\'Courier New\\', monospace; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;">' +
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
  </script>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>GEO</h1>
        <p>Engine Optimization</p>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active" onclick="showDashboard(event)">
          <span>Dashboard</span>
        </div>
        <div class="nav-item" onclick="showAnalyses(event)">
          <span>Analysen</span>
        </div>
        <div class="nav-item" onclick="showAIReadiness(event)">
          <span>🤖 AI Readiness</span>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()" title="Menü ausblenden">
            ◀
          </button>
          <h2 id="headerTitle">Neue Analyse starten</h2>
        </div>
        <div id="headerStatus" style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 14px; color: var(--gray-500);">Status: Bereit</span>
        </div>
      </header>

      <div class="content-area">
        <!-- Configuration Section (shown initially) -->
        <div class="card" id="configurationCard">
          <div class="card-header">
            <h3>Analyse-Konfiguration</h3>
          </div>
          <div class="card-body">
            <form id="analyzeForm">
              <div class="form-grid">
                <div class="form-group">
                  <label for="websiteUrl">Website URL *</label>
                  <input type="url" id="websiteUrl" name="websiteUrl" 
                         placeholder="https://example.com" required>
                </div>
                <div class="form-group">
                  <label for="country">Land (ISO Code) *</label>
                  <input type="text" id="country" name="country" 
                         placeholder="CH, DE, US" maxlength="2" required>
                </div>
                <div class="form-group">
                  <label for="language">Sprache (ISO Code) *</label>
                  <select id="language" name="language" required>
                    <option value="de">Deutsch (de)</option>
                    <option value="en">English (en)</option>
                    <option value="fr">Français (fr)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region">Region (optional)</label>
                  <input type="text" id="region" name="region" 
                         placeholder="z.B. Zurich, Berlin">
                </div>
                <div class="form-group">
                  <label for="questionsPerCategory">Fragen pro Kategorie</label>
                  <input type="number" id="questionsPerCategory" name="questionsPerCategory" 
                         value="3" min="1" max="10" style="width: 100px;">
                  <small style="display: block; margin-top: 4px; color: var(--gray-500); font-size: 12px;">Anzahl der Fragen, die pro Kategorie generiert werden (Standard: 3)</small>
                </div>
              </div>
              <button type="button" id="startAnalysisBtn" class="btn btn-primary btn-block" 
                      onclick="if(window.startAnalysisNow){window.startAnalysisNow();}else{alert('startAnalysisNow nicht gefunden!');} return false;">
                Analyse starten
              </button>
            </form>
          </div>
        </div>

        <!-- Progress Section (shown during analysis) -->
        <div class="analysis-progress" id="analysisProgress" style="display: none;">
          <div class="progress-header">
            <div class="current-step-indicator">
              <div class="step-number" id="stepNumber">1</div>
              <div class="step-content">
                <div class="step-title" id="currentStepTitle">Analyse wird vorbereitet</div>
                <div class="step-description" id="currentStepDescription">Initialisierung...</div>
              </div>
            </div>
            <div class="progress-percentage" id="progressPercentage">0%</div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" id="progressFill"></div>
            </div>
          </div>
        </div>

            <!-- Loading/Progress (legacy, kept for compatibility) -->
            <div class="loading" id="loading" style="display: none;">
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFillLegacy" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="progressText">Initializing...</div>
              </div>
              <div class="status-card">
                <div class="status-title" id="currentStatus">Bereit zum Starten...</div>
                <div class="status-details" id="statusDetails"></div>
              </div>
            </div>

            <!-- Results -->
            <div id="result" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultContent"></div>
                </div>
              </div>
            </div>

            <div id="resultsContainer" style="display: none; margin-top: 24px;">
              <div class="card">
                <div class="card-header">
                  <h3>Detaillierte Analyse-Ergebnisse</h3>
                </div>
                <div class="card-body">
                  <div id="resultsContent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analyses Section (hidden by default) -->
        <div id="analysesSection" class="dashboard-section" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <h3>Gespeicherte Analysen</h3>
              <button class="btn btn-primary" onclick="if(typeof hideAllSections === 'function'){hideAllSections();} (function(){var card = document.querySelector('.content-area > .card'); if(card){card.style.display = 'block';}})();" style="padding: 8px 16px; font-size: 14px;">
                + Neue Analyse
              </button>
            </div>
            <div class="card-body">
              <div id="analysesList" class="dashboard-grid-2">
                <div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">
                  Lade Analysen...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analysis Detail Section (hidden by default) -->
        <div id="analysisDetailSection" class="dashboard-section" style="display: none;">
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <h3 id="analysisDetailTitle">Analyse Details</h3>
              <button class="btn" onclick="showAnalyses(event)" style="padding: 8px 16px; font-size: 14px; background: var(--bg-secondary); color: var(--text); border: 1px solid var(--border);">
                ← Zurück
              </button>
            </div>
            <div class="card-body">
              <div id="analysisDetailContent" style="width: 100%; box-sizing: border-box;">
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                  Lade Analyse-Details...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Readiness Section -->
        <div id="aiReadinessSection" class="dashboard-section" style="display: none;">
          <!-- Hero Section -->
          <div class="ai-readiness-hero" style="width: 100%; box-sizing: border-box;">
            <h2>🤖 AI Readiness Check</h2>
            <p>
              Analysiere deine Website auf AI-Readiness: robots.txt, Sitemap und alle Seiten werden 
              gründlich geprüft, um sicherzustellen, dass deine Website optimal für AI-Crawler vorbereitet ist.
            </p>
          </div>

          <!-- Form Card -->
          <div class="ai-readiness-form-card">
            <form id="aiReadinessForm">
              <div class="ai-readiness-input-wrapper">
                <label for="aiReadinessUrl">Website URL</label>
                <input 
                  type="text" 
                  id="aiReadinessUrl" 
                  name="aiReadinessUrl" 
                  placeholder="example.com oder https://example.com" 
                  required>
              </div>
              <button 
                type="button" 
                id="startAIReadinessBtn" 
                class="ai-readiness-btn" 
                onclick="if(window.startAIReadiness){window.startAIReadiness();}else{alert('startAIReadiness nicht gefunden!');} return false;">
                🚀 AI Readiness Check starten
              </button>
            </form>
          </div>

          <!-- Progress Card -->
          <div id="aiReadinessLoading" class="loading" style="display: none;">
            <div class="ai-readiness-progress-card">
              <div class="ai-readiness-status-header">
                <div class="ai-readiness-status-icon">🤖</div>
                <div class="ai-readiness-status-text">
                  <div class="ai-readiness-status-title" id="aiReadinessStatus">Vorbereitung...</div>
                  <div class="ai-readiness-status-subtitle" id="aiReadinessStatusDetails">Starte Analyse...</div>
                </div>
              </div>
              <div class="ai-readiness-progress-bar-wrapper">
                <div class="ai-readiness-progress-bar" id="aiReadinessProgress" style="width: 0%;"></div>
              </div>
              <div class="ai-readiness-progress-percentage" id="aiReadinessProgressText">0%</div>
            </div>
          </div>

          <!-- Steps Overview -->
          <div id="aiReadinessSteps" style="display: none;">
            <div class="ai-readiness-steps-card">
              <div class="ai-readiness-steps-header">
                <h4>📊 Analyse-Schritte</h4>
              </div>
              <div id="aiReadinessStepsContent">
                <div style="text-align: center; color: var(--text-light); padding: 40px;">
                  Warte auf erste Schritte...
                </div>
              </div>
            </div>
          </div>

          <!-- Console Log -->
          <div id="aiReadinessConsole" style="display: none;">
            <div class="ai-readiness-console-card">
              <div class="ai-readiness-console-header">
                <h4>📋 Detailliertes Log</h4>
                <button 
                  type="button" 
                  id="clearConsoleBtn" 
                  onclick="if(document.getElementById('aiReadinessConsoleContent')){document.getElementById('aiReadinessConsoleContent').innerHTML='<div style=\\'color: #6a9955;\\'>[System] Console gelöscht.</div>';}" 
                  style="background: #444; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: background 0.2s;">
                  Löschen
                </button>
              </div>
              <div class="ai-readiness-console-content" id="aiReadinessConsoleContent">
                <div style="color: #6a9955;">[System] Console bereit. Warte auf Logs...</div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div id="aiReadinessResults" style="display: none;">
            <div class="ai-readiness-results-card">
              <div class="ai-readiness-results-header">
                <h3>✨ AI Readiness Empfehlungen</h3>
              </div>
              <div class="ai-readiness-results-content" id="aiReadinessResultsContent">
                <!-- Results werden hier angezeigt -->
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <script>
    // GLOBAL FUNCTIONS - available immediately (before DOMContentLoaded)
    // These must be defined before any HTML tries to call them
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
        // Set first nav item (Dashboard) as active
        const dashboardNav = document.querySelector('.nav-item');
        if (dashboardNav) dashboardNav.classList.add('active');
      }
      // Try to call full implementation if available
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
      // Try to call full implementation if available
      if (window.showAIReadinessFull) {
        window.showAIReadinessFull(event);
      }
    };
    
    // startAIReadiness is already defined in <head> script tag above
    
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
      
      // Update progress section
      const analysisProgress = document.getElementById('analysisProgress');
      const stepNumberEl = document.getElementById('stepNumber');
      const stepTitleEl = document.getElementById('currentStepTitle');
      const stepDescEl = document.getElementById('currentStepDescription');
      const progressPercentage = document.getElementById('progressPercentage');
      const progressFill = document.getElementById('progressFill');
      
      if (analysisProgress) {
        analysisProgress.style.display = 'block';
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
      
      // Also update legacy elements for compatibility
      const progressFillLegacy = document.getElementById('progressFillLegacy');
      const progressTextLegacy = document.getElementById('progressTextLegacy');
      if (progressFillLegacy && progress !== undefined) {
        progressFillLegacy.style.width = progress + '%';
      }
      if (progressTextLegacy && progress !== undefined) {
        progressTextLegacy.textContent = Math.round(progress) + '%';
      }
      const currentStatus = document.getElementById('currentStatus');
      const statusDetails = document.getElementById('statusDetails');
      if (currentStatus && stepTitle) {
        currentStatus.textContent = stepTitle;
      }
      if (statusDetails && stepDescription) {
        statusDetails.textContent = stepDescription;
      }
    };
    
    // Helper function to hide configuration and show progress
    window.startAnalysisUI = function() {
      const configCard = document.getElementById('configurationCard');
      const analysisProgress = document.getElementById('analysisProgress');
      
      if (configCard) {
        configCard.classList.add('hidden');
        setTimeout(() => {
          configCard.style.display = 'none';
        }, 300);
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
        
        // Show loading (legacy support)
        const loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'block';
          loading.classList.add('show');
        }
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '5%';
        if (progressText) progressText.textContent = 'Starte Analyse...';
        
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
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (status.progress) {
          const progress = status.progress.progress || 0;
          progressFill.style.width = progress + '%';
          progressFill.textContent = progress + '%';
          progressText.textContent = status.progress.message || status.progress.step || 'Processing...';
        }
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
          await loadResults(runId);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          document.getElementById('loading').classList.remove('show');
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
        progressFill.style.width = '0%';
        progressText.textContent = 'Starte Analyse...';
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) statusEl.textContent = '🚀 Analyse wird gestartet...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Vorbereitung der Analyse...';
        
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
        
        // Show loading immediately
        loading.style.display = 'block';
        loading.classList.add('show');
        result.classList.remove('show');
        progressFill.style.width = '5%';
        progressText.textContent = 'Suche Sitemap.xml...';
        
        const statusEl1 = document.getElementById('currentStatus');
        const statusDetailsEl1 = document.getElementById('statusDetails');
        if (statusEl1) statusEl1.textContent = '🔍 Schritt 1: Sitemap wird gesucht...';
        if (statusDetailsEl1) statusDetailsEl1.textContent = 'Suche nach sitemap.xml auf ' + formData.websiteUrl;
        
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
          progressText.textContent = 'Sitemap gefunden: ' + urlCount + ' URLs';
        } else {
          const urlCount = data.urls ? data.urls.length : 0;
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(1, 'Sitemap nicht gefunden', urlCount + ' URLs von Startseite extrahiert. Bereite nächsten Schritt vor...', 20);
          }
          progressText.textContent = 'Keine Sitemap gefunden: ' + urlCount + ' URLs von Startseite';
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
        
        const statusEl3 = document.getElementById('currentStatus');
        const statusDetailsEl3 = document.getElementById('statusDetails');
        if (statusEl3) statusEl3.textContent = '📄 Schritt 2: Inhalte werden geholt...';
        if (statusDetailsEl3) statusDetailsEl3.textContent = 'Lade Inhalte von ' + workflowData.urls.length + ' URLs';
        
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
          progressText.textContent = 'Hole Inhalte... (' + (i + 1) + '/' + maxUrls + ')';
          
          // Update UI with live progress
          if (window.updateAnalysisUI) {
            window.updateAnalysisUI(2, 'Inhalte werden geholt', 'Lade URL ' + (i + 1) + ' von ' + maxUrls, progress);
          }
          
          const statusDetailsEl3Loop = document.getElementById('statusDetails');
          if (statusDetailsEl3Loop) statusDetailsEl3Loop.textContent = 'Lade URL ' + (i + 1) + ' von ' + maxUrls + ': ' + url.substring(0, 50) + '...';
          document.getElementById('progressFill').style.width = progress + '%';
          
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
        document.getElementById('progressFill').style.width = '40%';
        progressText.textContent = 'Inhalte von ' + fetchedCount + ' Seiten geholt';
        
        // Update UI for step 2 completion
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(2, 'Inhalte geholt', fetchedCount + ' Seiten erfolgreich geladen. Bereite nächsten Schritt vor...', 40);
        }
        
        const statusEl4 = document.getElementById('currentStatus');
        const statusDetailsEl4 = document.getElementById('statusDetails');
        if (statusEl4) statusEl4.textContent = '✅ Schritt 2 abgeschlossen: Inhalte geholt';
        if (statusDetailsEl4) statusDetailsEl4.textContent = fetchedCount + ' Seiten erfolgreich geladen. Bereite Schritt 3 vor...';
        
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
        
        const statusEl5 = document.getElementById('currentStatus');
        const statusDetailsEl5 = document.getElementById('statusDetails');
        if (statusEl5) statusEl5.textContent = '🤖 Schritt 3: Kategorien werden generiert...';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'GPT analysiert Inhalte und generiert Kategorien/Keywords...';
        
        document.getElementById('progressText').textContent = 'Generiere Kategorien/Keywords mit GPT...';
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
        document.getElementById('progressFill').style.width = '60%';
        document.getElementById('progressText').textContent = 
          data.categories.length + ' Kategorien generiert';
        
        // Update UI for step 3 completion
        if (window.updateAnalysisUI) {
          window.updateAnalysisUI(3, 'Kategorien generiert', data.categories.length + ' Kategorien gefunden. Wähle Kategorien aus...', 60);
        }
        
        // Update status (reuse existing variables)
        if (statusEl5) statusEl5.textContent = '✅ Schritt 3 abgeschlossen: ' + data.categories.length + ' Kategorien generiert';
        if (statusDetailsEl5) statusDetailsEl5.textContent = 'Bitte wähle die Kategorien aus, für die Fragen generiert werden sollen.';
        
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
            if (progressFill) {
              progressFill.style.width = '60%';
              progressFill.style.transition = 'width 0.3s ease';
            }
            if (progressText) progressText.textContent = 'Starte Fragen-Generierung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) {
              statusEl.textContent = '🤖 Schritt 4: Fragen werden generiert...';
              statusEl.style.color = '#2563eb';
            }
            if (statusDetailsEl) {
              statusDetailsEl.textContent = 'GPT generiert Fragen für ' + selected.length + ' ausgewählte Kategorien. Bitte warten...';
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
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        if (progressText) progressText.textContent = 'Generiere ' + totalQuestions + ' Fragen für ' + selectedCats.length + ' Kategorien...';
        if (progressFill) {
          progressFill.style.width = '65%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        
        const statusEl = document.getElementById('currentStatus');
        const statusDetailsEl = document.getElementById('statusDetails');
        if (statusEl) {
          statusEl.textContent = '🤖 Schritt 4: Fragen werden generiert...';
          statusEl.style.color = '#2563eb';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'GPT generiert ' + questionsPerCategory + ' Fragen pro Kategorie für ' + selectedCats.length + ' Kategorien. Dies kann einige Sekunden dauern...';
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
        if (progressFill) {
          progressFill.style.width = '80%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) {
          progressText.textContent = '✅ ' + data.prompts.length + ' Fragen erfolgreich generiert!';
        }
        
        if (statusEl) {
          statusEl.textContent = '✅ Schritt 4 abgeschlossen: ' + data.prompts.length + ' Fragen generiert';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) {
          statusDetailsEl.textContent = 'Alle Fragen wurden erfolgreich generiert. Bitte überprüfe und bearbeite die Fragen.';
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
            
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            if (progressFill) progressFill.style.width = '80%';
            if (progressText) progressText.textContent = 'Starte GPT-5 Ausführung...';
            
            const statusEl = document.getElementById('currentStatus');
            const statusDetailsEl = document.getElementById('statusDetails');
            if (statusEl) statusEl.textContent = '🤖 Schritt 5: GPT-5 Ausführung...';
            if (statusDetailsEl) statusDetailsEl.textContent = 'Führe ' + updatedPrompts.length + ' Fragen aus...';
            
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
        if (statusEl) statusEl.textContent = '🤖 Schritt 5: GPT-5 Ausführung läuft...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Führe ' + promptsLength + ' Fragen mit Web Search aus...';
        
        // Execute prompts one by one with live updates
        for (let i = 0; i < promptsLength; i++) {
          const prompt = workflowData.prompts[i];
          const progressPercent = 80 + ((i / promptsLength) * 20);
          
          // Update progress
          if (progressText) progressText.textContent = 'Frage ' + (i + 1) + '/' + promptsLength + ' wird ausgeführt...';
          if (progressFill) {
            progressFill.style.width = progressPercent + '%';
            progressFill.style.transition = 'width 0.3s ease';
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
        if (progressFill) {
          progressFill.style.width = '100%';
          progressFill.style.transition = 'width 0.3s ease';
        }
        if (progressText) progressText.textContent = '✅ Analyse abgeschlossen! ' + executedCount + ' von ' + promptsLength + ' Fragen erfolgreich ausgeführt';
        if (statusEl) {
          statusEl.textContent = '✅ Schritt 5 abgeschlossen';
          statusEl.style.color = '#059669';
        }
        if (statusDetailsEl) statusDetailsEl.textContent = 'Alle Fragen wurden ausgeführt. Ergebnisse sind unten sichtbar.';
        
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
          throw new Error('Fehler beim Generieren des Fazits');
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
          otherSourcesHtml += '<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: white;">📚 Andere Quellen:</h4>';
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
    
    // Prevent AI Readiness form from submitting to wrong handler
    const aiReadinessForm = document.getElementById('aiReadinessForm');
    if (aiReadinessForm) {
      aiReadinessForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔵 AI Readiness form submitted - preventing default');
        // Call startAIReadiness if available
        if (window.startAIReadiness) {
          window.startAIReadiness();
        }
        return false;
      });
    }
    
    console.log('✅ All event listeners attached successfully');
    
    // Make functions available globally for startAnalysisNow
    window.executeStep1 = executeStep1;
    window.executeStep2 = executeStep2;
    window.executeStep3 = executeStep3;
    window.executeStep4 = executeStep4;
    window.executeStep5 = executeStep5;

    // Helper functions
    function hideAllSections() {
      const analysisSection = document.querySelector('.content-area > .card');
      const analysesSection = document.getElementById('analysesSection');
      const analysisDetailSection = document.getElementById('analysisDetailSection');
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (analysisSection) analysisSection.style.display = 'none';
      if (analysesSection) analysesSection.style.display = 'none';
      if (analysisDetailSection) analysisDetailSection.style.display = 'none';
      if (aiReadinessSection) aiReadinessSection.style.display = 'none';
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
      const analysisSection = document.querySelector('.content-area > .card');
      if (analysisSection) {
        analysisSection.style.display = 'block';
      }
      updateNavActive(event);
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
    
    // AI Readiness functionality
    function showAIReadiness(event) {
      hideAllSections();
      const aiReadinessSection = document.getElementById('aiReadinessSection');
      if (aiReadinessSection) {
        aiReadinessSection.style.display = 'block';
      }
      updateNavActive(event);
    }
    
    // Start AI Readiness Check
    async function startAIReadiness() {
      const urlInput = document.getElementById('aiReadinessUrl');
      const url = urlInput?.value?.trim();
      
      if (!url) {
        alert('Bitte geben Sie eine URL ein.');
            return;
          }
          
      // Validate URL
      let websiteUrl = url;
      const urlPattern = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      try {
        new URL(websiteUrl);
      } catch (e) {
        alert('Ungültige URL. Bitte geben Sie eine gültige URL ein.');
        return;
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
      
      // Console logging function
      const addConsoleLog = (message, type = 'info') => {
        if (!consoleContentEl) return;
        const timestamp = new Date().toLocaleTimeString('de-DE');
        const colors = {
          info: '#4fc3f7',
          success: '#66bb6a',
          warning: '#ffa726',
          error: '#ef5350',
          system: '#6a9955'
        };
        const icons = {
          info: 'ℹ️',
          success: '✅',
          warning: '⚠️',
          error: '❌',
          system: '🔵'
        };
        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        const logLine = document.createElement('div');
        logLine.style.color = color;
        logLine.style.marginBottom = '4px';
        const timestampSpan = document.createElement('span');
        timestampSpan.style.color = '#858585';
        timestampSpan.textContent = '[' + timestamp + ']';
        logLine.appendChild(timestampSpan);
        logLine.appendChild(document.createTextNode(' ' + icon + ' ' + message));
        consoleContentEl.appendChild(logLine);
        consoleContentEl.scrollTop = consoleContentEl.scrollHeight;
      };
      
      // Clear console function
      const clearConsole = () => {
        if (consoleContentEl) {
          consoleContentEl.innerHTML = '<div style="color: #6a9955;">[System] Console gelöscht.</div>';
        }
      };
      
      // Setup clear button
      const clearBtn = document.getElementById('clearConsoleBtn');
      if (clearBtn) {
        clearBtn.onclick = clearConsole;
      }
      
      if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.classList.add('show');
      }
      // Show steps overview
      const stepsEl = document.getElementById('aiReadinessSteps');
      if (stepsEl) {
        stepsEl.style.display = 'block';
      }
      
      if (consoleEl) {
        consoleEl.style.display = 'block';
        clearConsole();
        addConsoleLog('AI Readiness Analyse gestartet', 'system');
        addConsoleLog('Ziel-URL: ' + websiteUrl, 'info');
      }
      if (resultsEl) resultsEl.style.display = 'none';
      if (statusEl) statusEl.textContent = 'Vorbereitung...';
      if (statusDetailsEl) statusDetailsEl.textContent = 'Starte AI Readiness Check...';
      if (progressEl) progressEl.style.width = '0%';
      if (progressTextEl) progressTextEl.textContent = '0%';
      
      try {
        // Step 1: Start analysis
        addConsoleLog('Starte Analyse-Request an Server...', 'info');
        if (statusEl) statusEl.textContent = 'Schritt 1: robots.txt und Sitemap holen...';
        if (statusDetailsEl) statusDetailsEl.textContent = 'Lade robots.txt und Sitemap...';
        if (progressEl) progressEl.style.width = '20%';
        if (progressTextEl) progressTextEl.textContent = '20%';
        
        const step1Response = await fetch('/api/ai-readiness/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl })
        });
        
        if (!step1Response.ok) {
          addConsoleLog('Fehler beim Starten der Analyse', 'error');
          throw new Error('Fehler beim Starten der Analyse');
        }
        
        const step1Data = await step1Response.json();
        addConsoleLog('Analyse gestartet. Run ID: ' + step1Data.runId, 'success');
        addConsoleLog('Warte auf Hintergrund-Verarbeitung...', 'info');
        
        // Wait for completion (polling)
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
        let recommendations = null;
        let lastMessage = '';
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const statusResponse = await fetch('/api/ai-readiness/status/' + step1Data.runId);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // Log status updates
            if (statusData.message && statusData.message !== lastMessage) {
              addConsoleLog(statusData.message, 'info');
              lastMessage = statusData.message;
              
              // Parse step from message
              if (statusData.message.includes('Schritt 1')) {
                if (progressEl) progressEl.style.width = '15%';
                if (progressTextEl) progressTextEl.textContent = '15%';
                if (statusEl) statusEl.textContent = 'Schritt 1/6: robots.txt';
              } else if (statusData.message.includes('Schritt 2')) {
                if (progressEl) progressEl.style.width = '30%';
                if (progressTextEl) progressTextEl.textContent = '30%';
                if (statusEl) statusEl.textContent = 'Schritt 2/6: Sitemap';
              } else if (statusData.message.includes('Schritt 3')) {
                if (progressEl) progressEl.style.width = '45%';
                if (progressTextEl) progressTextEl.textContent = '45%';
                if (statusEl) statusEl.textContent = 'Schritt 3/6: Homepage';
              } else if (statusData.message.includes('Schritt 4')) {
                if (progressEl) progressEl.style.width = '60%';
                if (progressTextEl) progressTextEl.textContent = '60%';
                if (statusEl) statusEl.textContent = 'Schritt 4/6: Seiten scrapen';
              } else if (statusData.message.includes('Schritt 5')) {
                if (progressEl) progressEl.style.width = '75%';
                if (progressTextEl) progressTextEl.textContent = '75%';
                if (statusEl) statusEl.textContent = 'Schritt 5/6: Daten analysieren';
              } else if (statusData.message.includes('Schritt 6')) {
                if (progressEl) progressEl.style.width = '85%';
                if (progressTextEl) progressTextEl.textContent = '85%';
                if (statusEl) statusEl.textContent = 'Schritt 6/6: GPT-Analyse';
              }
            }
            
            if (statusData.status === 'completed') {
              addConsoleLog('Analyse erfolgreich abgeschlossen!', 'success');
              recommendations = statusData.recommendations;
              break;
            } else if (statusData.status === 'error') {
              addConsoleLog('Fehler: ' + (statusData.error || 'Unbekannter Fehler'), 'error');
              throw new Error(statusData.error || 'Fehler bei der Analyse');
            }
            
            // Update progress
            if (statusDetailsEl && statusData.message) {
              statusDetailsEl.textContent = statusData.message;
            }
          } else {
            addConsoleLog('Status-Abfrage fehlgeschlagen (Versuch ' + (attempts + 1) + '/' + maxAttempts + ')', 'warning');
          }
          
          attempts++;
        }
        
        if (!recommendations) {
          addConsoleLog('Timeout: Die Analyse hat zu lange gedauert.', 'error');
          throw new Error('Timeout: Die Analyse hat zu lange gedauert.');
        }
        
        // Display results
        addConsoleLog('Ergebnisse werden angezeigt...', 'success');
        if (statusEl) statusEl.textContent = '✅ Analyse abgeschlossen';
        if (statusDetailsEl) statusDetailsEl.textContent = 'AI Readiness Check erfolgreich durchgeführt';
        if (progressEl) progressEl.style.width = '100%';
        if (progressTextEl) progressTextEl.textContent = '100%';
        
        if (resultsContentEl) {
          resultsContentEl.innerHTML = 
            '<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151;">' +
            recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</div>';
        }
        
        if (resultsEl) resultsEl.style.display = 'block';
        
      } catch (error) {
        console.error('Error in AI Readiness check:', error);
        addConsoleLog('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'), 'error');
        if (statusEl) statusEl.textContent = '❌ Fehler';
        if (statusDetailsEl) statusDetailsEl.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
        alert('Fehler beim AI Readiness Check: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } finally {
        if (loadingEl) {
          setTimeout(() => {
            loadingEl.style.display = 'none';
            loadingEl.classList.remove('show');
          }, 2000);
        }
      }
    }
    
    function loadAnalyses() {
      const analysesList = document.getElementById('analysesList');
      if (!analysesList) return;
      
      // Ensure grid class is applied
      if (!analysesList.classList.contains('dashboard-grid-2')) {
        analysesList.classList.add('dashboard-grid-2');
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:4218',message:'loadAnalyses called',data:{analysesListExists:!!analysesList,analysesListComputedStyle:analysesList?window.getComputedStyle(analysesList).display:null,analysesListGridTemplate:analysesList?window.getComputedStyle(analysesList).gridTemplateColumns:null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">Lade Analysen...</div>';
      
      fetch('/api/analyses')
        .then(res => res.json())
        .then(analyses => {
          if (analyses.length === 0) {
            analysesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">Keine Analysen vorhanden. Starte eine neue Analyse.</div>';
            return;
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:4226',message:'Before rendering analyses',data:{analysesCount:analyses.length,analysesListWidth:analysesList.offsetWidth,analysesListHeight:analysesList.offsetHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
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
          
          // #region agent log
          setTimeout(() => {
            const cards = analysesList.querySelectorAll('.analysis-card');
            const cardSizes = Array.from(cards).map((card, idx) => ({
              index: idx,
              width: card.offsetWidth,
              height: card.offsetHeight,
              computedDisplay: window.getComputedStyle(card).display,
              computedGridTemplate: window.getComputedStyle(analysesList).gridTemplateColumns
            }));
            fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:4273',message:'After rendering analyses',data:{cardCount:cards.length,cardSizes:cardSizes,analysesListWidth:analysesList.offsetWidth,analysesListGridTemplate:window.getComputedStyle(analysesList).gridTemplateColumns},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
          }, 100);
          // #endregion
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
          
          // #region agent log
          setTimeout(() => {
            const metricsGrid = analysisDetailContent.querySelector('.dashboard-metrics-grid');
            const promptsGrid = analysisDetailContent.querySelector('.prompts-grid');
            const detailedGrid = analysisDetailContent.querySelector('.detailed-data-grid');
            const metricsCards = metricsGrid ? Array.from(metricsGrid.children) : [];
            const promptsCards = promptsGrid ? Array.from(promptsGrid.children) : [];
            const detailedCards = detailedGrid ? Array.from(detailedGrid.children) : [];
            fetch('http://127.0.0.1:7243/ingest/8d5e705c-16ea-4080-9518-73d11ec7dac4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'landing-page.ts:4442',message:'After rendering dashboard',data:{metricsGridExists:!!metricsGrid,metricsGridTemplate:metricsGrid?window.getComputedStyle(metricsGrid).gridTemplateColumns:null,metricsCardCount:metricsCards.length,metricsCardSizes:metricsCards.map((c,i)=>({i,width:c.offsetWidth,height:c.offsetHeight})),promptsGridExists:!!promptsGrid,promptsGridTemplate:promptsGrid?window.getComputedStyle(promptsGrid).gridTemplateColumns:null,promptsCardCount:promptsCards.length,detailedGridExists:!!detailedGrid,detailedGridTemplate:detailedGrid?window.getComputedStyle(detailedGrid).gridTemplateColumns:null,detailedCardCount:detailedCards.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
          }, 100);
          // #endregion
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
    
    // Store full implementations for use by global stubs
    window.showDashboardFull = showDashboard;
    window.showAnalysesFull = showAnalyses;
    window.showAIReadinessFull = showAIReadiness;
    window.startAIReadinessFull = startAIReadiness;
    window.loadAnalyses = loadAnalyses;
    window.viewAnalysisDetailsFull = viewAnalysisDetails;
    window.deleteAnalysisFull = deleteAnalysis;
    window.pauseAnalysisFull = pauseAnalysis;
    
    // Update global functions to use full implementations
    // Note: window.startAIReadiness is already defined in <head> script, don't override it
    window.showDashboard = showDashboard;
    window.showAnalyses = showAnalyses;
    window.showAIReadiness = showAIReadiness;
    window.viewAnalysisDetails = viewAnalysisDetails;
    window.deleteAnalysis = deleteAnalysis;
    window.pauseAnalysis = pauseAnalysis;
    }); // End of DOMContentLoaded
  </script>
</body>
</html>\``;
