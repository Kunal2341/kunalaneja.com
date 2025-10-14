import React, { useEffect, useRef, useState } from "react";

/**
 * Agent Grid RL Background — subtle variant with trails + slight 3D tilt
 * - Canvas draws flowing grid with ripple-driven warps
 * - RL agents leave neon trails and seek a moving goal
 * - Pointer causes big ripples (click) and subtle 3D tilt (rotateX/Y)
 *
 * Controls:
 *  - Click / tap: spawn a BIG ripple pulse at cursor
 *  - [R]: toggle random-walk overlay
 *  - [F]: toggle flocking bias
 *  - [G]: toggle goal marker visibility (shown by default)
 */

type Props = { children?: React.ReactNode };

export default function AgentGridRLBackground({ children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const goalRef = useRef<{x: number, y: number} | null>(null);
  const gridRef = useRef<{nx: number, ny: number} | null>(null);
  
  // Live statistics state
  const [stats, setStats] = useState({
    totalGoals: 0,
    totalSteps: 0,
    averageEpsilon: 0,
    qTableSize: 0,
    agentsActive: 0,
    learningRate: 0,
    sessionTime: 0,
    goalsPerMinute: 0,
    explorationRate: 0,
    bestAgentScore: 0,
    averageReward: 0
  });

  // Control parameters state
  const [controls, setControls] = useState({
    stepSpeed: 1, // RL_STEPS multiplier (1x = comfortable default speed)
    learningRate: 0.22, // alpha (fixed)
    explorationRate: 0.20, // initial epsilon (fixed)
    goalSpeed: 0.015, // goal movement speed (slower for different screens)
    autoSpawnRate: 3000, // milliseconds between auto-spawns (fixed)
    rewardMode: 0, // 0=basic, 1=advanced, 2=crazy
  });

  // Pause state
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Tunables for subtle vibe ---
    const MAX_RIPPLE = 45;            // allow larger user pulses
    const BG_WARP_AMP = 15;            // base warp amplitude (subtle but flowing)
    let RL_STEPS = controls.stepSpeed * 0.3; // dynamic agent motion speed (0.5x default = 0.15x actual)
    const AUTOPULSE_PERIOD = 7.5;     // seconds between quiet auto pulses

    // Trail settings
    const TRAIL_MAX = 70;             // max stored points per agent
    const AGENT_RADIUS = 8.5;         // much larger visible agent
    const TRAIL_WIDTH_MIN = 1.5;      // at head: width grows
    const TRAIL_WIDTH_MAX = 4.5;      // near head
    const TRAIL_ALPHA_MIN = 0.06;     // far history
    const TRAIL_ALPHA_MAX = 0.35;     // recent history

    // --- Sizing / DPI ---
    const DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    let W = 0, H = 0;
    function resize() {
      if (!canvas || !ctx) return;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // --- Grid + RL world params ---
    const cellPx = 32; // slightly larger cells for calmer look
    let nx = Math.max(8, Math.floor(W / cellPx));
    let ny = Math.max(6, Math.floor(H / cellPx));
    gridRef.current = { nx, ny };

    // Shared Q-table: (ny * nx * 4 actions)
    let Q = new Float32Array(nx * ny * 4);
    const A_UP = 0, A_RIGHT = 1, A_DOWN = 2, A_LEFT = 3;
    const ACTIONS = [A_UP, A_RIGHT, A_DOWN, A_LEFT] as const;

    function sIndex(x: number, y: number) { return (y * nx + x) * 4; }

    // Agents (subtle: few)
    const AGENT_COUNT = 5; // set to 1 if you want literally one agent
    const agentColors = [200, 240, 280, 320, 360]; // distinct color hues for each agent
    const agents = Array.from({ length: AGENT_COUNT }, (_, i) => ({
      x: Math.floor(Math.random() * nx),
      y: Math.floor(Math.random() * ny),
      eps: 0.20 + Math.random() * 0.25, // slightly less exploration to reduce jitter
      alpha: 0.22, // learning rate
      gamma: 0.96, // discount
      modeChaos: false,
      modeFlock: true,
      colorHue: agentColors[i], // each agent gets a distinct color
      trail: [] as Array<{x:number,y:number}>,       // history in grid coords
      goalsReached: 0, // track individual agent performance
      steps: 0, // track steps taken by this agent
      totalReward: 0, // track cumulative reward
      birthTime: performance.now(), // Track when agent was created
      lifespan: 40000, // 40 seconds in milliseconds
      isSpawned: false, // Mark as initial agent (permanent)
      speedBoost: false, // Speed boost mode
      originalEps: 0.2, // Store original epsilon for speed boost
      originalAlpha: 0.22, // Store original alpha for speed boost
    }));
    
    // Global statistics tracking
    let globalStats = {
      totalGoals: 0,
      totalSteps: 0,
      sessionStartTime: performance.now(),
      lastGoalTime: 0,
      qTableUpdates: 0,
      explorationSteps: 0,
      exploitationSteps: 0,
      flockCenterX: 0,
      flockCenterY: 0,
      agentUpdateAccumulator: 0,
    };

    // Moving goal (single shared), shown by default
    if (!goalRef.current) {
      goalRef.current = { x: Math.max(2, Math.min(nx - 3, Math.floor(nx * 0.5))), y: Math.max(2, Math.min(ny - 3, Math.floor(ny * 0.5))) };
    }
    const goal = goalRef.current;
    let goalVelocity = { dx: controls.goalSpeed, dy: controls.goalSpeed * 0.8 }; // dynamic movement speed
    let showGoal = true;
    
    // Auto-spawn timer
    let lastSpawnTime = 0;
    let SPAWN_INTERVAL = controls.autoSpawnRate; // dynamic spawn interval

    // Ripples
    type Ripple = { x: number, y: number, t: number, amp: number, speed: number, decay: number };
    const ripples: Ripple[] = [];

    // Pointer for interactivity
    const pointer = { x: W * 0.5, y: H * 0.5, active: false };

    // Keyboard toggles
    const onKey = (e: KeyboardEvent) => {
      // Only handle our keys if not typing in an input field
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Prevent default behavior for our keys
      if (e.key === "Escape") {
        e.preventDefault();
        setShowInfoModal(false);
        return;
      }
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        showGoal = !showGoal;
        // console.log("Goal visibility toggled:", showGoal);
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const newChaosMode = !agents[0]?.modeChaos;
        agents.forEach(a => a.modeChaos = newChaosMode);
        // console.log("Chaos mode toggled:", newChaosMode);
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        const newFlockMode = !agents[0]?.modeFlock;
        agents.forEach(a => a.modeFlock = newFlockMode);
        // console.log("Flocking mode toggled:", newFlockMode);
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        // Toggle speed boost mode
        const isCurrentlyBoosted = agents[0]?.speedBoost || false;
        agents.forEach(a => {
          a.speedBoost = !isCurrentlyBoosted;
          if (a.speedBoost) {
            a.originalEps = a.eps;
            a.originalAlpha = a.alpha;
            a.eps = Math.min(0.8, a.eps * 1.5); // Increase exploration
            a.alpha = Math.min(0.5, a.alpha * 1.3); // Increase learning
          } else {
            a.eps = a.originalEps || a.eps;
            a.alpha = a.originalAlpha || a.alpha;
          }
        });
        // console.log("Speed boost toggled:", !isCurrentlyBoosted);
      }
    };
    
    // Add keyboard event listener with capture to ensure it works
    document.addEventListener("keydown", onKey, true);

    // Mouse / touch pulses
    const emitPulse = (x: number, y: number, strength = 1) => {
      ripples.push({ x, y, t: performance.now() * 0.001, amp: 10 * strength, speed: 260, decay: 1.8 });
      // Clamp ripple list
      if (ripples.length > 48) ripples.splice(0, ripples.length - 48);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left);
      pointer.y = (e.clientY - rect.top);
      pointer.active = true;

      // tiny 3D tilt via CSS transform (not applied to children)
      const nx = (pointer.x / Math.max(1, rect.width)) * 2 - 1; // -1..1
      const ny = (pointer.y / Math.max(1, rect.height)) * 2 - 1;
      const maxDeg = 3.0;
      const rx = (-ny * maxDeg).toFixed(3);
      const ry = (nx * maxDeg).toFixed(3);
      canvas.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onLeave = () => { pointer.active = false; canvas.style.transform = ""; };
    const onDown = (e: MouseEvent) => {
      // Only check for specific interactive UI elements, not the canvas or background
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      
      // Only prevent spawning if clicking on actual interactive elements (not canvas/background)
      const hasInteractiveElement = elementsAtPoint.some(el => {
        // Skip the canvas itself
        if (el.tagName === 'CANVAS') return false;
        
        const element = el as HTMLElement;
        
        // Skip elements with pointerEvents: none (these should allow background clicks)
        if (element.style?.pointerEvents === 'none') return false;
        
        // Skip divs, headers, and other structural elements unless they have specific interactive properties
        if (['DIV', 'HEADER', 'MAIN', 'SECTION', 'ARTICLE', 'FOOTER', 'NAV'].includes(el.tagName)) {
          // Skip elements with noop onclick handlers (common in React/libraries)
          const hasOnclick = element.onclick;
          if (hasOnclick && hasOnclick.name === 'noop') return false;
          
          // Skip our own content div that has the onMouseDown handler for event delegation
          if (el.className === 'relative z-10') return false;
          
          // Only consider these interactive if they have direct interactive attributes or styles
          const hasRole = element.getAttribute('role') === 'button';
          const hasTabindex = element.getAttribute('tabindex') !== null;
          const hasOnclickAttr = element.getAttribute('onclick') !== null;
          
          return hasOnclick || hasRole || hasTabindex || hasOnclickAttr;
        }
        
        // Check for truly interactive elements
        return el.tagName === 'BUTTON' || 
               el.tagName === 'INPUT' || 
               el.tagName === 'SELECT' ||
               el.tagName === 'A' ||
               el.closest('button') ||
               el.closest('input') ||
               el.closest('select') ||
               el.closest('a[href]') ||
               el.closest('[role="button"]') ||
               el.closest('.modal') ||
               el.closest('[data-modal]') ||
               element.onclick;
      });
      
      if (hasInteractiveElement) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      emitPulse(x, y, 2.2); // BIG user pulse
      
      // Create new agent at click location
      const spacingX = W / nx;
      const spacingY = H / ny;
      const gridX = Math.floor(x / spacingX);
      const gridY = Math.floor(y / spacingY);
      
      // Ensure the new agent is within bounds
      const clampedX = Math.max(0, Math.min(nx - 1, gridX));
      const clampedY = Math.max(0, Math.min(ny - 1, gridY));
      
      
      // Create new agent with random properties
      const newAgent = {
        x: clampedX,
        y: clampedY,
        eps: controls.explorationRate + Math.random() * 0.25,
        alpha: controls.learningRate,
        gamma: 0.96,
        modeChaos: false,
        modeFlock: true,
        colorHue: 180 + Math.floor(Math.random() * 120), // blue to purple range (180-300 degrees)
        trail: [] as Array<{x:number,y:number}>,
        goalsReached: 0,
        steps: 0,
        totalReward: 0,
        birthTime: performance.now(), // Track when agent was created
        lifespan: 40000, // 40 seconds in milliseconds (only applies if >5 agents)
        isSpawned: true, // Mark as user-spawned (not initial)
        speedBoost: false, // Speed boost mode
        originalEps: controls.explorationRate + Math.random() * 0.25, // Store original epsilon
        originalAlpha: controls.learningRate, // Store original alpha
      };
      
      // Check if we're at the 12 agent limit
      if (agents.length >= 12) {
        // Remove the oldest agent (first in array)
        const removedAgent = agents.shift();
        if (removedAgent) {
          // Add a pulse at the removed agent's location
          emitPulse(removedAgent.x * (W / nx) + (W / nx) / 2, removedAgent.y * (H / ny) + (H / ny) / 2, 0.8);
        }
      }
      
      agents.push(newAgent);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      
      // Only check for specific interactive UI elements, not the canvas or background
      const elementsAtPoint = document.elementsFromPoint(t.clientX, t.clientY);
      
      // Only prevent spawning if touching actual interactive elements (not canvas/background)
      const hasInteractiveElement = elementsAtPoint.some(el => {
        // Skip the canvas itself
        if (el.tagName === 'CANVAS') return false;
        
        // Skip elements with pointerEvents: none (these should allow background touches)
        const element = el as HTMLElement;
        if (element.style?.pointerEvents === 'none') return false;
        
        // Skip divs, headers, and other structural elements unless they have specific interactive properties
        if (['DIV', 'HEADER', 'MAIN', 'SECTION', 'ARTICLE', 'FOOTER', 'NAV'].includes(el.tagName)) {
          // Only consider these interactive if they have specific interactive attributes or styles
          if (element.onclick || 
              element.getAttribute('role') === 'button' ||
              element.closest('button') ||
              element.closest('a[href]') ||
              element.closest('[role="button"]')) {
            return true;
          }
          return false; // Skip structural elements
        }
        
        // Check for truly interactive elements
        return el.tagName === 'BUTTON' || 
               el.tagName === 'INPUT' || 
               el.tagName === 'SELECT' ||
               el.tagName === 'A' ||
               el.closest('button') ||
               el.closest('input') ||
               el.closest('select') ||
               el.closest('a[href]') ||
               el.closest('[role="button"]') ||
               el.closest('.modal') ||
               el.closest('[data-modal]') ||
               element.onclick;
      });
      
      if (hasInteractiveElement) {
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      emitPulse(x, y, 2.4);
      
      // Create new agent at touch location (same logic as mouse click)
      const spacingX = W / nx;
      const spacingY = H / ny;
      const gridX = Math.floor(x / spacingX);
      const gridY = Math.floor(y / spacingY);
      
      const clampedX = Math.max(0, Math.min(nx - 1, gridX));
      const clampedY = Math.max(0, Math.min(ny - 1, gridY));
      
      const newAgent = {
        x: clampedX,
        y: clampedY,
        eps: controls.explorationRate + Math.random() * 0.25,
        alpha: controls.learningRate,
        gamma: 0.96,
        modeChaos: false,
        modeFlock: true,
        colorHue: 180 + Math.floor(Math.random() * 120), // blue to purple range (180-300 degrees)
        trail: [] as Array<{x:number,y:number}>,
        goalsReached: 0,
        steps: 0,
        totalReward: 0,
        birthTime: performance.now(),
        lifespan: 40000,
        isSpawned: true,
        speedBoost: false,
        originalEps: controls.explorationRate + Math.random() * 0.25,
        originalAlpha: controls.learningRate,
      };
      
      agents.push(newAgent);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true } as any);
    
    // Debug: Log that event listeners are attached

    // Periodic auto pulse (gentle and rare)
    let autoPulseT = 0;

    // Simple helpers
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const randint = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

    function clampTrail<T>(arr: T[]) {
      const excess = arr.length - TRAIL_MAX;
      if (excess > 0) arr.splice(0, excess);
    }

    function moveGoal() {
      goal.x = randint(1, nx - 2);
      goal.y = randint(1, ny - 2);
      emitPulse(goal.x * (W / nx) + (W / nx) / 2, goal.y * (H / ny) + (H / ny) / 2, 0.35); // tiny pulse
    }
    
    function updateGoalPosition() {
      // Update goal velocity based on controls
      goalVelocity.dx = controls.goalSpeed;
      goalVelocity.dy = controls.goalSpeed * 0.8;
      
      // Add small random changes to velocity occasionally
      if (Math.random() < 0.02) { // 2% chance each frame
        goalVelocity.dx += (Math.random() - 0.5) * 0.01;
        goalVelocity.dy += (Math.random() - 0.5) * 0.01;
        
        // Clamp velocity to reasonable range
        goalVelocity.dx = Math.max(-controls.goalSpeed * 2, Math.min(controls.goalSpeed * 2, goalVelocity.dx));
        goalVelocity.dy = Math.max(-controls.goalSpeed * 2, Math.min(controls.goalSpeed * 2, goalVelocity.dy));
      }
      
      // Update goal position with velocity
      goal.x += goalVelocity.dx;
      goal.y += goalVelocity.dy;
      
      // Bounce off edges with some randomness - fixed boundary logic
      if (goal.x <= 1) {
        goalVelocity.dx = Math.abs(goalVelocity.dx) * (0.8 + Math.random() * 0.4); // ensure positive velocity
        goal.x = 1;
      } else if (goal.x >= nx - 2) {
        goalVelocity.dx = -Math.abs(goalVelocity.dx) * (0.8 + Math.random() * 0.4); // ensure negative velocity
        goal.x = nx - 2;
      }
      
      if (goal.y <= 1) {
        goalVelocity.dy = Math.abs(goalVelocity.dy) * (0.8 + Math.random() * 0.4); // ensure positive velocity
        goal.y = 1;
      } else if (goal.y >= ny - 2) {
        goalVelocity.dy = -Math.abs(goalVelocity.dy) * (0.8 + Math.random() * 0.4); // ensure negative velocity
        goal.y = ny - 2;
      }
    }

    // Policy helpers
    function argmax4(q0: number, q1: number, q2: number, q3: number) {
      const m = Math.max(q0, q1, q2, q3);
      const idx: number[] = [];
      if (q0 === m) idx.push(0);
      if (q1 === m) idx.push(1);
      if (q2 === m) idx.push(2);
      if (q3 === m) idx.push(3);
      return idx[(Math.random() * idx.length) | 0];
    }

    function stepAgent(a: typeof agents[number]) {
      // (Re-)dimension safeguard
      if (!canvas) return;
      const expectedNx = Math.max(8, Math.floor(canvas.clientWidth / cellPx));
      const expectedNy = Math.max(6, Math.floor(canvas.clientHeight / cellPx));
      if (expectedNx !== nx || expectedNy !== ny) {
        nx = expectedNx; ny = expectedNy;
        Q = new Float32Array(nx * ny * 4);
        a.x = clamp(a.x, 0, nx - 1);
        a.y = clamp(a.y, 0, ny - 1);
        a.trail.length = 0; // reset trail on significant grid change to avoid jumps
        moveGoal();
      }

      // Flocking bias (soft) - optimized with cached center of mass
      let flockBias = { dx: 0, dy: 0 };
      if (a.modeFlock && globalStats.flockCenterX !== undefined) {
        flockBias.dx = (globalStats.flockCenterX - a.x) * 0.02;
        flockBias.dy = (globalStats.flockCenterY - a.y) * 0.02;
      }

      // Optional chaos overlay
      const chaosDx = a.modeChaos ? (Math.random() - 0.5) * 0.15 : 0;
      const chaosDy = a.modeChaos ? (Math.random() - 0.5) * 0.15 : 0;

      // Epsilon-greedy action
      const si = sIndex(a.x, a.y);
      const q0 = Q[si + 0], q1 = Q[si + 1], q2 = Q[si + 2], q3 = Q[si + 3];
      const explore = Math.random() < a.eps;
      let act = explore ? ACTIONS[(Math.random() * 4) | 0] : argmax4(q0, q1, q2, q3);

      // Track exploration vs exploitation
      if (explore) {
        globalStats.explorationSteps++;
      } else {
        globalStats.exploitationSteps++;
      }

      let dx = 0, dy = 0;
      if (act === 0) dy = -1; else if (act === 1) dx = 1; else if (act === 2) dy = 1; else dx = -1;
      dx += flockBias.dx + chaosDx; dy += flockBias.dy + chaosDy;

      if (Math.abs(dx) > Math.abs(dy)) { dx = Math.sign(dx); dy = 0; }
      else if (Math.abs(dy) > 0) { dy = Math.sign(dy); dx = 0; }

      const oldX = a.x, oldY = a.y;
      const nxp = clamp(a.x + dx, 0, nx - 1);
      const nyp = clamp(a.y + dy, 0, ny - 1);

      // Rewards - Basic vs Advanced system
      let r = -0.01; // Small time penalty
      
      if (controls.rewardMode === 1) {
        // Advanced Reward System
        // Distance-based reward (closer to goal = higher reward)
        const goalGridX = Math.floor(goal.x + 0.5);
        const goalGridY = Math.floor(goal.y + 0.5);
        const distanceToGoal = Math.abs(nxp - goalGridX) + Math.abs(nyp - goalGridY);
        const maxDistance = nx + ny; // Manhattan distance across entire grid
        const distanceReward = (1.0 - distanceToGoal / maxDistance) * 0.05; // 0.05 max reward for being close
        
        // Wall penalty (stronger in advanced mode)
        if (nxp === 0 || nxp === nx - 1 || nyp === 0 || nyp === ny - 1) {
          r -= 0.2; // Stronger wall penalty
        }
        
        // Efficiency bonus (reward for taking fewer steps to reach goal)
        const efficiencyBonus = a.steps > 0 ? Math.max(0, 0.025 - (a.steps * 0.0005)) : 0;
        
        r += distanceReward + efficiencyBonus;
      } else if (controls.rewardMode === 2) {
        // Crazy Reward System
        const goalGridX = Math.floor(goal.x + 0.5);
        const goalGridY = Math.floor(goal.y + 0.5);
        const distanceToGoal = Math.abs(nxp - goalGridX) + Math.abs(nyp - goalGridY);
        const maxDistance = nx + ny;
        
        // Multiple reward types
        const distanceReward = (1.0 - distanceToGoal / maxDistance) * 0.1; // 0.1 max
        const speedReward = a.steps > 0 ? Math.max(0, 0.03 - (a.steps * 0.0003)) : 0; // Speed bonus
        const explorationReward = Math.random() * 0.02; // Random exploration bonus
        const efficiencyBonus = a.steps > 0 ? Math.max(0, 0.05 - (a.steps * 0.0005)) : 0;
        
        // Multi-goal bonus (if reaching multiple goals quickly)
        const multiGoalBonus = a.goalsReached > 1 ? 0.15 : 0;
        
        if (nxp === 0 || nxp === nx - 1 || nyp === 0 || nyp === ny - 1) {
          r -= 0.5; // Much stronger wall penalty
        }
        
        r += distanceReward + speedReward + explorationReward + efficiencyBonus + multiGoalBonus;
      } else {
        // Basic Reward System
        if (nxp === 0 || nxp === nx - 1 || nyp === 0 || nyp === ny - 1) r -= 0.02;
      }
      
      // Check if agent reached goal (with tolerance for smooth movement)
      const goalGridX = Math.floor(goal.x + 0.5); // round to nearest grid cell
      const goalGridY = Math.floor(goal.y + 0.5);
      const reached = (nxp === goalGridX && nyp === goalGridY);
      if (reached) {
        r += controls.rewardMode === 0 ? 1.0 : controls.rewardMode === 1 ? 2.0 : 4.0; // Higher reward in advanced/crazy mode
        a.goalsReached++;
        globalStats.totalGoals++;
        globalStats.lastGoalTime = performance.now();
      }

      // TD update
      const sj = sIndex(nxp, nyp);
      const maxNext = Math.max(Q[sj + 0], Q[sj + 1], Q[sj + 2], Q[sj + 3]);
      const td = r + a.gamma * maxNext - Q[si + (act as number)];
      Q[si + (act as number)] += a.alpha * td;
      globalStats.qTableUpdates++;

      a.x = nxp; a.y = nyp;
      a.eps = Math.max(0.02, a.eps * 0.9995);
      a.steps++;
      a.totalReward += r;
      globalStats.totalSteps++;

      // Trail update (only on movement)
      if (a.x !== oldX || a.y !== oldY) {
        a.trail.push({ x: a.x, y: a.y });
        clampTrail(a.trail);
      }

      if (reached) {
        emitPulse(goal.x * (W / nx) + (W / nx) / 2, goal.y * (H / ny) + (H / ny) / 2, 0.6);
        moveGoal();
        
        // Mark agent for death - it will be removed and replaced
        (a as any).shouldDie = true;
      }
    }

    // Background grid warp fields ------------------------------------------
    // Cache for baseWaves to reduce trigonometric calculations
    let baseWavesCache: Map<string, number> = new Map();
    let lastCacheTime = 0;
    const CACHE_DURATION = 0.1; // Update cache every 100ms instead of every frame
    
    function baseWaves(x: number, y: number, t: number) {
      // Only recalculate cache every CACHE_DURATION seconds
      if (t - lastCacheTime > CACHE_DURATION) {
        baseWavesCache.clear();
        lastCacheTime = t;
      }
      
      // Create cache key with reduced precision to increase cache hits
      const key = `${Math.floor(x/50)}_${Math.floor(y/50)}`;
      
      if (baseWavesCache.has(key)) {
        return baseWavesCache.get(key)!;
      }
      
      // Slower, calmer base motion (still flowing)
      const kx = 0.0030, ky = 0.0022; // wavelengths
      const wx = 0.25, wy = -0.22;    // angular velocities (slow)
      const result = Math.sin(x * kx + t * wx) * 1.1 + Math.sin(y * ky + t * wy) * 0.9;
      
      baseWavesCache.set(key, result);
      return result;
    }

    function rippleField(x: number, y: number, t: number) {
      let acc = 0;
      for (let i = 0; i < ripples.length; i++) {
        const R = ripples[i];
        const dt = Math.max(0, t - R.t);
        const dx = x - R.x, dy = y - R.y;
        const dist = Math.hypot(dx, dy) + 1e-3;
        const phase = (dist - (R.speed * dt)) * 0.05; // tighter rings
        const env = Math.exp(-dt * R.decay) * (1 / (1 + 0.0025 * dist));
        acc += Math.sin(phase) * R.amp * env;
      }
      return Math.max(-MAX_RIPPLE, Math.min(MAX_RIPPLE, acc));
    }

    function depthFactor(y: number) {
      const v = y / Math.max(1, H);
      return Math.pow(v, 1.2);
    }

    // Draw grid as warped polylines ----------------------------------------
    // Cache gradients to avoid recreating every frame
    let cachedVerticalGradient: CanvasGradient | null = null;
    let cachedHorizontalGradient: CanvasGradient | null = null;
    let lastGradientWidth = 0;
    let lastGradientHeight = 0;
    
    function drawGrid(t: number) {
      if (!ctx) return;
      
      // Only recreate gradients if dimensions changed
      if (!cachedVerticalGradient || H !== lastGradientHeight) {
        cachedVerticalGradient = ctx.createLinearGradient(0, 0, 0, H);
        cachedVerticalGradient.addColorStop(0, "rgba(255, 110, 110, 0.65)");
        cachedVerticalGradient.addColorStop(0.5, "rgba(150, 120, 255, 0.8)");
        cachedVerticalGradient.addColorStop(1, "rgba(85, 220, 255, 0.65)");
        lastGradientHeight = H;
      }
      if (!cachedHorizontalGradient || W !== lastGradientWidth) {
        cachedHorizontalGradient = ctx.createLinearGradient(0, 0, W, 0);
        cachedHorizontalGradient.addColorStop(0, "rgba(255, 120, 180, 0.6)");
        cachedHorizontalGradient.addColorStop(0.45, "rgba(140, 200, 255, 0.8)");
        cachedHorizontalGradient.addColorStop(1, "rgba(120, 255, 210, 0.6)");
        lastGradientWidth = W;
      }
      
      // Fill background with solid black
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      // Recompute nx/ny in case of resize
      nx = Math.max(8, Math.floor(W / cellPx));
      ny = Math.max(6, Math.floor(H / cellPx));
      gridRef.current = { nx, ny };

      const spacingX = W / nx;
      const spacingY = H / ny;
      const amp = BG_WARP_AMP;
      const samples = 16; // reduced samples for better performance

      if (!ctx) return;
      
      // Set line properties once instead of per line
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Vertical lines (lighter strokes, lower alpha)
      for (let i = 0; i <= nx; i++) {
        const x0 = i * spacingX;
        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const f = s / samples;
          const y = f * H;
          const d = depthFactor(y);
          const field = baseWaves(x0, y, t) * amp * (0.45 + 0.9 * d) + rippleField(x0, y, t) * 0.045 * (1 + 1.3 * d);
          const px = x0 + field * (0.6 + 0.5 * d);
          const py = y;
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        if (!ctx) continue;
        ctx.strokeStyle = cachedVerticalGradient!;
        ctx.lineWidth = 0.8 + 1.4 * Math.pow(Math.abs(i - nx * 0.5) / (nx * 0.5), 0.7);
        ctx.globalAlpha = 0.65;
        ctx.stroke();
      }

      // Horizontal lines (lighter)
      for (let j = 0; j <= ny; j++) {
        const y0 = j * spacingY;
        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const f = s / samples;
          const x = f * W;
          const d = depthFactor(y0);
          const field = baseWaves(x, y0, t) * amp * (0.5 + 0.8 * d) + rippleField(x, y0, t) * 0.042 * (1 + 1.2 * d);
          const px = x;
          const py = y0 + field * (0.6 + 0.5 * d);
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        if (!ctx) continue;
        ctx.strokeStyle = cachedHorizontalGradient!;
        ctx.lineWidth = 0.8 + 1.8 * Math.pow(j / ny, 1.8);
        ctx.globalAlpha = 0.65;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Goal marker - bigger red target (optimized with fewer operations)
      if (showGoal && ctx) {
        const gx = goal.x * spacingX + spacingX / 2;
        const gy = goal.y * spacingY + spacingY / 2;
        const rad = 18 + 8 * Math.sin(t * 2.2); // bigger and more pulsing
        
        // Draw all circles in one batch to reduce state changes
        ctx.beginPath();
        // Outer ring
        ctx.arc(gx, gy, rad + 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 70, 70, 0.35)";
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Middle ring
        ctx.beginPath();
        ctx.arc(gx, gy, rad + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 95, 95, 0.6)";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Center circle
        ctx.beginPath();
        ctx.arc(gx, gy, rad, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 45, 45, 0.9)";
        ctx.fill();
      }
    }

    // Draw agents + glow trails -------------------------------------------
    function drawAgents(_t: number) {
      if (!ctx) return;
      const spacingX = W / nx;
      const spacingY = H / ny;

      const toPx = (gx: number, gy: number) => (
        [gx * spacingX + spacingX / 2, gy * spacingY + spacingY / 2] as const
      );

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const [ax, ay] = toPx(a.x, a.y);

        // Trail: draw faded polyline segments from old → recent (optimized)
        if (a.trail.length >= 2) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          
          // Draw all trail segments in one path for better performance
          for (let s = 1; s < a.trail.length; s++) {
            const p0 = a.trail[s - 1];
            const p1 = a.trail[s];
            const [x0, y0] = toPx(p0.x, p0.y);
            const [x1, y1] = toPx(p1.x, p1.y);
            const t = s / a.trail.length; // 0..1 (older..newer)
            const alpha = TRAIL_ALPHA_MIN + (TRAIL_ALPHA_MAX - TRAIL_ALPHA_MIN) * t;
            const width = TRAIL_WIDTH_MIN + (TRAIL_WIDTH_MAX - TRAIL_WIDTH_MIN) * t;
            
            ctx.strokeStyle = `hsla(${a.colorHue}, 100%, 65%, ${alpha})`;
            ctx.shadowBlur = 10 * t;
            ctx.shadowColor = `hsla(${a.colorHue}, 100%, 60%, ${alpha * 0.7})`;
            ctx.lineWidth = width;
            
            if (s === 1) ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
          }
          ctx.stroke();
        }

        // Agent body (larger) with enhanced glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(ax, ay, AGENT_RADIUS, 0, Math.PI * 2);
        ctx.shadowBlur = 25; // stronger glow
        ctx.shadowColor = `hsla(${a.colorHue}, 100%, 60%, 1.0)`;
        ctx.fillStyle = `hsla(${a.colorHue}, 100%, 75%, 0.9)`;
        ctx.globalCompositeOperation = "lighter";
        ctx.fill();
        ctx.restore();
      }
    }

    // --- Dev self-tests (run once) ----------------------------------------
    // (function runSelfTests() {
    //   const nearly = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
    //   const t0 = performance.now() * 0.001;

    //   // Test 1: rippleField should be 0 when no ripples are present
    //   const r0 = rippleField(100, 100, t0);
    //   console.assert(nearly(r0, 0), `rippleField(empty) expected 0, got ${r0}`);

    //   // Test 2: sIndex layout sanity
    //   console.assert(sIndex(0, 0) === 0, "sIndex(0,0) should be 0");
    //   console.assert(sIndex(1, 0) === 4, "sIndex(1,0) should be 4");
    //   console.assert(sIndex(0, 1) === nx * 4, "sIndex(0,1) should be nx*4");

    //   // Test 3: baseWaves finiteness
    //   const bw = baseWaves(10, 20, 0.5);
    //   console.assert(Number.isFinite(bw), "baseWaves should return a finite number");

    //   // Test 4: Agents initialized (2 by default)
    //   console.assert(agents.length === AGENT_COUNT, "agents.length mismatch");

    //   // Test 4b: showGoal default
    //   console.assert(showGoal === true, "showGoal should be true by default");

    //   // Test 4c: RL steps slowed
    //   console.assert(RL_STEPS === 0.15, "RL_STEPS should be 0.15 for slower motion (0.5x * 0.3)");

    //   // Test 5: Big-pulse clamp should not exceed MAX_RIPPLE
    //   ripples.push({ x: 200, y: 200, t: t0 - 0.05, amp: 22, speed: 260, decay: 1.8 });
    //   const rc = rippleField(200, 200, t0 + 0.10);
    //   console.assert(Math.abs(rc) <= MAX_RIPPLE + 1e-6, `ripple clamp failed: |${rc}| > ${MAX_RIPPLE}`);

    //   // Test 6: trail clamp
    //   const tmp: number[] = [];
    //   const TRAIL_MAX_LOCAL = 70;
    //   for (let i = 0; i < TRAIL_MAX_LOCAL + 15; i++) { tmp.push(i); if (tmp.length > TRAIL_MAX_LOCAL) tmp.splice(0, tmp.length - TRAIL_MAX_LOCAL); }
    //   console.assert(tmp.length <= TRAIL_MAX_LOCAL, `trail clamp failed: len=${tmp.length} > ${TRAIL_MAX_LOCAL}`);

    // })();

    // Statistics update function
    function updateStats() {
      const now = performance.now();
      const sessionTime = (now - globalStats.sessionStartTime) / 1000; // seconds
      const goalsPerMinute = globalStats.totalGoals / (sessionTime / 60);
      const averageEpsilon = agents.reduce((sum, a) => sum + a.eps, 0) / agents.length;
      const explorationRate = globalStats.explorationSteps / (globalStats.explorationSteps + globalStats.exploitationSteps) * 100;
      const bestAgentScore = Math.max(...agents.map(a => a.goalsReached));
      const averageReward = agents.reduce((sum, a) => sum + a.totalReward, 0) / agents.length;

      setStats({
        totalGoals: globalStats.totalGoals,
        totalSteps: globalStats.totalSteps,
        averageEpsilon: Math.round(averageEpsilon * 1000) / 1000,
        qTableSize: Q.length,
        agentsActive: agents.length,
        learningRate: controls.learningRate,
        sessionTime: Math.round(sessionTime),
        goalsPerMinute: Math.round(goalsPerMinute * 10) / 10,
        explorationRate: Math.round(explorationRate * 10) / 10,
        bestAgentScore,
        averageReward: Math.round(averageReward * 1000) / 1000
      });
    }

    // Function to spawn agents manually
    function spawnRandomAgent() {
      // No limits - spawn as many as you want!
      
      const spawnX = Math.floor(Math.random() * nx);
      const spawnY = Math.floor(Math.random() * ny);
      
      const newAgent = {
        x: spawnX,
        y: spawnY,
        eps: controls.explorationRate + Math.random() * 0.25,
        alpha: controls.learningRate,
        gamma: 0.96,
        modeChaos: false,
        modeFlock: true,
        colorHue: Math.floor(Math.random() * 360),
        trail: [] as Array<{x:number,y:number}>,
        goalsReached: 0,
        steps: 0,
        totalReward: 0,
        birthTime: performance.now(),
        lifespan: 40000,
        isSpawned: true,
        speedBoost: false,
        originalEps: controls.explorationRate + Math.random() * 0.25,
        originalAlpha: controls.learningRate,
      };
      
      agents.push(newAgent);
      
      // Add a pulse at spawn location
      emitPulse(spawnX * (W / nx) + (W / nx) / 2, spawnY * (H / ny) + (H / ny) / 2, 1.2);
    }

    // Main loop -------------------------------------------------------------
    let last = performance.now() * 0.001;
    let rafId = 0 as number | 0;

    function frame() {
      const now = performance.now() * 0.001;
      const dt = Math.min(0.05, now - last);
      const renderTime = isPaused ? last : now;
      
      // Always draw the grid, even when paused
      drawGrid(renderTime);
      
      // If paused, only draw the grid and stop here
      if (isPaused) {
        rafId = requestAnimationFrame(frame) as unknown as number;
        return;
      }
      
      last = now;

      // Periodic auto pulse near center to keep mesh breathing (gentle)
      autoPulseT += dt;
      if (autoPulseT > AUTOPULSE_PERIOD) {
        autoPulseT = 0;
        emitPulse(W * (0.35 + 0.3 * Math.random()), H * (0.3 + 0.4 * Math.random()), 0.25);
      }

      // Let pointer subtly influence ripples when active (rarer)
      if (pointer.active && Math.random() < 0.05) emitPulse(pointer.x, pointer.y, 0.25);

      // Auto-spawn new agents every few seconds (update interval dynamically)
      SPAWN_INTERVAL = controls.autoSpawnRate;
      if (now - lastSpawnTime > SPAWN_INTERVAL) {
        const spawnX = Math.floor(Math.random() * nx);
        const spawnY = Math.floor(Math.random() * ny);
        
        const newAgent = {
          x: spawnX,
          y: spawnY,
          eps: controls.explorationRate + Math.random() * 0.25,
          alpha: controls.learningRate,
          gamma: 0.96,
          modeChaos: false,
          modeFlock: true,
          colorHue: 180 + Math.floor(Math.random() * 120), // blue to purple range (180-300 degrees)
          trail: [] as Array<{x:number,y:number}>,
          goalsReached: 0,
          steps: 0,
          totalReward: 0,
          birthTime: performance.now(),
          lifespan: 40000,
          isSpawned: true, // Mark as auto-spawned
          speedBoost: false, // Speed boost mode
          originalEps: controls.explorationRate + Math.random() * 0.25, // Store original epsilon
          originalAlpha: controls.learningRate, // Store original alpha
        };
        
        // Check if we're at the 12 agent limit for auto-spawn
        if (agents.length >= 12) {
          // Remove the oldest agent (first in array)
          const removedAgent = agents.shift();
          if (removedAgent) {
            // Add a pulse at the removed agent's location
            emitPulse(removedAgent.x * (W / nx) + (W / nx) / 2, removedAgent.y * (H / ny) + (H / ny) / 2, 0.8);
          }
        }
        
        agents.push(newAgent);
        lastSpawnTime = now;
        
        // Add a small pulse at spawn location
        emitPulse(spawnX * (W / nx) + (W / nx) / 2, spawnY * (H / ny) + (H / ny) / 2, 1.0);
      }

      // Update goal position with smooth bouncing
      updateGoalPosition();

      // Safety check: Ensure we always have at least 5 agents
      if (agents.length < 5) {
        const needed = 5 - agents.length;
        for (let i = 0; i < needed; i++) {
          const spawnX = Math.floor(Math.random() * nx);
          const spawnY = Math.floor(Math.random() * ny);
          
          const safetyAgent = {
            x: spawnX,
            y: spawnY,
            eps: controls.explorationRate + Math.random() * 0.25,
            alpha: controls.learningRate,
            gamma: 0.96,
            modeChaos: false,
            modeFlock: true,
            colorHue: 180 + Math.floor(Math.random() * 120), // blue to purple range
            trail: [] as Array<{x:number,y:number}>,
            goalsReached: 0,
            steps: 0,
            totalReward: 0,
            birthTime: performance.now(),
            lifespan: 40000,
            isSpawned: false, // Mark as safety agent
            speedBoost: false,
            originalEps: controls.explorationRate + Math.random() * 0.25,
            originalAlpha: controls.learningRate,
          };
          
          agents.push(safetyAgent);
        }
      }

      // Calculate flock center once per frame (performance optimization)
      if (agents.length > 0) {
        let cx = 0, cy = 0;
        for (let k = 0; k < agents.length; k++) { 
          cx += agents[k].x; 
          cy += agents[k].y; 
        }
        globalStats.flockCenterX = cx / agents.length;
        globalStats.flockCenterY = cy / agents.length;
      }

      // RL: dynamic steps per frame based on controls and speed boost
      const speedBoostMultiplier = agents[0]?.speedBoost ? 3 : 1; // 3x speed when boosted
      RL_STEPS = controls.stepSpeed * 0.3 * speedBoostMultiplier; // 0.5x default = 0.15x actual speed
      
      // Use accumulator for consistent agent updates (better than random)
      globalStats.agentUpdateAccumulator = (globalStats.agentUpdateAccumulator || 0) + RL_STEPS;
      if (globalStats.agentUpdateAccumulator >= 1) {
        const updateCount = Math.floor(globalStats.agentUpdateAccumulator);
        globalStats.agentUpdateAccumulator -= updateCount;
        
        for (let i = 0; i < updateCount; i++) {
          agents.forEach(stepAgent);
        }
      }
      
      // Handle agent death and replacement
      const currentTime = performance.now();
      
      // Remove agents that should die (reached goal or expired)
      for (let i = agents.length - 1; i >= 0; i--) {
        const agent = agents[i];
        let shouldRemove = false;
        
        // Remove if agent reached goal (shouldDie flag)
        if ((agent as any).shouldDie) {
          shouldRemove = true;
        }
        
        // Remove if agent is older than 40 seconds AND there are more than 5 agents
        const age = currentTime - agent.birthTime;
        if (age > agent.lifespan && agents.length > 5) {
          shouldRemove = true;
        }
        
        if (shouldRemove) {
          agents.splice(i, 1);
          
          // If we removed an agent and still have >= 5 agents, spawn a replacement
          if (agents.length >= 5) {
            const spawnX = Math.floor(Math.random() * nx);
            const spawnY = Math.floor(Math.random() * ny);
            
            const replacementAgent = {
              x: spawnX,
              y: spawnY,
              eps: controls.explorationRate + Math.random() * 0.25,
              alpha: controls.learningRate,
              gamma: 0.96,
              modeChaos: false,
              modeFlock: true,
              colorHue: 180 + Math.floor(Math.random() * 120), // blue to purple range
              trail: [] as Array<{x:number,y:number}>,
              goalsReached: 0,
              steps: 0,
              totalReward: 0,
              birthTime: currentTime,
              lifespan: 40000,
              isSpawned: true,
              speedBoost: false, // Speed boost mode
              originalEps: controls.explorationRate + Math.random() * 0.25, // Store original epsilon
              originalAlpha: controls.learningRate, // Store original alpha
            };
            
            agents.push(replacementAgent);
            
            // Add a pulse at spawn location
            emitPulse(spawnX * (W / nx) + (W / nx) / 2, spawnY * (H / ny) + (H / ny) / 2, 1.0);
          }
        }
      }

      // Update statistics every 30 frames (roughly 0.5 seconds at 60fps)
      if (Math.floor(now * 60) % 30 === 0) {
        updateStats();
      }

      // Draw agents (grid already drawn at the beginning of frame)
      drawAgents(now);

      rafId = requestAnimationFrame(frame) as unknown as number;
    }

    rafId = requestAnimationFrame(frame) as unknown as number;

    // Expose functions to the component scope
    // (window as any).spawnRandomAgent = spawnRandomAgent;
    
    // Debug: Add a simple click test
    // (window as any).testCanvasClick = () => {
    //   const testEvent = new MouseEvent('mousedown', {
    //     clientX: 100,
    //     clientY: 100,
    //     bubbles: true,
    //     cancelable: true
    //   });
    //   onDown(testEvent);
    // };
    

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKey, true);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onTouchStart as any);
      canvas.style.transform = "";
      // delete (window as any).spawnRandomAgent;
      // delete (window as any).testCanvasClick;
    };
  }, [controls, isPaused]);

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed background canvas - behind everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full block will-change-transform"
        style={{ pointerEvents: "auto", zIndex: -1 }}
        aria-hidden="true"
      />

      {/* Slot your site content above the animated background */}
      <div 
        className="relative z-10" 
        style={{ pointerEvents: "none" }}
        onMouseDown={(e) => {
          // If clicking on an area with pointerEvents: none, forward the event to canvas
          const canvas = canvasRef.current;
          if (canvas) {
            // Create a synthetic event for the canvas
            const syntheticEvent = new MouseEvent('mousedown', {
              clientX: e.clientX,
              clientY: e.clientY,
              bubbles: true,
              cancelable: true,
              view: window,
              detail: e.detail,
              screenX: e.screenX,
              screenY: e.screenY,
              button: e.button,
              buttons: e.buttons
            });
            
            // Dispatch to canvas
            canvas.dispatchEvent(syntheticEvent);
          }
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          {children}
        </div>
      </div>

      {/* Control buttons */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2">
        {/* Pause button */}
        <button 
          onClick={() => {
            const newPausedState = !isPaused;
            setIsPaused(newPausedState);
            
            // Move goal to bottom left when pausing
            if (newPausedState && goalRef.current && gridRef.current) {
              goalRef.current.x = 2; // Left side
              goalRef.current.y = gridRef.current.ny - 3; // Bottom side
            }
          }}
          className={`group relative w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-200 shadow-2xl shadow-black/70 ${
            isPaused 
              ? 'bg-green-500/20 hover:bg-green-500/30 shadow-green-500/50' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={isPaused ? "Resume animation" : "Pause animation"}
        >
          {isPaused ? (
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          
          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {isPaused ? "Resume animation" : "Pause animation"}
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </button>

        {/* Info button */}
        <button 
          onClick={() => {
            setShowInfoModal(true);
          }}
          className="group relative w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 shadow-2xl shadow-black/70"
          title="Learn about this background"
        >
          <svg className="w-6 h-6 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Learn about this RL background
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </button>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-black/90 border border-white/20 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto z-[101]" style={{ zIndex: 1001 }}>
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-white mb-4 pr-8">🧠 RL Background System</h3>
            
            <div className="space-y-4 text-white/80 text-sm">
              <p className="text-white">
                This background uses <strong className="text-blue-400">Q-learning</strong>, a reinforcement learning algorithm where agents learn to navigate toward goals.
              </p>
              
              {/* Live Statistics Dashboard */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/20">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  📊 Live Statistics
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/60">Goals Reached</div>
                    <div className="text-lg font-bold text-green-400">{stats.totalGoals}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/60">Total Steps</div>
                    <div className="text-lg font-bold text-blue-400">{stats.totalSteps.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/60">Active Agents</div>
                    <div className="text-lg font-bold text-purple-400">{stats.agentsActive}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-white/60">Goals/Min</div>
                    <div className="text-lg font-bold text-yellow-400">{stats.goalsPerMinute}</div>
                  </div>
            
                </div>
              </div>
              
              {/* Reward System Information */}
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-lg p-4 border border-emerald-500/20">
                <div className="mb-3">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    🎯 Reward System
                  </h4>
                  
                  {/* Reward Mode Slider */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={controls.rewardMode}
                      onChange={(e) => setControls(prev => ({ ...prev, rewardMode: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Basic</span>
                    <span>Advanced</span>
                    <span>Crazy</span>
                  </div>
                </div>
                
                {controls.rewardMode === 0 ? (
                  <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-3 border border-blue-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300 font-semibold text-xs">Basic Mode</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between bg-green-900/20 rounded px-2 py-1 border-l-2 border-green-400">
                        <span className="text-white/80">Goal</span>
                        <span className="text-green-400 font-bold">+1000</span>
                      </div>
                      <div className="flex justify-between bg-red-900/20 rounded px-2 py-1 border-l-2 border-red-400">
                        <span className="text-white/80">Wall</span>
                        <span className="text-red-400 font-bold">-100</span>
                      </div>
                      <div className="flex justify-between bg-yellow-900/20 rounded px-2 py-1 border-l-2 border-yellow-400">
                        <span className="text-white/80">Step</span>
                        <span className="text-yellow-400 font-bold">-1</span>
                      </div>
                    </div>
                  </div>
                ) : controls.rewardMode === 1 ? (
                  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg p-3 border border-emerald-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-300 font-semibold text-xs">Advanced Mode</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between bg-green-900/20 rounded px-2 py-1 border-l-2 border-green-400">
                        <span className="text-white/80">Goal</span>
                        <span className="text-green-400 font-bold">+1000</span>
                      </div>
                      <div className="flex justify-between bg-blue-900/20 rounded px-2 py-1 border-l-2 border-blue-400">
                        <span className="text-white/80">Distance</span>
                        <span className="text-blue-400 font-bold">+50</span>
                      </div>
                      <div className="flex justify-between bg-purple-900/20 rounded px-2 py-1 border-l-2 border-purple-400">
                        <span className="text-white/80">Efficiency</span>
                        <span className="text-purple-400 font-bold">+25</span>
                      </div>
                      <div className="flex justify-between bg-red-900/20 rounded px-2 py-1 border-l-2 border-red-400">
                        <span className="text-white/80">Wall</span>
                        <span className="text-red-400 font-bold">-200</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 rounded-lg p-3 border border-red-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-red-300 font-semibold text-xs">Crazy Mode</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between bg-green-900/20 rounded px-2 py-1 border-l-2 border-green-400">
                        <span className="text-white/80">Goal</span>
                        <span className="text-green-400 font-bold">+2000</span>
                      </div>
                      <div className="flex justify-between bg-blue-900/20 rounded px-2 py-1 border-l-2 border-blue-400">
                        <span className="text-white/80">Distance</span>
                        <span className="text-blue-400 font-bold">+100</span>
                      </div>
                      <div className="flex justify-between bg-purple-900/20 rounded px-2 py-1 border-l-2 border-purple-400">
                        <span className="text-white/80">Efficiency</span>
                        <span className="text-purple-400 font-bold">+50</span>
                      </div>
                      <div className="flex justify-between bg-cyan-900/20 rounded px-2 py-1 border-l-2 border-cyan-400">
                        <span className="text-white/80">Speed</span>
                        <span className="text-cyan-400 font-bold">+30</span>
                      </div>
                      <div className="flex justify-between bg-orange-900/20 rounded px-2 py-1 border-l-2 border-orange-400">
                        <span className="text-white/80">Exploration</span>
                        <span className="text-orange-400 font-bold">+20</span>
                      </div>
                      <div className="flex justify-between bg-pink-900/20 rounded px-2 py-1 border-l-2 border-pink-400">
                        <span className="text-white/80">Multi-goal</span>
                        <span className="text-pink-400 font-bold">+150</span>
                      </div>
                      <div className="flex justify-between bg-red-900/20 rounded px-2 py-1 border-l-2 border-red-400">
                        <span className="text-white/80">Wall</span>
                        <span className="text-red-400 font-bold">-500</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Simple Control Buttons */}
              <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-4 border border-purple-500/20">
                <h4 className="font-bold text-white mb-3">🎛️ Controls</h4>
                
                <div className="space-y-3">
                  {/* Step Speed Slider */}
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Step Speed: {controls.stepSpeed}x</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={controls.stepSpeed}
                      onChange={(e) => setControls(prev => ({ ...prev, stepSpeed: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  
                </div>
              </div>
              
              <p className="text-white italic">
                Click anywhere on the background to spawn new agents!
              </p>
              
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
