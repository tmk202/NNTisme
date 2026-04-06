import * as THREE from 'three';

export class LiquidText {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    
    this.animFrameId = null;
    this.time = 0;
    
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.targetHover = 0;
    
    this.uniforms = {
      uTexture: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uHover: { value: 0 }
    };
  }

  init() {
    this.container = document.getElementById('liquid-gl-container');
    if (!this.container) return this;

    // 1. Create the text texture
    const textTexture = this._createTextTexture();
    this.uniforms.uTexture.value = textTexture;

    // 2. Setup minimum Three.js orthographic scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 3. Setup Shader Material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec2 uMouse;
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Distance from mouse with aspect ratio correction attempt (assuming roughly 2:1 canvas)
          vec2 adjustedUv = uv;
          adjustedUv.x *= 2.0; 
          vec2 adjustedMouse = uMouse;
          adjustedMouse.x *= 2.0;
          
          float dist = distance(adjustedUv, adjustedMouse);
          
          // Ripple effect
          float ripple = sin(dist * 25.0 - uTime * 6.0) * 0.05;
          
          // Smooth decay away from mouse
          float decay = smoothstep(0.6, 0.0, dist);
          
          // Final distortion amount
          float distortion = ripple * decay * uHover;
          
          vec2 distortedUv = uv + vec2(distortion);
          
          // Mild RGB shift for styling
          float r = texture2D(uTexture, distortedUv + vec2(0.01 * decay * uHover)).r;
          float g = texture2D(uTexture, distortedUv).g;
          float b = texture2D(uTexture, distortedUv - vec2(0.01 * decay * uHover)).b;
          float a = texture2D(uTexture, distortedUv).a;
          
          gl_FragColor = vec4(r, g, b, a);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // 4. Bind Events
    this._bindEvents();

    // 5. Start Loop
    this._animate();

    return this;
  }

  _createTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Font styling
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 900 200px "Outfit", sans-serif';
    
    const x = canvas.width / 2;
    const y1 = canvas.height / 2 - 120;
    const y2 = canvas.height / 2 + 120;

    // Ghost text (shadow/back)
    ctx.fillStyle = 'rgba(232, 25, 44, 0.15)'; // Red ghost
    ctx.fillText('GOOD TIMES', x + 15, y1 + 15);
    ctx.fillText('FLOWING', x + 15, y2 + 15);

    // Main text
    ctx.fillStyle = '#E8192C'; // Red accent
    ctx.fillText('GOOD TIMES', x, y1);
    ctx.fillText('FLOWING', x, y2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - ((e.clientY - rect.top) / rect.height);
      this.targetMouse.set(x, y);
      this.targetHover = 1.0;
    });

    this.container.addEventListener('mouseleave', () => {
      this.targetHover = 0.0;
    });
  }

  _animate() {
    this.animFrameId = requestAnimationFrame(() => this._animate());

    this.time += 0.016; // approx 60fps dt
    this.uniforms.uTime.value = this.time;

    // Lerp mouse and hover intensity for smoothness
    this.uniforms.uMouse.value.lerp(this.targetMouse, 0.1);
    this.uniforms.uHover.value += (this.targetHover - this.uniforms.uHover.value) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  updateScroll(progress) {
    // Optional: hook scroll progress to uniforms here if desired
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.renderer) this.renderer.dispose();
  }
}
