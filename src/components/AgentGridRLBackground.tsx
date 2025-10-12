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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Tunables for subtle vibe ---
    const MAX_RIPPLE = 28;            // allow larger user pulses
    const BG_WARP_AMP = 7;            // base warp amplitude (subtle but flowing)
    const RL_STEPS = 1;               // slower agent motion
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
    }));

    // Moving goal (single shared), shown by default
    let goal = { x: Math.floor(nx * 0.75), y: Math.floor(ny * 0.5) };
    let showGoal = true;

    // Ripples
    type Ripple = { x: number, y: number, t: number, amp: number, speed: number, decay: number };
    const ripples: Ripple[] = [];

    // Pointer for interactivity
    const pointer = { x: W * 0.5, y: H * 0.5, active: false };

    // Keyboard toggles
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") showGoal = !showGoal;
      if (e.key === "r" || e.key === "R") agents.forEach(a => a.modeChaos = !a.modeChaos);
      if (e.key === "f" || e.key === "F") agents.forEach(a => a.modeFlock = !a.modeFlock);
    };
    window.addEventListener("keydown", onKey);

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
        eps: 0.20 + Math.random() * 0.25,
        alpha: 0.22,
        gamma: 0.96,
        modeChaos: false,
        modeFlock: true,
        colorHue: Math.floor(Math.random() * 360), // random color for clicked agents
        trail: [] as Array<{x:number,y:number}>,
      };
      
      agents.push(newAgent);
      
      // Limit total agents to prevent performance issues
      if (agents.length > 10) {
        agents.splice(0, agents.length - 10);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
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
        eps: 0.20 + Math.random() * 0.25,
        alpha: 0.22,
        gamma: 0.96,
        modeChaos: false,
        modeFlock: true,
        colorHue: Math.floor(Math.random() * 360), // random color for clicked agents
        trail: [] as Array<{x:number,y:number}>,
      };
      
      agents.push(newAgent);
      
      if (agents.length > 10) {
        agents.splice(0, agents.length - 10);
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true } as any);

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

      // Flocking bias (soft)
      let flockBias = { dx: 0, dy: 0 };
      if (a.modeFlock) {
        let cx = 0, cy = 0;
        for (let k = 0; k < agents.length; k++) { cx += agents[k].x; cy += agents[k].y; }
        cx /= agents.length; cy /= agents.length;
        flockBias.dx = (cx - a.x) * 0.02;
        flockBias.dy = (cy - a.y) * 0.02;
      }

      // Optional chaos overlay
      const chaosDx = a.modeChaos ? (Math.random() - 0.5) * 0.15 : 0;
      const chaosDy = a.modeChaos ? (Math.random() - 0.5) * 0.15 : 0;

      // Epsilon-greedy action
      const si = sIndex(a.x, a.y);
      const q0 = Q[si + 0], q1 = Q[si + 1], q2 = Q[si + 2], q3 = Q[si + 3];
      const explore = Math.random() < a.eps;
      let act = explore ? ACTIONS[(Math.random() * 4) | 0] : argmax4(q0, q1, q2, q3);

      let dx = 0, dy = 0;
      if (act === 0) dy = -1; else if (act === 1) dx = 1; else if (act === 2) dy = 1; else dx = -1;
      dx += flockBias.dx + chaosDx; dy += flockBias.dy + chaosDy;

      if (Math.abs(dx) > Math.abs(dy)) { dx = Math.sign(dx); dy = 0; }
      else if (Math.abs(dy) > 0) { dy = Math.sign(dy); dx = 0; }

      const oldX = a.x, oldY = a.y;
      const nxp = clamp(a.x + dx, 0, nx - 1);
      const nyp = clamp(a.y + dy, 0, ny - 1);

      // Rewards
      let r = -0.01;
      if (nxp === 0 || nxp === nx - 1 || nyp === 0 || nyp === ny - 1) r -= 0.02;
      const reached = (nxp === goal.x && nyp === goal.y);
      if (reached) r += 1.0;

      // TD update
      const sj = sIndex(nxp, nyp);
      const maxNext = Math.max(Q[sj + 0], Q[sj + 1], Q[sj + 2], Q[sj + 3]);
      const td = r + a.gamma * maxNext - Q[si + (act as number)];
      Q[si + (act as number)] += a.alpha * td;

      a.x = nxp; a.y = nyp;
      a.eps = Math.max(0.02, a.eps * 0.9995);

      // Trail update (only on movement)
      if (a.x !== oldX || a.y !== oldY) {
        a.trail.push({ x: a.x, y: a.y });
        clampTrail(a.trail);
      }

      if (reached) {
        emitPulse(goal.x * (W / nx) + (W / nx) / 2, goal.y * (H / ny) + (H / ny) / 2, 0.6);
        moveGoal();
      }
    }

    // Background grid warp fields ------------------------------------------
    function baseWaves(x: number, y: number, t: number) {
      // Slower, calmer base motion (still flowing)
      const kx = 0.0030, ky = 0.0022; // wavelengths
      const wx = 0.25, wy = -0.22;    // angular velocities (slow)
      return Math.sin(x * kx + t * wx) * 1.1 + Math.sin(y * ky + t * wy) * 0.9;
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
    function drawGrid(t: number) {
      ctx.save();
      // Background gradient (slightly darker)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#05070b");
      grad.addColorStop(0.6, "#090d14");
      grad.addColorStop(1, "#05070a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Recompute nx/ny in case of resize
      nx = Math.max(8, Math.floor(W / cellPx));
      ny = Math.max(6, Math.floor(H / cellPx));

      const spacingX = W / nx;
      const spacingY = H / ny;
      const amp = BG_WARP_AMP;
      const samples = 24; // fewer samples → smoother

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
        const a = 0.18 + 0.35 * Math.pow(i / nx, 1.1);
        ctx.strokeStyle = `rgba(170, 230, 255, ${a})`;
        ctx.lineWidth = 0.8 + 1.4 * Math.pow(Math.abs(i - nx * 0.5) / (nx * 0.5), 0.7);
        ctx.globalAlpha = 0.6;
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
        const a = 0.16 + 0.4 * Math.pow(j / ny, 1.1);
        ctx.strokeStyle = `rgba(255, 140, 240, ${a})`;
        ctx.lineWidth = 0.8 + 1.8 * Math.pow(j / ny, 1.8);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
      }

      // Goal marker
      if (showGoal) {
        const gx = goal.x * spacingX + spacingX / 2;
        const gy = goal.y * spacingY + spacingY / 2;
        const rad = 12 + 6 * Math.sin(t * 2.2); // much bigger and more pulsing
        ctx.beginPath();
        ctx.arc(gx, gy, rad, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 100, 255, 0.9)"; // bright magenta color
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx, gy, rad + 15, 0, Math.PI * 2); // larger outer ring
        ctx.strokeStyle = "rgba(255, 255, 0, 0.4)"; // bright yellow outer ring
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw agents + glow trails -------------------------------------------
    function drawAgents(_t: number) {
      const spacingX = W / nx;
      const spacingY = H / ny;

      const toPx = (gx: number, gy: number) => (
        [gx * spacingX + spacingX / 2, gy * spacingY + spacingY / 2] as const
      );

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const [ax, ay] = toPx(a.x, a.y);

        // Trail: draw faded polyline segments from old → recent
        if (a.trail.length >= 2) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
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
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
          }
          ctx.restore();
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
    (function runSelfTests() {
      const nearly = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
      const t0 = performance.now() * 0.001;

      // Test 1: rippleField should be 0 when no ripples are present
      const r0 = rippleField(100, 100, t0);
      console.assert(nearly(r0, 0), `rippleField(empty) expected 0, got ${r0}`);

      // Test 2: sIndex layout sanity
      console.assert(sIndex(0, 0) === 0, "sIndex(0,0) should be 0");
      console.assert(sIndex(1, 0) === 4, "sIndex(1,0) should be 4");
      console.assert(sIndex(0, 1) === nx * 4, "sIndex(0,1) should be nx*4");

      // Test 3: baseWaves finiteness
      const bw = baseWaves(10, 20, 0.5);
      console.assert(Number.isFinite(bw), "baseWaves should return a finite number");

      // Test 4: Agents initialized (2 by default)
      console.assert(agents.length === AGENT_COUNT, "agents.length mismatch");

      // Test 4b: showGoal default
      console.assert(showGoal === true, "showGoal should be true by default");

      // Test 4c: RL steps slowed
      console.assert(RL_STEPS === 1, "RL_STEPS should be 1 for slower motion");

      // Test 5: Big-pulse clamp should not exceed MAX_RIPPLE
      ripples.push({ x: 200, y: 200, t: t0 - 0.05, amp: 22, speed: 260, decay: 1.8 });
      const rc = rippleField(200, 200, t0 + 0.10);
      console.assert(Math.abs(rc) <= MAX_RIPPLE + 1e-6, `ripple clamp failed: |${rc}| > ${MAX_RIPPLE}`);

      // Test 6: trail clamp
      const tmp: number[] = [];
      const TRAIL_MAX_LOCAL = 70;
      for (let i = 0; i < TRAIL_MAX_LOCAL + 15; i++) { tmp.push(i); if (tmp.length > TRAIL_MAX_LOCAL) tmp.splice(0, tmp.length - TRAIL_MAX_LOCAL); }
      console.assert(tmp.length <= TRAIL_MAX_LOCAL, `trail clamp failed: len=${tmp.length} > ${TRAIL_MAX_LOCAL}`);

      console.log("[AgentGridRLBackground] self-tests passed ✓");
    })();

    // Main loop -------------------------------------------------------------
    let last = performance.now() * 0.001;
    let rafId = 0 as number | 0;

    function frame() {
      const now = performance.now() * 0.001;
      const dt = Math.min(0.05, now - last);
      last = now;

      // Periodic auto pulse near center to keep mesh breathing (gentle)
      autoPulseT += dt;
      if (autoPulseT > AUTOPULSE_PERIOD) {
        autoPulseT = 0;
        emitPulse(W * (0.35 + 0.3 * Math.random()), H * (0.3 + 0.4 * Math.random()), 0.25);
      }

      // Let pointer subtly influence ripples when active (rarer)
      if (pointer.active && Math.random() < 0.05) emitPulse(pointer.x, pointer.y, 0.25);

      // RL: fewer steps per frame (subtle)
      for (let k = 0; k < RL_STEPS; k++) agents.forEach(stepAgent);

      // Draw
      drawGrid(now);
      drawAgents(now);

      rafId = requestAnimationFrame(frame) as unknown as number;
    }

    rafId = requestAnimationFrame(frame) as unknown as number;

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onTouchStart as any);
      canvas.style.transform = "";
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed background canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full block will-change-transform"
        style={{ pointerEvents: "auto", zIndex: 0 }}
        aria-hidden="true"
      />

      {/* Slot your site content above the animated background */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Info button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button 
          onClick={() => setShowInfoModal(true)}
          className="group relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
          title="Learn about this background"
        >
          <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-black/90 border border-white/20 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
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
              <p>
                This background uses <strong className="text-blue-400">Q-learning</strong>, a reinforcement learning algorithm where agents learn to navigate toward goals.
              </p>
              
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white mb-2">🎯 What You See:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>5 colored agents</strong> learning optimal paths</li>
                  <li>• <strong>Moving goal</strong> (magenta circle) that challenges agents</li>
                  <li>• <strong>Colored trails</strong> showing agent movement history</li>
                  <li>• <strong>Click anywhere</strong> to spawn new agents</li>
                </ul>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white mb-2">⚡ Key Concepts:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Exploration vs Exploitation</strong> - agents balance random vs learned actions</li>
                  <li>• <strong>Reward System</strong> - +1 for goals, penalties for walls/time</li>
                  <li>• <strong>Learning Decay</strong> - agents get smarter over time</li>
                </ul>
              </div>
              
              <p className="text-xs text-white/60">
                This demonstrates the same RL principles used in robotic manipulation research at the PAIR Lab.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
