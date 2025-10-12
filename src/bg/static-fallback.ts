// Static fallback for when WebGL and Canvas 2D are not available
export function createStaticFallback(canvas: HTMLCanvasElement): void {
  // Create a static mesh pattern using CSS
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  
  // Set a dark gradient background
  canvas.style.background = `
    linear-gradient(135deg, #0B0D10 0%, #1a1f2e 100%),
    radial-gradient(circle at 20% 80%, rgba(96, 165, 250, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)
  `;
  
  // Add a subtle mesh pattern using CSS
  canvas.style.backgroundImage = `
    linear-gradient(90deg, rgba(96, 165, 250, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(96, 165, 250, 0.1) 1px, transparent 1px),
    linear-gradient(135deg, #0B0D10 0%, #1a1f2e 100%)
  `;
  canvas.style.backgroundSize = '50px 50px, 50px 50px, 100% 100%';
  canvas.style.backgroundPosition = '0 0, 0 0, 0 0';
}

// Create a static mesh image as base64 for no-JS fallback
export const staticMeshImage = `data:image/svg+xml;base64,${btoa(`
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="mesh" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 20 0 M 0 0 L 0 20" stroke="#60A5FA" stroke-width="0.5" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#0B0D10"/>
  <rect width="100%" height="100%" fill="url(#mesh)"/>
</svg>
`)}`;

// Apply static fallback to canvas
export function applyStaticFallback(canvasId: string): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (canvas) {
    createStaticFallback(canvas);
  }
}
