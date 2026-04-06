/**
 * color-transition.js
 * Manages dynamic background color transitions across sections.
 * Updates CSS custom properties and sidebar/nav colors on scroll.
 */

export class ColorTransition {
  constructor() {
    this.root = document.documentElement;
    this.scrollProgress = 0;

    // Color stops along the scroll journey
    // Each stop: { at: progress, bg: [r,g,b], text: [r,g,b] }
    this.colorStops = [
      { at: 0.00, bg: [0, 183, 96],   text: [235, 161, 18] },   // Green + Beer Gold
      { at: 0.15, bg: [0, 183, 96],   text: [235, 161, 18] },   // Still green
      { at: 0.25, bg: [235, 161, 18], text: [0, 183, 96] },      // Beer Gold
      { at: 0.40, bg: [212, 146, 15], text: [232, 25, 44] },     // Beer Amber + Red
      { at: 0.55, bg: [200, 124, 0],  text: [232, 25, 44] },     // Beer Dark + Red
      { at: 0.70, bg: [245, 166, 35],  text: [232, 104, 37] },   // Yellow + Orange
      { at: 0.85, bg: [245, 166, 35],  text: [232, 104, 37] },   // Yellow + Orange
      { at: 1.00, bg: [245, 166, 35],  text: [255, 255, 255] },  // Yellow + White
    ];
  }

  init() {
    return this;
  }

  /**
   * Interpolate between color stops based on progress
   */
  _interpolateColor(stops, progress, property) {
    // Find surrounding stops
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (progress >= stops[i].at && progress <= stops[i + 1].at) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    // Normalize progress within this segment
    const range = upper.at - lower.at;
    const t = range === 0 ? 0 : (progress - lower.at) / range;

    // Smooth step
    const st = t * t * (3 - 2 * t);

    const c1 = lower[property];
    const c2 = upper[property];

    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * st),
      Math.round(c1[1] + (c2[1] - c1[1]) * st),
      Math.round(c1[2] + (c2[2] - c1[2]) * st),
    ];
  }

  /**
   * Apply color transitions based on current scroll progress
   */
  update(progress) {
    this.scrollProgress = progress;

    const bg = this._interpolateColor(this.colorStops, progress, 'bg');
    const text = this._interpolateColor(this.colorStops, progress, 'text');

    // Update body background
    document.body.style.backgroundColor = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;

    // Update CSS custom properties for dynamic elements
    this.root.style.setProperty('--dynamic-bg', `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`);
    this.root.style.setProperty('--dynamic-text', `rgb(${text[0]}, ${text[1]}, ${text[2]})`);
  }

  destroy() {
    // Reset styles
    document.body.style.backgroundColor = '';
    this.root.style.removeProperty('--dynamic-bg');
    this.root.style.removeProperty('--dynamic-text');
  }
}
