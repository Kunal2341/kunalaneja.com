// Projects page script
import { initMeshPulseBackground, disposeMeshPulseBackground } from '../../bg/mesh-pulse';

class ProjectsPage {
  constructor() {
    this.background = null;
    this.init();
  }

  async init() {
    this.initBackground();
    await this.loadProjects();
  }

  initBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    try {
      this.background = initMeshPulseBackground(canvas, {
        lineColor: '#60A5FA',
        baseAmp: 6.0,
        noiseAmp: 3.0,
        pulseFreq: 9.0,
        gridSize: 22.0,
        lineAlpha: 0.10
      });

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

  async loadProjects() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    try {
      const response = await fetch('/src/data/projects.json');
      const projects = await response.json();
      
      container.innerHTML = projects.map(project => `
        <article class="card-hover group">
          <div class="aspect-video bg-bg-primary/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <div class="text-text-primary/40 text-sm">Project Image</div>
          </div>
          
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-text-primary group-hover:text-accent-2 transition-colors">
              <a href="/projects/${project.slug}/">${project.title}</a>
            </h2>
            
            <p class="text-text-primary/70 text-sm leading-relaxed">${project.summary}</p>
            
            <div class="flex flex-wrap gap-2">
              ${project.tags.map(tag => `
                <span class="tag">${tag}</span>
              `).join('')}
            </div>
            
            <div class="flex items-center justify-between pt-2">
              <span class="text-text-primary/60 text-sm">${new Date(project.date).toLocaleDateString()}</span>
              <div class="flex gap-3">
                ${project.links.code ? `<a href="${project.links.code}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Code</a>` : ''}
                ${project.links.paper ? `<a href="${project.links.paper}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Paper</a>` : ''}
                ${project.links.demo ? `<a href="${project.links.demo}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Demo</a>` : ''}
              </div>
            </div>
          </div>
        </article>
      `).join('');
    } catch (error) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-text-primary/60">Failed to load projects</p>
        </div>
      `;
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
  window.projectsPage = new ProjectsPage();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.projectsPage) {
    window.projectsPage.destroy();
  }
});
