/**
 * Navigation Component
 */

import { getElement, querySelector } from "../utils/dom-utils.js";

export class Navigation {
  private sidebar: HTMLElement | null;
  private mainContent: HTMLElement | null;
  private toggleBtn: HTMLElement | null;

  constructor() {
    this.sidebar = getElement("sidebar") || querySelector(".sidebar");
    this.mainContent = querySelector(".main-content");
    this.toggleBtn = getElement("sidebarToggle");
  }

  toggleSidebar(): void {
    if (!this.sidebar) return;

    const isCollapsed = this.sidebar.classList.contains("collapsed");
    
    if (isCollapsed) {
      this.sidebar.classList.remove("collapsed");
      document.body.classList.remove("sidebar-collapsed");
      if (this.toggleBtn) {
        this.toggleBtn.textContent = "◀";
        this.toggleBtn.title = "Hide menu";
      }
    } else {
      this.sidebar.classList.add("collapsed");
      document.body.classList.add("sidebar-collapsed");
      if (this.toggleBtn) {
        this.toggleBtn.textContent = "▶";
        this.toggleBtn.title = "Show menu";
      }
    }
  }

  setActiveNavItem(index: number): void {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}

// Global navigation instance
export const navigation = new Navigation();

// Export global function for backward compatibility
(window as any).toggleSidebar = () => navigation.toggleSidebar();

