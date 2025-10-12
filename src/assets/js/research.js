// Research page script
import { initMeshPulseBackground, disposeMeshPulseBackground } from '../../bg/mesh-pulse';

class ResearchPage {
  constructor() {
    this.background = null;
    this.init();
  }

  async init() {
    this.initBackground();
    await this.loadResearch();
  }

  initBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    try {
      this.background = initMeshPulseBackground(canvas, {
        lineColor: '#A78BFA',
        baseAmp: 7.0,
        noiseAmp: 3.5,
        pulseFreq: 8.5,
        gridSize: 20.0,
        lineAlpha: 0.08
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

  async loadResearch() {
    const container = document.getElementById('research-papers');
    if (!container) return;

    try {
      const response = await fetch('/src/data/research.json');
      const research = await response.json();
      
      container.innerHTML = research.map(paper => `
        <article class="card mb-8">
          <div class="space-y-4">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-text-primary mb-2">
                  <a href="/research/${paper.slug}/" class="hover:text-accent-2 transition-colors">
                    ${paper.title}
                  </a>
                </h2>
                
                <div class="flex flex-wrap items-center gap-4 mb-3">
                  <span class="text-accent-1 font-semibold">${paper.venue} ${paper.year}</span>
                  <div class="flex gap-3">
                    ${paper.pdf ? `<a href="${paper.pdf}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">PDF</a>` : ''}
                    ${paper.code ? `<a href="${paper.code}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Code</a>` : ''}
                    ${paper.poster ? `<a href="${paper.poster}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Poster</a>` : ''}
                    ${paper.video ? `<a href="${paper.video}" class="text-accent-2 hover:text-accent-2/80 text-sm font-medium">Video</a>` : ''}
                  </div>
                </div>
                
                <p class="text-text-primary/80 leading-relaxed mb-4">${paper.abstract}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                  <span class="text-text-primary/60 text-sm">Authors:</span>
                  <span class="text-text-primary/80 text-sm">${paper.authors.join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-3 pt-4 border-t border-text-primary/10">
              <button 
                class="btn-secondary text-sm" 
                onclick="this.copyBibtex('${paper.bibtex.replace(/'/g, "\\'")}')"
              >
                Copy BibTeX
              </button>
              
              ${paper.code ? `<a href="${paper.code}" class="btn-primary text-sm">View Code</a>` : ''}
              
              ${paper.pdf ? `<a href="${paper.pdf}" class="btn-secondary text-sm" target="_blank">Read Paper</a>` : ''}
            </div>
          </div>
        </article>
      `).join('');
    } catch (error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-text-primary/60">Failed to load research papers</p>
        </div>
      `;
    }
  }

  async copyBibtex(bibtex) {
    try {
      await navigator.clipboard.writeText(bibtex);
      
      // Show feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('bg-green-600');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy BibTeX:', error);
    }
  }

  destroy() {
    if (this.background) {
      disposeMeshPulseBackground(this.background);
    }
  }
}

// Make copyBibtex available globally
window.copyBibtex = async function(bibtex) {
  const researchPage = window.researchPage;
  if (researchPage) {
    await researchPage.copyBibtex(bibtex);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.researchPage = new ResearchPage();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.researchPage) {
    window.researchPage.destroy();
  }
});
