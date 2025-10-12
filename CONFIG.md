# Configuration Guide - Procedural Mesh Pulse Background

This document describes the tweakable parameters for the procedural fabric/mesh pulse background system.

## Core Visual Parameters

### Grid & Line Properties
- **`gridScale`** (float): Controls the density of the mesh grid
  - Range: 15.0 - 35.0
  - Default: 26.0
  - Higher values = denser grid, more detail
  - Lower values = sparser grid, more spacious feel

- **`lineWidth`** (float): Thickness of mesh lines
  - Range: 0.010 - 0.030
  - Default: 0.018
  - Higher values = thicker, more prominent lines
  - Lower values = thinner, more subtle lines

### Displacement Parameters
- **`baseAmp`** (float): Amplitude of base sine wave displacement
  - Range: 0.015 - 0.060
  - Default: 0.030
  - Controls the gentle rippling motion
  - Higher values = more dramatic waves

- **`noiseAmp`** (float): Amplitude of fractal noise displacement
  - Range: 0.010 - 0.080
  - Default: 0.045
  - Adds organic, chaotic movement
  - Higher values = more turbulent motion

### Pulse System
- **`pulseStrength`** (float): Intensity of signal pulses
  - Range: 0.020 - 0.120
  - Default: 0.060
  - Controls how pronounced the pulses are
  - Higher values = more dramatic pulse effects

- **`pulseSpeed`** (float): Speed of pulse expansion
  - Range: 0.40 - 1.20
  - Default: 0.70
  - How fast pulses expand outward
  - Higher values = faster expansion

- **`pulseCadence`** (array): Time between pulses [min, max] in seconds
  - Range: [3, 15]
  - Default: [5, 10]
  - Controls pulse frequency
  - Smaller values = more frequent pulses

## Color Configuration

### Line Color
- **`lineColor`** (vec3): RGB color of mesh lines
  - Format: [R, G, B] where values are 0.0 - 1.0
  - Default: [0.86, 0.93, 0.98] (nearly white)
  - Examples:
    - Blue: [0.38, 0.65, 0.98] (#60A5FA)
    - Purple: [0.65, 0.55, 0.98] (#A78BFA)
    - Green: [0.20, 0.80, 0.40] (#33CC66)

## RL Bandit Configuration

The background uses an ε-greedy bandit algorithm to automatically tune parameters based on user engagement.

### Bandit Arms
Four predefined parameter sets that the system cycles through:

1. **"calm"**: Subtle, gentle motion
   - `baseAmp: 0.022, noiseAmp: 0.030, pulseStrength: 0.05`
   - `pulseCadence: [6, 11], gridScale: 24`

2. **"flowy"**: Smooth, flowing motion (default)
   - `baseAmp: 0.032, noiseAmp: 0.045, pulseStrength: 0.06`
   - `pulseCadence: [5, 9], gridScale: 26`

3. **"spicy"**: Dynamic, energetic motion
   - `baseAmp: 0.040, noiseAmp: 0.060, pulseStrength: 0.08`
   - `pulseCadence: [4, 7], gridScale: 28`

4. **"tight"**: Precise, controlled motion
   - `baseAmp: 0.026, noiseAmp: 0.018, pulseStrength: 0.05`
   - `pulseCadence: [7, 12], gridScale: 30`

### Bandit Parameters
- **`epsilon`** (float): Exploration rate
  - Range: 0.05 - 0.30
  - Default: 0.18 (decays to 0.06)
  - Higher values = more exploration of different styles
  - Lower values = more exploitation of best-performing style

- **Evaluation Window**: 6 seconds
- **Reward Function**: 
  - Mouse movement distance (scaled by 1/600)
  - Click count (weighted by 2.0)
  - Dwell time (weighted by 0.6)

## Performance Tuning

### Device Pixel Ratio
- **`DPR`**: Automatically capped at 2.0 for performance
- Reduces quality on high-DPI displays to maintain 60fps

### Reduced Motion Support
- Automatically disables animation when `prefers-reduced-motion: reduce`
- Falls back to static grid pattern
- Respects user accessibility preferences

## Customization Examples

### Calm, Subtle Background
```javascript
const P = {
  gridScale: 22.0,
  lineWidth: 0.015,
  baseAmp: 0.020,
  noiseAmp: 0.025,
  pulseStrength: 0.040,
  pulseSpeed: 0.50,
  lineColor: [0.70, 0.75, 0.80]
};
```

### Dynamic, Energetic Background
```javascript
const P = {
  gridScale: 30.0,
  lineWidth: 0.025,
  baseAmp: 0.050,
  noiseAmp: 0.070,
  pulseStrength: 0.100,
  pulseSpeed: 0.90,
  lineColor: [0.90, 0.95, 1.00]
};
```

### Monochrome Theme
```javascript
const P = {
  lineColor: [0.85, 0.85, 0.85] // Light gray
};
```

### Blue Accent Theme
```javascript
const P = {
  lineColor: [0.38, 0.65, 0.98] // #60A5FA
};
```

## Browser Compatibility

### WebGL2 Support
- **Primary**: Full WebGL2 implementation with all features
- **Fallback**: Canvas 2D with basic animation
- **No-JS**: Static CSS background pattern

### Performance Targets
- **Target FPS**: 60fps on modern hardware
- **Bundle Size**: <80KB gzipped
- **Memory Usage**: <50MB GPU memory
- **CPU Usage**: <5% on idle, <15% during animation

## Debugging

### Console Logging
Enable debug mode by adding to console:
```javascript
window.DEBUG_BACKGROUND = true;
```

### Performance Monitoring
Monitor FPS and performance:
```javascript
// Add to console to see current bandit state
console.log('Current arm:', window.currentBackgroundArm);
console.log('Bandit stats:', window.banditStats);
```

### Manual Parameter Override
Force specific parameters:
```javascript
// Override current parameters
window.overrideBackgroundParams({
  baseAmp: 0.040,
  pulseStrength: 0.080
});
```

## Advanced Customization

### Custom Bandit Arms
Add new parameter sets:
```javascript
const customArm = {
  name: 'custom',
  params: {
    baseAmp: 0.035,
    noiseAmp: 0.050,
    pulseStrength: 0.070,
    pulseCadence: [5, 8],
    gridScale: 25
  },
  value: 0,
  pulls: 0
};
```

### Custom Shader Modifications
The fragment shader can be modified to add:
- Different noise functions (Simplex, Perlin)
- Color gradients
- Additional displacement patterns
- Particle effects

### Integration with Analytics
The bandit system can be integrated with analytics to track:
- User engagement metrics
- Performance across different devices
- A/B testing results
- Accessibility usage patterns
