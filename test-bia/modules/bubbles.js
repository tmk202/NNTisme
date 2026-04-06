/**
 * bubbles.js
 * Canvas-based bubble particle system.
 * Bubbles rise upward with wobble, controlled by scroll position.
 */

export class BubbleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.bubbles = [];
    this.maxBubbles = 180;
    this.spawnRate = 0;       // bubbles per frame, controlled by scroll
    this.spawnAccum = 0;
    this.scrollProgress = 0;
    this.active = false;
    this.animFrameId = null;

    // Object pool
    this.pool = [];

    // Pouring state
    this.pouring = false;
    this.pourX = 0;
    this.pourY = 0;
    this.poolHeight = 0;
    
    // Interactions state
    this.mouseTrails = [];
    this.ripples = [];
    this.mouseX = -100;
    this.mouseY = -100;
  }

  init() {
    this._cacheAssets();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.active = true;
    this._animate();
    return this;
  }

  _cacheAssets() {
    // Solid Foam Bubble
    this.cachedFoam = document.createElement('canvas');
    this.cachedFoam.width = 100;
    this.cachedFoam.height = 100;
    const fctx = this.cachedFoam.getContext('2d');
    const br = 50;
    const bx = 50;
    const by = 50;
    
    const grad = fctx.createRadialGradient(
      bx - br * 0.25, by - br * 0.25, br * 0.05,
      bx, by, br
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');      
    grad.addColorStop(0.4, 'rgba(255, 252, 240, 0.98)'); 
    grad.addColorStop(0.85, 'rgba(240, 230, 195, 0.9)'); 
    grad.addColorStop(1, 'rgba(200, 170, 100, 0.5)');    
    
    fctx.beginPath();
    fctx.arc(bx, by, br, 0, Math.PI * 2);
    fctx.fillStyle = grad;
    fctx.fill();
    
    fctx.beginPath();
    fctx.arc(bx - br * 0.45, by - br * 0.45, br * 0.12, 0, Math.PI * 2);
    fctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    fctx.fill();

    // Translucent Ambient Bubble
    this.cachedAmbient = document.createElement('canvas');
    this.cachedAmbient.width = 100;
    this.cachedAmbient.height = 100;
    const actx = this.cachedAmbient.getContext('2d');

    const grad2 = actx.createRadialGradient(
      bx - br * 0.3, by - br * 0.3, 0,
      bx, by, br
    );
    grad2.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad2.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    grad2.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    actx.beginPath();
    actx.arc(bx, by, br, 0, Math.PI * 2);
    actx.fillStyle = grad2;
    actx.fill();

    actx.beginPath();
    actx.arc(bx - br * 0.25, by - br * 0.25, br * 0.25, 0, Math.PI * 2);
    actx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    actx.fill();
  }

  updateScroll(progress, scrollY) {
    this.scrollProgress = progress;
    this.scrollY = scrollY;
    
    // Smoothly scale bubble spawn rate based on scroll position
    let targetSpawnRate = 0;
    
    if (progress > 0.05 && progress < 0.8) {
      if (progress < 0.3) {
        targetSpawnRate = (progress - 0.05) / 0.25;
      } else if (progress > 0.6) {
        targetSpawnRate = 1 - (progress - 0.6) / 0.2;
      } else {
        targetSpawnRate = 1;
      }
    }
    
    // Map 0-1 target to actual bubble count per frame (adjust for density)
    const maxSpawnPerFrame = 2.5; 
    const mappedRate = targetSpawnRate * maxSpawnPerFrame;
    
    // Instantly or smoothly lerp
    this.spawnRate = mappedRate;
    
    // Calculate new bubble physics
    this._updatePhysics();
  }

  updateMouse(x, y) {
    const dx = x - this.mouseX;
    const dy = y - this.mouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Only spawn if mouse is moving
    if (dist > 5) {
      // Spawn 1 or 2 foam tiny bubbles for mouse trail
      this.mouseTrails.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        life: 1.0,
        radius: 3 + Math.random() * 8, // larger foam pieces
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5
      });
      
      // Spawn ripple slightly less frequently
      if (Math.random() > 0.8) {
        this.ripples.push({
           x: x, y: y, life: 1.0
        });
      }
    }
    
    this.mouseX = x;
    this.mouseY = y;
  }

  startPour(x, y) {
    this.pouring = true;
    this.pourX = x;
    this.pourY = y;
  }

  stopPour() {
    this.pouring = false;
  }

  _createPourParticle() {
    let bubble = this.pool.pop() || {};
    
    bubble.isFoam = Math.random() > 0.8;
    
    if (bubble.isFoam) {
      bubble.radius = 2 + Math.random() * 6;
      bubble.speedY = -(2 + Math.random() * 6);
      bubble.speedX = (Math.random() - 0.5) * 6;
      bubble.opacity = 0.6 + Math.random() * 0.4;
    } else {
      bubble.radius = 40 + Math.random() * 80; // Even more massive blobs
      bubble.speedY = -(1 + Math.random() * 7); // slower fall, dense look
      // EXTREME spread to reach the screen edges
      bubble.speedX = (Math.random() - 0.5) * 45; 
      bubble.opacity = 1.0; 
    }
    
    // Spread the spawn area wider around the can nozzle
    bubble.x = this.pourX + (Math.random() - 0.5) * 100;
    bubble.y = this.pourY + (Math.random() - 0.5) * 10;
    bubble.life = 1;
    bubble.fadeSpeed = 0.008; // fade slow enough to reach bottom
    bubble.isPour = true;
    return bubble;
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _createBubble(inPool = false, poolBottom = 0) {
    let bubble = this.pool.pop() || {};

    const size = 1.5 + Math.random() * 6; // smaller carbonation bubbles
    bubble.x = Math.random() * this.canvas.width;
    
    if (inPool) {
      // Spawn at the bottom of the beer pool
      bubble.y = poolBottom - Math.random() * 30;
      bubble.speedY = 1.5 + Math.random() * 3.5; // faster carbonation
    } else {
      // Spawn at bottom of viewport for ambient
      bubble.y = this.canvas.height + size + Math.random() * 50;
      bubble.speedY = 0.5 + Math.random() * 2;
    }
    
    bubble.radius = size;
    bubble.speedX = 0;
    bubble.wobblePhase = Math.random() * Math.PI * 2;
    bubble.wobbleFreq = 0.02 + Math.random() * 0.04;
    bubble.wobbleAmp = 0.5 + Math.random() * 1.5;
    bubble.opacity = 0.3 + Math.random() * 0.6;
    bubble.life = 1;
    // Ambient fades slower, carbonation fades slightly faster
    bubble.fadeSpeed = inPool ? (0.002 + Math.random() * 0.002) : (0.0005 + Math.random() * 0.001);
    bubble.isPour = false;
    bubble.isFoam = false;

    return bubble;
  }

  _updateBubble(b, waveYFunc) {
    b.y -= b.speedY;
    b.wobblePhase += b.wobbleFreq;
    b.x += Math.sin(b.wobblePhase) * b.wobbleAmp;
    b.life -= b.fadeSpeed;

    // Slightly shrink as they rise
    b.radius *= 0.9998;
    
    // If it reaches the liquid surface, pop it (life = 0)
    if (waveYFunc && b.y < waveYFunc(b.x)) {
      b.life = 0; 
    }
  }

  _drawBubble(b) {
    const alpha = b.opacity * b.life;
    if (alpha <= 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    if (b.isPour && !b.isFoam) {
      // Solid beer pink liquid for pour stream (flat colors merge smoothly into a blob)
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FBAFD4'; // Flat pink
      this.ctx.fill();
      
      // Draw tiny white highlight dots inside some massive blobs
      if (b.radius > 25) {
        this.ctx.beginPath();
        this.ctx.arc(b.x + b.radius*0.3, b.y - b.radius*0.2, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
      }
    } else {
      // Main bubble (for foam and rising bubbles) pre-rendered
      this.ctx.drawImage(this.cachedAmbient, b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
    }

    this.ctx.restore();
  }

  _drawPoolLiquid(waveYFunc) {
    if (this.poolHeight <= 0) return;
    
    const heroEl = document.getElementById('hero');
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : { bottom: this.canvas.height - (this.scrollY || 0) };
    
    const poolBottom = heroRect.bottom + 10;
    const baseHeight = poolBottom - this.poolHeight;

    if (poolBottom < 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = 1;

    // === LAYER 1: Main beer body (solid pink gradient) ===
    const beerGrad = this.ctx.createLinearGradient(0, baseHeight - 40, 0, poolBottom);
    beerGrad.addColorStop(0, '#FFCBE6');   // light pink top
    beerGrad.addColorStop(1, '#FBAFD4');   // matches the DOM #pop background perfectly
    
    this.ctx.fillStyle = beerGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, poolBottom + 10);
    this.ctx.lineTo(0, baseHeight);
    for (let x = 0; x <= this.canvas.width + 30; x += 30) {
      this.ctx.lineTo(x, waveYFunc(x));
    }
    this.ctx.lineTo(this.canvas.width, poolBottom + 10);
    this.ctx.closePath();
    this.ctx.fill();

    // === LAYER 1.5: Mouse Ripples (water distortion effect) ===
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'overlay'; 
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life -= 0.015;
      if (r.life <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }
      const radius = 20 + (1 - r.life) * 80;
      const alpha = r.life * 0.4;
      
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, radius * 1.1, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
    this.ctx.restore();
    this.ctx.restore();
  }

  _drawFoamHead(waveYFunc) {
    if (this.poolHeight <= 0) return;
    
    const heroEl = document.getElementById('hero');
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : { bottom: this.canvas.height - (this.scrollY || 0) };
    
    const poolBottom = heroRect.bottom + 10;
    const baseHeight = poolBottom - this.poolHeight;

    this.ctx.save();
    
    // === LAYER 2: Foam Head ===
    const time = Date.now() * 0.005;
    const foamThickness = 120 + Math.sin(time * 0.5) * 15;
    const numBubbles = Math.floor(this.canvas.width * 0.45); 
    const pseudoRand = (s) => (Math.sin(s) * 10000) % 1;

    for (let i = 0; i < numBubbles; i++) {
      const rX = Math.abs(pseudoRand(i * 1.34));
      const rY = Math.abs(pseudoRand(i * 2.71));
      const rR = Math.abs(pseudoRand(i * 3.14));
      
      const bx = rX * this.canvas.width;
      const surfaceY = waveYFunc(bx);
      const by = surfaceY - Math.pow(rY, 1.2) * foamThickness + 20;
      const br = 6 + Math.pow(rR, 1.5) * 50; 
      
      this.ctx.drawImage(this.cachedFoam, bx - br, by - br, br * 2, br * 2);
    }

    // === LAYER 3: Specular highlight ===
    this.ctx.strokeStyle = 'rgba(255, 230, 150, 0.6)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let x = 0; x <= this.canvas.width + 30; x += 30) {
      const y = waveYFunc(x) + 2;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  _animate() {
    if (!this.active) return;
    this.animFrameId = requestAnimationFrame(() => this._animate());

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const time = Date.now() * 0.005;
    const waveAmp = this.pouring ? 40 : 15;
    const heroEl = document.getElementById('hero');
    const poolBottom = heroEl ? heroEl.getBoundingClientRect().bottom : this.canvas.height;
    const baseHeight = poolBottom - this.poolHeight;

    const waveY = (x) => {
      return baseHeight 
        + Math.sin(x * 0.01 + time) * waveAmp 
        + Math.sin(x * 0.02 - time * 1.5) * (waveAmp * 0.6)
        + Math.sin(x * 0.005 + time * 2) * (waveAmp * 0.4);
    };

    // Determine spawn rate: ambient + carbonation
    this.spawnRate = 0;
    
    if (this.scrollProgress > 0.12 && this.scrollProgress < 0.65) {
      const peakAt = 0.3;
      const dist = Math.abs(this.scrollProgress - peakAt);
      this.spawnRate += Math.max(0, 3 - dist * 10);
    }
    
    if (this.poolHeight > 10) {
       this.spawnRate += 4; // Constant rising carbonation bubbles
    }

    this.spawnAccum += this.spawnRate;
    this.maxBubbles = 300; // allow more bubbles

    while (this.spawnAccum >= 1 && this.bubbles.length < this.maxBubbles) {
      // If we have a pool, inject carbonation bubbles at its bottom
      if (this.poolHeight > 10 && Math.random() > 0.3) {
         this.bubbles.push(this._createBubble(true, poolBottom));
      } else {
         this.bubbles.push(this._createBubble(false));
      }
      this.spawnAccum -= 1;
    }

    // Spawn pour particles
    if (this.pouring && this.bubbles.length < this.maxBubbles * 4) {
      // Massive splat of blobs every frame
      for (let i = 0; i < 15; i++) {
        this.bubbles.push(this._createPourParticle());
      }
    }

    // 1. Update coordinates and identify dead ones
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      
      if (b.isPour) {
        b.speedY -= 0.4; // gravity
        b.y -= b.speedY; // actually moves down
        b.x += b.speedX;
        b.life -= b.fadeSpeed;
      } else {
        this._updateBubble(b, waveY); // pass wave function so they pop on surface
      }
      
      const isDead = b.life <= 0 || b.radius < 0.5;
      const isOffscreen = b.isPour ? (b.y > poolBottom + b.radius) : (b.y < -b.radius * 2);
      if (isDead || isOffscreen) {
        b.isPour = false; 
        b.isFoam = false;
        this.pool.push(this.bubbles.splice(i, 1)[0]);
      }
    }

    // 3. Draw pink pool liquid FIRST
    this._drawPoolLiquid(waveY);

    // 2. Draw pink pour stream particles BEHIND foam
    for (const b of this.bubbles) {
       this._drawBubble(b);
    }

    // 4. Draw mouse foam trails
    for (let i = this.mouseTrails.length - 1; i >= 0; i--) {
      const t = this.mouseTrails[i];
      t.x += t.vx;
      t.y += t.vy;
      t.life -= 0.015;
      
      if (t.life <= 0) {
        this.mouseTrails.splice(i, 1);
        continue;
      }
      
      this.ctx.globalAlpha = t.life * 0.8;
      this.ctx.drawImage(this.cachedFoam, t.x - t.radius, t.y - t.radius, t.radius * 2, t.radius * 2);
    }
    this.ctx.globalAlpha = 1;

    // 5. Draw Foam Head ON TOP of everything
    this._drawFoamHead(waveY);
  }

  /**
   * Update scroll progress externally (0-1) and raw scroll pixels
   */
  updateScroll(progress, scrollY = 0) {
    this.scrollProgress = progress;
    this.scrollY = scrollY;
  }

  destroy() {
    this.active = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.bubbles = [];
    this.pool = [];
  }
}
