/**
 * app.js — Main Application Orchestrator
 * Initializes all modules and coordinates scroll-driven storytelling.
 */

import { ScrollEngine } from './modules/scroll-engine.js';
import { Scene3D } from './modules/scene-3d.js';
import { BubbleSystem } from './modules/bubbles.js';
import { LiquidText } from './modules/liquid-text.js';
import { ColorTransition } from './modules/color-transition.js';

class SloshApp {
  constructor() {
    this.scrollEngine = null;
    this.scene3d = null;
    this.bubbles = null;
    this.liquidText = null;
    this.colorTransition = null;
    this.isReady = false;
  }

  async init() {
    // Show loader
    this._updateLoader(10);

    // Init modules
    this.scrollEngine = new ScrollEngine().init();
    this._updateLoader(25);

    this.scene3d = new Scene3D('three-canvas').init();
    this._updateLoader(45);

    this.bubbles = new BubbleSystem('bubbles-canvas').init();
    this._updateLoader(60);

    this.liquidText = new LiquidText().init();
    this._updateLoader(75);

    this.colorTransition = new ColorTransition().init();
    this._updateLoader(85);

    // Interaction: 3D Box Click
    this.scene3d.onBoxClick = () => {
      // Only trigger in hero section
      if (this.scene3d.scrollState.progress > 0.15) return;
      this.scene3d.pourAnimationActive = true;
      document.body.style.cursor = 'default';
      
      // Animate box to tilt/pour (pointing towards camera and down)
      gsap.to(this.scene3d.boxGroup.rotation, {
        x: 1.6,   // tilt forward completely, showing the top ring to the camera
        y: 0,     // face straight
        z: 0,     // straight
        duration: 1,
        ease: "power2.inOut"
      });
      gsap.to(this.scene3d.boxGroup.position, {
        x: 0,     // centered
        y: 0.6,   // very high up
        z: 1.5,   // closer to camera
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          // Pour source = bottom of the tilted can (the mouth/opening)
          const pourX = window.innerWidth * 0.5;
          const pourY = window.innerHeight * 0.6;
          this.bubbles.startPour(pourX, pourY);

          // Floods the next section to make it one continuous body of pink liquid
          document.getElementById('pop').style.background = '#FBAFD4';
          
          // Fill up the pool at the bottom directly via the Canvas bubble system
          gsap.to(this.bubbles, {
            poolHeight: window.innerHeight * 0.35,
            duration: 2.5,
            ease: "power2.inOut",
            delay: 0.2 // slightly after pouring starts
          });

          // Constant pour indefinitely; do not revert pourAnimationActive.
        }
      });
    };

    // Setup GSAP section animations
    this._setupHeroAnimations();
    this._setupPopAnimations();
    this._setupSubmergeAnimations();
    this._setupLiquidTypeAnimations();
    this._setupFlavorAnimations();
    this._setupCTAAnimations();
    this._updateLoader(95);

    // Setup master scroll listener
    this._setupMasterScroll();

    // Setup mouse interactions (repulsion & trails)
    this._setupInteractions();

    // Navigation smooth scroll
    this._setupNavigation();

    // Finalize
    this._updateLoader(100);
    await this._delay(500);
    this._hideLoader();
    this.isReady = true;
  }

  // ==========================
  // LOADER
  // ==========================
  _updateLoader(percent) {
    const bar = document.getElementById('loader-bar');
    if (bar) bar.style.width = percent + '%';
  }

  _hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================
  // MOUSE INTERACTIONS
  // ==========================
  _setupInteractions() {
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      
      // Dispatch to bubbles for trail/ripples
      if (this.bubbles) {
        this.bubbles.updateMouse(e.clientX, e.clientY);
      }
    }, { passive: true });

    // Spring physics for snack repulsion
    const snacks = document.querySelectorAll('.snack-wrap');
    const snackData = Array.from(snacks).map(el => ({
      el: el.querySelector('.snack-icon'),
      vx: 0, vy: 0, x: 0, y: 0
    }));

    // Mouse trail white foam effect + Text parallax
    gsap.ticker.add(() => {
      const movementX = (this.mouse.x / window.innerWidth) - 0.5;
      const movementY = (this.mouse.y / window.innerHeight) - 0.5;

      // Subtle parallax for titles
      gsap.to('#title-slosh', { duration: 0.6, x: movementX * 45, y: movementY * 20, ease: 'sine.out' });
      gsap.to('#title-seltzer', { duration: 0.6, x: movementX * 70, y: movementY * 35, ease: 'sine.out' });
      gsap.to('#hero-subtitle', { duration: 0.8, x: -movementX * 30, y: -movementY * 15, ease: 'sine.out' });
      gsap.to('.hero__content', { duration: 1, x: movementX * 15, y: movementY * 10, ease: 'sine.out' });

      snackData.forEach(item => {
        if (!item.el) return;
        const rect = item.el.getBoundingClientRect();
        if (rect.width === 0) return; // offscreen

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        const dx = this.mouse.x - cx;
        const dy = this.mouse.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Repulsion radius = 200px
        if (dist < 200 && dist > 1) {
          const force = (200 - dist) / 200;
          // push away
          item.vx -= (dx / dist) * force * 1.5;
          item.vy -= (dy / dist) * force * 1.5;
        }

        // Spring back to origin (relative x=0, y=0)
        item.vx += (0 - item.x) * 0.04;
        item.vy += (0 - item.y) * 0.04;
        
        // Friction
        item.vx *= 0.88;
        item.vy *= 0.88;
        
        item.x += item.vx;
        item.y += item.vy;

        // Apply physical displacement + rotation based on velocity
        item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.vx * 2}deg)`;
      });
    });
  }

  // ==========================
  // MASTER SCROLL SYNC
  // ==========================
  _setupMasterScroll() {
    const body = document.body;
    const docHeight = () => document.documentElement.scrollHeight - window.innerHeight;

    // Use GSAP ticker for smooth per-frame updates
    gsap.ticker.add(() => {
      const scrollY = window.scrollY || this.scrollEngine?.lenis?.scroll || 0;
      const total = docHeight();
      const progress = total > 0 ? Math.min(1, scrollY / total) : 0;

      // Update all modules with global progress
      this.scene3d?.updateScroll(progress, this._getSectionIndex(progress));
      this.bubbles?.updateScroll(progress, scrollY);
      this.liquidText?.updateScroll(progress);
      this.colorTransition?.update(progress);
    });
  }

  _getSectionIndex(progress) {
    if (progress < 0.15) return 0;
    if (progress < 0.30) return 1;
    if (progress < 0.45) return 2;
    if (progress < 0.65) return 3;
    if (progress < 0.80) return 4;
    return 5;
  }

  // ==========================
  // NAVIGATION
  // ==========================
  _setupNavigation() {
    document.querySelectorAll('.nav__links a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href?.startsWith('#')) {
          e.preventDefault();
          this.scrollEngine?.scrollTo(href);
        }
      });
    });
  }

  // ==========================
  // SECTION ANIMATIONS (GSAP)
  // ==========================

  _setupHeroAnimations() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      }
    });

    // Title SLOSH: slide in from left + fade
    gsap.from('#title-slosh', {
      x: -200,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1,
      }
    });

    // Title SELTZER: slide in from right
    gsap.from('#title-seltzer', {
      x: 200,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1,
      }
    });

    // Subtitle: fade up
    gsap.from('#hero-subtitle', {
      y: 40,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: 'power2.out',
    });

    // Decorative elements: stagger scale in
    gsap.from('#deco-badge', {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      delay: 0.5,
      ease: 'back.out(2)',
    });

    gsap.from('#deco-pop-label', {
      y: -20,
      opacity: 0,
      duration: 0.6,
      delay: 0.6,
      ease: 'power2.out',
    });

    gsap.from('#deco-circle', {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      delay: 0.7,
      ease: 'back.out(1.5)',
    });

    gsap.from('#deco-eyes', {
      scale: 0,
      duration: 0.5,
      delay: 0.8,
      ease: 'back.out(3)',
    });

    gsap.from('#deco-squiggle', {
      x: -50,
      opacity: 0,
      duration: 0.8,
      delay: 0.4,
      ease: 'power2.out',
    });

    // Parallax on scroll: elements drift up at different speeds
    tl.to('#title-slosh', { y: -150, ease: 'none' }, 0)
      .to('#title-seltzer', { y: -120, ease: 'none' }, 0)
      .to('#hero-subtitle', { y: -80, opacity: 0, ease: 'none' }, 0)
      .to('#deco-badge', { y: -200, rotation: 60, ease: 'none' }, 0)
      .to('#deco-circle', { y: -100, ease: 'none' }, 0)
      .to('#deco-squiggle', { y: -180, x: -30, ease: 'none' }, 0)
      .to('#deco-pop-label', { y: -140, opacity: 0, ease: 'none' }, 0)
      .to('#deco-eyes', { y: -90, ease: 'none' }, 0);
  }

  _setupPopAnimations() {
    // Foam layer rises from bottom
    gsap.to('#foam-layer', {
      height: '120%',
      borderRadius: '30% 30% 0 0 / 10% 10% 0 0',
      scrollTrigger: {
        trigger: '#pop',
        start: 'top 60%',
        end: 'bottom top',
        scrub: 1,
      }
    });

    // Text content slides in AFTER the 3D can finishes moving left (which happens in the first 40% of this section)
    gsap.from('.pop__content', {
      x: 100,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '#pop',
        start: 'top 30%', // Wait until section is significantly scrolled
        end: 'top 10%',   // Finish animating in
        scrub: 1,
      }
    });

    // Scroll hint appears mid-section
    gsap.to('#pop-scroll-hint', {
      opacity: 1,
      scrollTrigger: {
        trigger: '#pop',
        start: 'top 40%',
        end: 'top 20%',
        scrub: 1,
      }
    });

    gsap.to('#pop-scroll-hint', {
      opacity: 0,
      scrollTrigger: {
        trigger: '#pop',
        start: 'center center',
        end: 'bottom top',
        scrub: 1,
      }
    });
  }

  _setupSubmergeAnimations() {
    // Ghost text zooms in from far background
    gsap.from('#submerge-ghost', {
      scale: 0.3,
      opacity: 0,
      scrollTrigger: {
        trigger: '#submerge',
        start: 'top 70%',
        end: 'center center',
        scrub: 1.5,
      }
    });

    // Ghost text continues to scale up and pass through
    gsap.to('#submerge-ghost', {
      scale: 2.5,
      opacity: 0,
      scrollTrigger: {
        trigger: '#submerge',
        start: 'center 40%',
        end: 'bottom top',
        scrub: 1.5,
      }
    });
  }

  _setupLiquidTypeAnimations() {
    // SVG container fades in
    gsap.from('.liquid__svg-container', {
      opacity: 0,
      y: 80,
      scrollTrigger: {
        trigger: '#liquid-type',
        start: 'top 60%',
        end: 'top 20%',
        scrub: 1,
      }
    });

    // Subtle vertical drift of the whole SVG
    gsap.to('.liquid__svg-container', {
      y: -60,
      scrollTrigger: {
        trigger: '#liquid-type',
        start: 'top top',
        end: 'bottom top',
        scrub: 2,
      }
    });
  }

  _setupFlavorAnimations() {
    // Wave divider moves upward to reveal yellow
    gsap.to('#wave-divider', {
      y: -100,
      scrollTrigger: {
        trigger: '#flavor-reveal',
        start: 'top 50%',
        end: 'center center',
        scrub: 1,
      }
    });

    // Fruits stagger in from bottom
    gsap.from('#flavor-fruits .fruit', {
      y: 200,
      opacity: 0,
      rotation: () => gsap.utils.random(-30, 30),
      scale: 0,
      duration: 0.8,
      ease: 'back.out(2)',
      stagger: {
        each: 0.08,
        from: 'random',
      },
      scrollTrigger: {
        trigger: '#flavor-reveal',
        start: 'top 40%',
        end: 'center center',
        scrub: 1,
      }
    });

    // Floating animation for fruits after they appear
    document.querySelectorAll('#flavor-fruits .fruit').forEach((fruit, i) => {
      gsap.to(fruit, {
        y: `+=${gsap.utils.random(-15, 15)}`,
        x: `+=${gsap.utils.random(-10, 10)}`,
        rotation: gsap.utils.random(-5, 5),
        duration: gsap.utils.random(2, 4),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.1,
      });
    });
  }

  _setupCTAAnimations() {
    // Title lines stagger in
    const ctaLines = ['#cta-line1', '#cta-line2', '#cta-line3', '#cta-line4'];

    ctaLines.forEach((id, i) => {
      gsap.from(id, {
        x: i % 2 === 0 ? -150 : 150,
        opacity: 0,
        scrollTrigger: {
          trigger: '#cta',
          start: `top ${70 - i * 8}%`,
          end: `top ${40 - i * 5}%`,
          scrub: 1,
        }
      });
    });

    // CTA fruits pile up
    gsap.from('#cta-fruits .cta__fruit', {
      y: 300,
      opacity: 0,
      rotation: () => gsap.utils.random(-45, 45),
      scale: 0,
      ease: 'back.out(1.5)',
      stagger: {
        each: 0.06,
        from: 'end',
      },
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 50%',
        end: 'center center',
        scrub: 1,
      }
    });

    // Gentle float on CTA fruits
    document.querySelectorAll('#cta-fruits .cta__fruit').forEach((fruit, i) => {
      gsap.to(fruit, {
        y: `+=${gsap.utils.random(-12, 12)}`,
        rotation: gsap.utils.random(-8, 8),
        duration: gsap.utils.random(2.5, 4.5),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.15,
      });
    });
  }
}

// ==========================
// BOOT
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const app = new SloshApp();
  app.init().catch(err => {
    console.error('App initialization failed:', err);
    // Still hide loader on error
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  });
});
