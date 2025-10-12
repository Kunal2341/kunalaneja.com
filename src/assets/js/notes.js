// Notes page script
import { initMeshPulseBackground, disposeMeshPulseBackground } from '../../bg/mesh-pulse';

class NotesPage {
  constructor() {
    this.background = null;
    this.init();
  }

  async init() {
    this.initBackground();
    await this.loadNotes();
  }

  initBackground() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    try {
      this.background = initMeshPulseBackground(canvas, {
        lineColor: '#A78BFA',
        baseAmp: 5.0,
        noiseAmp: 2.5,
        pulseFreq: 10.0,
        gridSize: 18.0,
        lineAlpha: 0.06
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

  async loadNotes() {
    const container = document.getElementById('notes-grid');
    if (!container) return;

    try {
      const response = await fetch('/src/data/notes.json');
      const notes = await response.json();
      
      container.innerHTML = notes.map(note => `
        <article class="card mb-8 group">
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h2 class="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-2 transition-colors">
                  <a href="/notes/${note.slug}/">${note.title}</a>
                </h2>
                
                <div class="flex items-center gap-4 mb-3">
                  <time class="text-text-primary/60 text-sm">${new Date(note.date).toLocaleDateString()}</time>
                  <div class="flex gap-2">
                    ${note.tags.map(tag => `
                      <span class="tag-secondary">${tag}</span>
                    `).join('')}
                  </div>
                </div>
                
                <p class="text-text-primary/80 leading-relaxed">${note.excerpt}</p>
              </div>
            </div>
            
            <div class="pt-4 border-t border-text-primary/10">
              <a href="/notes/${note.slug}/" class="text-accent-2 hover:text-accent-2/80 font-medium text-sm">
                Read more →
              </a>
            </div>
          </div>
        </article>
      `).join('');
    } catch (error) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-text-primary/60">Failed to load notes</p>
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
  window.notesPage = new NotesPage();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.notesPage) {
    window.notesPage.destroy();
  }
});
