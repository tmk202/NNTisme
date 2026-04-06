/**
 * scene-3d.js
 * Three.js scene with a simple Box placeholder for the seltzer can.
 * The box follows mouse for parallax tilt and transforms on scroll.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export class Scene3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.box = null;
    this.boxGroup = null;

    // Mouse tracking
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };

    // Interaction & Pouring
    this.raycaster = new THREE.Raycaster();
    this.isHovered = false;
    this.onBoxClick = null;
    this.pourAnimationActive = false;

    // Scroll state
    this.scrollState = {
      progress: 0,       // overall 0-1
      sectionIndex: 0,   // current section
      visible: true,
    };

    // Config
    this.config = {
      boxSize: { w: 1.2, h: 2.2, d: 1.2 },
      initialPosition: { x: 0, y: 0, z: 0 },
      mouseInfluence: 0.15,
      rotationSpeed: 0.003,
    };
  }

  init() {
    this._setupScene();
    this._createBox();
    this._setupLights();
    this._bindEvents();
    this._animate();
    return this;
  }

  _setupScene() {
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.z = 6;

    // Renderer — transparent background
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  _createBox() {
    this.boxGroup = new THREE.Group();
    
    // Initial tilt to match the old placeholder's angle
    this.boxGroup.rotation.x = -0.3;
    this.boxGroup.rotation.z = 0.15;
    
    this.scene.add(this.boxGroup);

    const loader = new GLTFLoader();
    loader.load(
      './assets/beer_can.glb',
      (gltf) => {
        const model = gltf.scene;

        // Make sure all parts cast/receive shadows, and use envMap if needed
        model.traverse((child) => {
          if (child.isMesh) {
            // Can tweak material later if needed
          }
        });

        // Center and scale the model automatically based on previous box size roughly 2-3 units
        const box3 = new THREE.Box3().setFromObject(model);
        const center = box3.getCenter(new THREE.Vector3());
        
        // Offset model to center it at 0,0,0
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        // Size it
        const size = box3.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = this.config.boxSize.h * 0.8; // Reduced scale
        const scale = targetSize / maxDim;
        
        model.scale.setScalar(scale);
        
        this.boxGroup.add(model);
      },
      undefined,
      (error) => {
        console.error('Error loading 3D beer can model:', error);
      }
    );
  }

  _setupLights() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 5, 4);
    this.scene.add(keyLight);

    // Fill light (pink tint)
    const fillLight = new THREE.DirectionalLight(0xf5b5d6, 1.0);
    fillLight.position.set(-3, 2, 2);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, -3, -4);
    this.scene.add(rimLight);

    // Top spotlight for specular
    const spotLight = new THREE.SpotLight(0xffffff, 0.6, 20, Math.PI / 6);
    spotLight.position.set(0, 8, 3);
    this.scene.add(spotLight);
  }

  _bindEvents() {
    // Mouse move for parallax tilt
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.boxGroup || this.scrollState.progress > 0.15 || this.pourAnimationActive) {
        if (this.isHovered) {
          this.isHovered = false;
          document.body.style.cursor = 'default';
        }
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.boxGroup.children, true);
      const hovered = intersects.length > 0;
      
      if (hovered !== this.isHovered) {
        this.isHovered = hovered;
        document.body.style.cursor = hovered ? 'pointer' : 'default';
      }
    });

    window.addEventListener('click', () => {
      if (this.isHovered && this.onBoxClick && !this.pourAnimationActive) {
        this.onBoxClick();
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    if (!this.boxGroup) return;

    const { progress } = this.scrollState;

    if (!this.pourAnimationActive) {
      // Mouse-driven parallax tilt + subtle position offset
      this.targetRotation.x = this.mouse.y * this.config.mouseInfluence;
      this.targetRotation.y = this.mouse.x * this.config.mouseInfluence;

      const mouseXOffset = this.mouse.x * 0.45;
      const mouseYOffset = this.mouse.y * 0.35;

      // Smooth lerp toward target
      this.boxGroup.rotation.x += (this.targetRotation.x - 0.3 - this.boxGroup.rotation.x) * 0.05;
      this.boxGroup.rotation.y += (this.targetRotation.y - this.boxGroup.rotation.y) * 0.05;

      // Scroll-based transforms with lerping so animations yield back seamlessly
      if (progress < 0.15) {
        // Hero: gentle floating + mouse parallax
        const targetY = Math.sin(Date.now() * 0.001) * 0.08 + mouseYOffset;
        this.boxGroup.position.y += (targetY - this.boxGroup.position.y) * 0.1;
        this.boxGroup.position.x += (mouseXOffset - this.boxGroup.position.x) * 0.1;
        this.boxGroup.position.z += (0 - this.boxGroup.position.z) * 0.1;
        this.boxGroup.rotation.z += (0.15 - this.boxGroup.rotation.z) * 0.1;
        this.boxGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        this.canvas.style.opacity = 1;
      } else if (progress < 0.3) {
        // Pop: slide to the left to make room for content, zoom slightly
        const rawT = (progress - 0.15) / 0.15;
        // Make the animation finish completely at 40% of the section scroll, so it's waiting for the text
        const t = Math.min(1, rawT / 0.4);
        const easeOut = 1 - Math.pow(1 - t, 4);
        
        this.boxGroup.scale.lerp(new THREE.Vector3(1 + easeOut * 0.38, 1 + easeOut * 0.38, 1 + easeOut * 0.38), 0.1);
        this.boxGroup.position.z += (easeOut * 0.71 - this.boxGroup.position.z) * 0.1;
        this.boxGroup.position.y += (-easeOut * 0.24 - this.boxGroup.position.y) * 0.1;
        
        // Move can exactly to the left
        const targetX = -1.7 * Math.sin(easeOut * Math.PI / 2); 
        this.boxGroup.position.x += (targetX - this.boxGroup.position.x) * 0.1;
        
        // Rotate it gracefully to look good on the side
        this.boxGroup.rotation.x += (-0.2 - this.boxGroup.rotation.x) * 0.1;
        this.boxGroup.rotation.y += (easeOut * 0.21 - this.boxGroup.rotation.y) * 0.1; // Rotate to show body
        this.boxGroup.rotation.z += (0.1 - this.boxGroup.rotation.z) * 0.1;
        
        // Keep it fully visible so users can see the can and the content
        this.canvas.style.opacity = 1;
      } else if (progress < 0.5) {
        // Submerge: hidden
        this.canvas.style.opacity = 0;
      } else if (progress < 0.65) {
        // Liquid type: small floating appearance
        const t = (progress - 0.5) / 0.15;
        this.canvas.style.opacity = t * 0.6;
        this.boxGroup.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
        this.boxGroup.position.lerp(new THREE.Vector3(2, 0, 0), 0.1);
        this.boxGroup.rotation.z += (0.3 - this.boxGroup.rotation.z) * 0.1;
      } else {
        // Flavor + CTA: fade out
        const t = Math.min(1, (progress - 0.65) / 0.1);
        this.canvas.style.opacity = 0.6 * (1 - t);
      }
    }

    // Real-time debug overlay for user tuning
    let debugEl = document.getElementById('debug-can');
    if (!debugEl) {
        debugEl = document.createElement('div');
        debugEl.id = 'debug-can';
        debugEl.style.position = 'fixed';
        debugEl.style.bottom = '20px';
        debugEl.style.right = '20px';
        debugEl.style.backgroundColor = 'rgba(0,0,0,0.85)';
        debugEl.style.color = '#00FF00';
        debugEl.style.padding = '15px';
        debugEl.style.fontFamily = 'monospace';
        debugEl.style.fontSize = '12px';
        debugEl.style.zIndex = '9999';
        debugEl.style.borderRadius = '8px';
        debugEl.style.lineHeight = '1.5';
        debugEl.style.pointerEvents = 'none';
        document.body.appendChild(debugEl);
    }
    debugEl.innerHTML = `
      <b style="color:#FFF">3D CAN STATUS</b><br>
      Scale (pop): ${this.boxGroup.scale.x.toFixed(3)}<br>
      Pos X: ${this.boxGroup.position.x.toFixed(3)}<br>
      Pos Y: ${this.boxGroup.position.y.toFixed(3)}<br>
      Pos Z: ${this.boxGroup.position.z.toFixed(3)}<br>
      Rot X: ${this.boxGroup.rotation.x.toFixed(3)}<br>
      Rot Y: ${this.boxGroup.rotation.y.toFixed(3)}<br>
      Rot Z: ${this.boxGroup.rotation.z.toFixed(3)}<br>
      Scroll Prog: ${progress.toFixed(3)}
    `;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update scroll progress externally
   */
  updateScroll(progress, sectionIndex) {
    this.scrollState.progress = progress;
    this.scrollState.sectionIndex = sectionIndex;
  }

  destroy() {
    this.renderer.dispose();
    this.scene.clear();
  }
}
