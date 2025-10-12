// Main application script
import { initMeshPulseBackground, disposeMeshPulseBackground } from '../../bg/mesh-pulse.js';

class PersonalWebsite {
  constructor() {
    this.background = null;
    this.init();
  }

  async init() {
    this.initBackground();
    this.loadDynamicContent();
    this.setupEventListeners();
    this.setupAccessibility();
  }

  initBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    try {
      this.background = initMeshPulseBackground(canvas, {
        lineColor: '#60A5FA',
        baseAmp: 8.0,
        noiseAmp: 4.0,
        pulseFreq: 7.0,
        gridSize: 25.0,
        lineAlpha: 0.12
      });

      // Start animation
      if (this.background) {
        this.background.start();
      }
    } catch (error) {
      console.warn('Background initialization failed:', error);
      this.fallbackToStaticBackground();
    }
  }

  fallbackToStaticBackground() {
    const canvas = document.getElementById('background-canvas');
    if (canvas) {
      canvas.style.background = 'linear-gradient(135deg, #0B0D10 0%, #1a1f2e 100%)';
    }
  }

  async loadDynamicContent() {
    try {
      await Promise.all([
        this.loadFeaturedProjects(),
        this.loadLatestResearch(),
        this.loadLatestNotes()
      ]);
    } catch (error) {
      console.error('Failed to load dynamic content:', error);
    }
  }

  async loadFeaturedProjects() {
    const container = document.getElementById('featured-projects');
    if (!container) return;

    try {
      const response = await fetch('/src/data/projects.json');
      const projects = await response.json();
      
      const featuredProjects = projects.filter(p => p.featured).slice(0, 3);
      
      container.innerHTML = featuredProjects.map(project => `
        <div class="bg-text-primary/5 backdrop-blur-sm rounded-xl p-6 hover:bg-text-primary/10 transition-all duration-300 group">
          <div class="aspect-video bg-bg-primary/50 rounded-lg mb-4 flex items-center justify-center">
            <div class="text-text-primary/40 text-sm">Project Image</div>
          </div>
          <h3 class="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-2 transition-colors">
            <a href="/projects/${project.slug}/">${project.title}</a>
          </h3>
          <p class="text-text-primary/70 mb-4 text-sm leading-relaxed">${project.summary}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${project.tags.map(tag => `
              <span class="px-2 py-1 bg-accent-1/20 text-accent-1 text-xs rounded-md font-mono">${tag}</span>
            `).join('')}
          </div>
          <div class="flex gap-3">
            ${project.links.code ? `<a href="${project.links.code}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Code</a>` : ''}
            ${project.links.paper ? `<a href="${project.links.paper}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Paper</a>` : ''}
            ${project.links.demo ? `<a href="${project.links.demo}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Demo</a>` : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="text-text-primary/60">Failed to load projects</p>';
    }
  }

  async loadLatestResearch() {
    const container = document.getElementById('latest-research');
    if (!container) return;

    try {
      const response = await fetch('/src/data/research.json');
      const research = await response.json();
      
      const latestResearch = research.filter(r => r.featured).slice(0, 3);
      
      container.innerHTML = latestResearch.map(paper => `
        <div class="mb-6 pb-6 border-b border-text-primary/10 last:border-b-0">
          <h3 class="text-lg font-semibold text-text-primary mb-2">
            <a href="/research/${paper.slug}/" class="hover:text-accent-2 transition-colors">${paper.title}</a>
          </h3>
          <p class="text-text-primary/60 text-sm mb-2">${paper.venue} ${paper.year}</p>
          <p class="text-text-primary/70 text-sm leading-relaxed">${paper.abstract.substring(0, 120)}...</p>
          <div class="flex gap-3 mt-3">
            ${paper.pdf ? `<a href="${paper.pdf}" class="text-accent-2 hover:text-accent-2/80 text-xs">PDF</a>` : ''}
            ${paper.code ? `<a href="${paper.code}" class="text-accent-2 hover:text-accent-2/80 text-xs">Code</a>` : ''}
            ${paper.video ? `<a href="${paper.video}" class="text-accent-2 hover:text-accent-2/80 text-xs">Video</a>` : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="text-text-primary/60">Failed to load research</p>';
    }
  }

  async loadLatestNotes() {
    const container = document.getElementById('latest-notes');
    if (!container) return;

    try {
      const response = await fetch('/src/data/notes.json');
      const notes = await response.json();
      
      const latestNotes = notes.filter(n => n.featured).slice(0, 3);
      
      container.innerHTML = latestNotes.map(note => `
        <div class="mb-6 pb-6 border-b border-text-primary/10 last:border-b-0">
          <h3 class="text-lg font-semibold text-text-primary mb-2">
            <a href="/notes/${note.slug}/" class="hover:text-accent-2 transition-colors">${note.title}</a>
          </h3>
          <p class="text-text-primary/60 text-sm mb-2">${new Date(note.date).toLocaleDateString()}</p>
          <p class="text-text-primary/70 text-sm leading-relaxed">${note.excerpt}</p>
          <div class="flex gap-2 mt-3">
            ${note.tags.map(tag => `
              <span class="px-2 py-1 bg-accent-2/20 text-accent-2 text-xs rounded-md">${tag}</span>
            `).join('')}
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="text-text-primary/60">Failed to load notes</p>';
    }
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', this.handleSmoothScroll.bind(this));
    });

    // Copy email to clipboard
    document.querySelectorAll('[data-copy-email]').forEach(button => {
      button.addEventListener('click', this.copyEmailToClipboard.bind(this));
    });

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }

  setupAccessibility() {
    // Focus management for mobile menu
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      const focusableElements = mobileMenu.querySelectorAll('a, button');
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      mobileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }

    // Skip to content functionality
    const skipLink = document.querySelector('a[href="#main-content"]');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('main-content');
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('hidden');
      
      // Update aria-expanded
      const toggle = document.getElementById('mobile-menu-toggle');
      const isExpanded = !mobileMenu.classList.contains('hidden');
      toggle.setAttribute('aria-expanded', isExpanded);
    }
  }

  handleSmoothScroll(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  async copyEmailToClipboard(e) {
    e.preventDefault();
    const email = 'hello@kunalaneja.com';
    
    try {
      await navigator.clipboard.writeText(email);
      
      // Show feedback
      const button = e.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('bg-green-600');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
      // Fallback: open mailto link
      window.location.href = `mailto:${email}`;
    }
  }

  handleKeyboardNavigation(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        this.toggleMobileMenu();
        document.getElementById('mobile-menu-toggle').focus();
      }
    }
  }

  destroy() {
    if (this.background) {
      disposeMeshPulseBackground(this.background);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.personalWebsite = new PersonalWebsite();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.personalWebsite) {
    window.personalWebsite.destroy();
  }
});
