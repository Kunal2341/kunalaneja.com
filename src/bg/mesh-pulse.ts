// WebGL Mesh Pulse Background
// Implements procedural fabric mesh with periodic signal pulses

interface MeshPulseConfig {
  lineColor: string;
  baseAmp: number;
  noiseAmp: number;
  pulseFreq: number;
  gridSize: number;
  lineAlpha: number;
}

interface Pulse {
  x: number;
  y: number;
  time: number;
  intensity: number;
}

export class MeshPulseBackground {
  private canvas: HTMLCanvasElement;
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private config: MeshPulseConfig;
  private animationId: number | null = null;
  private startTime!: number;
  private pulses: Pulse[] = [];
  private lastPulseTime: number = 0;
  private reducedMotion: boolean = false;
  private isVisible: boolean = true;

  // Vertex and fragment shaders
  private vertexShaderSource = `
    attribute vec2 position;
    attribute vec2 uv;
    uniform float time;
    uniform float gridSize;
    uniform float baseAmp;
    uniform float noiseAmp;
    uniform vec2 resolution;
    uniform vec2 pulseCenters[10];
    uniform float pulseTimes[10];
    uniform float pulseIntensities[10];
    
    // Simple noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 gridPos = position * gridSize;
      
      // Base sine wave displacement
      float baseDisplacement = baseAmp * (
        sin(gridPos.x * 0.1 + time * 0.5) * 
        sin(gridPos.y * 0.15 + time * 0.3)
      );
      
      // Fractal noise displacement
      float noiseDisplacement = noiseAmp * smoothNoise(gridPos * 0.02 + time * 0.1);
      
      // Pulse effects
      float pulseDisplacement = 0.0;
      for (int i = 0; i < 10; i++) {
        if (pulseIntensities[i] > 0.0) {
          float dist = distance(gridPos, pulseCenters[i]);
          float pulseRadius = (time - pulseTimes[i]) * 50.0;
          float pulseEffect = exp(-dist / pulseRadius) * pulseIntensities[i];
          pulseDisplacement += pulseEffect * 20.0;
        }
      }
      
      float totalDisplacement = baseDisplacement + noiseDisplacement + pulseDisplacement;
      vec2 displacedPos = gridPos + vec2(totalDisplacement, totalDisplacement * 0.5);
      
      gl_Position = vec4(
        (displacedPos / resolution) * 2.0 - 1.0,
        0.0,
        1.0
      );
    }
  `;

  private fragmentShaderSource = `
    precision mediump float;
    
    uniform float time;
    uniform float lineAlpha;
    uniform vec3 lineColor;
    uniform vec2 resolution;
    uniform vec2 pulseCenters[10];
    uniform float pulseTimes[10];
    uniform float pulseIntensities[10];
    
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      
      // Grid lines
      vec2 grid = abs(fract(uv * 50.0) - 0.5);
      float lineWidth = 0.02;
      float gridLine = smoothstep(0.0, lineWidth, min(grid.x, grid.y));
      
      // Pulse brightness effect
      float pulseBrightness = 0.0;
      for (int i = 0; i < 10; i++) {
        if (pulseIntensities[i] > 0.0) {
          float dist = distance(gl_FragCoord.xy, pulseCenters[i] * resolution);
          float pulseRadius = (time - pulseTimes[i]) * 50.0;
          float pulseEffect = exp(-dist / (pulseRadius * 0.5)) * pulseIntensities[i];
          pulseBrightness += pulseEffect * 0.5;
        }
      }
      
      float alpha = (1.0 - gridLine) * lineAlpha + pulseBrightness;
      gl_FragColor = vec4(lineColor, alpha);
    }
  `;

  constructor(canvas: HTMLCanvasElement, config: Partial<MeshPulseConfig> = {}) {
    this.canvas = canvas;
    this.config = {
      lineColor: '#60A5FA',
      baseAmp: 5.0,
      noiseAmp: 3.0,
      pulseFreq: 8.0, // seconds
      gridSize: 20.0,
      lineAlpha: 0.15,
      ...config
    };

    const gl = this.initWebGL();
    if (!gl) {
      console.warn('WebGL not supported, falling back to Canvas 2D');
      return;
    }
    this.gl = gl;

    this.program = this.createShaderProgram();
    this.setupGeometry();
    this.startTime = Date.now();

    // Check for reduced motion preference
    this.checkReducedMotion();
    
    // Handle visibility changes
    this.setupVisibilityHandlers();
    
    // Handle resize
    this.setupResizeHandler();
  }

  private initWebGL(): WebGLRenderingContext | null {
    const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return null;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.043, 0.051, 0.063, 1.0); // #0B0D10

    return gl;
  }

  private createShaderProgram(): WebGLProgram {
    const gl = this.gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
    }
    
    return program;
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  private setupGeometry(): void {
    const gl = this.gl;
    
    // Create grid vertices
    const gridSize = 100;
    const vertices: number[] = [];
    const uvs: number[] = [];
    
    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y <= gridSize; y++) {
        const u = x / gridSize;
        const v = y / gridSize;
        
        // Vertex position (normalized -1 to 1)
        vertices.push(u * 2 - 1, v * 2 - 1);
        uvs.push(u, v);
      }
    }
    
    // Create indices for line strips
    const indices: number[] = [];
    
    // Horizontal lines
    for (let y = 0; y <= gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        indices.push(y * (gridSize + 1) + x, y * (gridSize + 1) + x + 1);
      }
    }
    
    // Vertical lines
    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        indices.push(y * (gridSize + 1) + x, (y + 1) * (gridSize + 1) + x);
      }
    }
    
    // Create buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    // Store references
    (this.program as any).vertexBuffer = vertexBuffer;
    (this.program as any).uvBuffer = uvBuffer;
    (this.program as any).indexBuffer = indexBuffer;
    (this.program as any).indexCount = indices.length;
  }

  private checkReducedMotion(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mediaQuery.matches;
    
    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        this.stop();
      } else if (this.isVisible) {
        this.start();
      }
    });
  }

  private setupVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (!this.isVisible) {
        this.stop();
      } else if (!this.reducedMotion) {
        this.start();
      }
    });
  }

  private setupResizeHandler(): void {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    };
    
    window.addEventListener('resize', resize);
    resize();
  }

  private updatePulses(currentTime: number): void {
    // Remove expired pulses
    this.pulses = this.pulses.filter(pulse => currentTime - pulse.time < 3.0);
    
    // Add new pulses
    if (currentTime - this.lastPulseTime > this.config.pulseFreq) {
      this.pulses.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        time: currentTime,
        intensity: 1.0
      });
      this.lastPulseTime = currentTime;
    }
    
    // Update pulse intensities
    this.pulses.forEach(pulse => {
      const age = currentTime - pulse.time;
      pulse.intensity = Math.max(0, 1.0 - age / 3.0);
    });
  }

  private render(): void {
    if (this.reducedMotion || !this.isVisible) return;
    
    const gl = this.gl;
    const currentTime = (Date.now() - this.startTime) / 1000;
    
    this.updatePulses(currentTime);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    
    // Set uniforms
    const uniforms = {
      time: currentTime,
      gridSize: this.config.gridSize,
      baseAmp: this.config.baseAmp,
      noiseAmp: this.config.noiseAmp,
      resolution: [this.canvas.width, this.canvas.height],
      lineAlpha: this.config.lineAlpha,
      lineColor: this.hexToRgb(this.config.lineColor)
    };
    
    Object.entries(uniforms).forEach(([name, value]) => {
      const location = gl.getUniformLocation(this.program, name);
      if (location !== null) {
        if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2]);
          }
        } else {
          gl.uniform1f(location, value as number);
        }
      }
    });
    
    // Set pulse uniforms
    for (let i = 0; i < 10; i++) {
      const pulse = this.pulses[i] || { x: 0, y: 0, time: 0, intensity: 0 };
      gl.uniform2f(gl.getUniformLocation(this.program, `pulseCenters[${i}]`), pulse.x, pulse.y);
      gl.uniform1f(gl.getUniformLocation(this.program, `pulseTimes[${i}]`), pulse.time);
      gl.uniform1f(gl.getUniformLocation(this.program, `pulseIntensities[${i}]`), pulse.intensity);
    }
    
    // Set up vertex attributes
    const positionLocation = gl.getAttribLocation(this.program, 'position');
    const uvLocation = gl.getAttribLocation(this.program, 'uv');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, (this.program as any).vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, (this.program as any).uvBuffer);
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, (this.program as any).indexBuffer);
    gl.drawElements(gl.LINES, (this.program as any).indexCount, gl.UNSIGNED_SHORT, 0);
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0];
  }

  public start(): void {
    if (this.reducedMotion || !this.isVisible || this.animationId !== null) return;
    
    const animate = () => {
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
    const gl = this.gl;
    if (gl) {
      gl.deleteProgram(this.program);
      gl.deleteBuffer((this.program as any).vertexBuffer);
      gl.deleteBuffer((this.program as any).uvBuffer);
      gl.deleteBuffer((this.program as any).indexBuffer);
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.stop();
    } else if (this.isVisible) {
      this.start();
    }
  }
}

// Canvas 2D fallback
export class Canvas2DMeshPulse {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: MeshPulseConfig;
  private animationId: number | null = null;
  private startTime: number;
  private reducedMotion: boolean = false;
  private isVisible: boolean = true;

  constructor(canvas: HTMLCanvasElement, config: Partial<MeshPulseConfig> = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = {
      lineColor: '#60A5FA',
      baseAmp: 5.0,
      noiseAmp: 3.0,
      pulseFreq: 8.0,
      gridSize: 20.0,
      lineAlpha: 0.15,
      ...config
    };

    this.startTime = Date.now();
    this.setupResizeHandler();
  }

  private setupResizeHandler(): void {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    window.addEventListener('resize', resize);
    resize();
  }

  private render(): void {
    if (this.reducedMotion || !this.isVisible) return;
    
    const currentTime = (Date.now() - this.startTime) / 1000;
    const rect = this.canvas.getBoundingClientRect();
    
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    const gridSize = 30;
    const cellWidth = rect.width / gridSize;
    const cellHeight = rect.height / gridSize;
    
    this.ctx.strokeStyle = this.config.lineColor;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = this.config.lineAlpha;
    
    // Draw grid with displacement
    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y <= gridSize; y++) {
        const baseX = x * cellWidth;
        const baseY = y * cellHeight;
        
        // Simple displacement based on sine waves
        const displacement = Math.sin(baseX * 0.01 + currentTime) * Math.sin(baseY * 0.015 + currentTime * 0.8) * 10;
        
        if (x < gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(baseX + displacement, baseY);
          this.ctx.lineTo(baseX + cellWidth + displacement, baseY);
          this.ctx.stroke();
        }
        
        if (y < gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(baseX, baseY + displacement);
          this.ctx.lineTo(baseX, baseY + cellHeight + displacement);
          this.ctx.stroke();
        }
      }
    }
  }

  public start(): void {
    if (this.reducedMotion || !this.isVisible || this.animationId !== null) return;
    
    const animate = () => {
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
  }
}

// Main initialization function
export function initMeshPulseBackground(
  canvasEl: HTMLCanvasElement, 
  config: Partial<MeshPulseConfig> = {}
): MeshPulseBackground | Canvas2DMeshPulse {
  // Try WebGL first
  const gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl');
  if (gl) {
    return new MeshPulseBackground(canvasEl, config);
  } else {
    // Fallback to Canvas 2D
    return new Canvas2DMeshPulse(canvasEl, config);
  }
}

export function disposeMeshPulseBackground(background: MeshPulseBackground | Canvas2DMeshPulse): void {
  background.dispose();
}
