/**
 * scroll-engine.js
 * Manages Lenis smooth scroll + GSAP ScrollTrigger synchronization.
 */

export class ScrollEngine {
  constructor() {
    this.lenis = null;
    this.scrollProgress = 0;
    this.sections = [];
    this.sidebarTexts = {
      left: [
        '4 FLAVORS',
        '4 FLAVORS',
        '4 FLAVORS',
        '4 FLAVORS',
        '4 FLAVORS',
        '4 FLAVORS'
      ],
      right: [
        'GOOD TIMES',
        'GOOD TIMES',
        'GOOD TIMES',
        'GUARANTEED GOOD TIMES',
        'GUARANTEED GOOD TIMES',
        'GUARANTEED GOOD TIMES'
      ]
    };
  }

  init() {
    this._initLenis();
    this._registerScrollTrigger();
    this._setupProgressDots();
    this._setupSidebarUpdates();
    return this;
  }

  _initLenis() {
    this.lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    // Sync Lenis with GSAP ticker
    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  _registerScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);

    // Store section elements
    this.sections = gsap.utils.toArray('.section');
  }

  _setupProgressDots() {
    const dots = document.querySelectorAll('.scroll-progress__dot');

    this.sections.forEach((section, i) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this._setActiveDot(dots, i),
        onEnterBack: () => this._setActiveDot(dots, i),
      });
    });
  }

  _setActiveDot(dots, index) {
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  _setupSidebarUpdates() {
    const leftText = document.getElementById('sidebar-left-text');
    const rightText = document.getElementById('sidebar-right-text');

    this.sections.forEach((section, i) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (leftText && this.sidebarTexts.left[i]) leftText.textContent = this.sidebarTexts.left[i];
          if (rightText && this.sidebarTexts.right[i]) rightText.textContent = this.sidebarTexts.right[i];
        },
        onEnterBack: () => {
          if (leftText && this.sidebarTexts.left[i]) leftText.textContent = this.sidebarTexts.left[i];
          if (rightText && this.sidebarTexts.right[i]) rightText.textContent = this.sidebarTexts.right[i];
        }
      });
    });
  }

  /**
   * Get overall scroll progress 0-1
   */
  getProgress() {
    return this.scrollProgress;
  }

  /**
   * Scroll to a section by index or element
   */
  scrollTo(target) {
    this.lenis.scrollTo(target, { duration: 2 });
  }

  destroy() {
    if (this.lenis) {
      this.lenis.destroy();
    }
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
