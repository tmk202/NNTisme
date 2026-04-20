/**
 * ==========================================
 * MOUNTAIN JOURNEY: SCROLLYTELLING 2.5D EPIC
 * Bản Thiết Kế Núi Thủ Công (Procedural High-Poly Silhouette)
 * MỞ RỘNG: Pseudo-IK (Động học ngược đắp chân), Slim Human Proportions
 * ==========================================
 */

class MountainJourney {
    constructor() {
        this.container = document.getElementById('game-canvas-container');
        this.scene = new THREE.Scene();
        
        this.setupSeasons();
        this.setupMilestones(); // Các mốc sự nghiệp

        this.scene.background = this.seasons[0].bg.clone(); 
        this.scene.fog = new THREE.FogExp2(this.seasons[0].fog.getHex(), this.seasons[0].fogDensity); 
        
        this.debugEl = document.getElementById('cameraDebug');

        this.isChangingClothes = false; // Trạng thái dừng lại thay đồ
        this.changeTimer = 0;
        this.lastPhase = 0;

        this.fgGroup = new THREE.Group();
        this.mgGroup = new THREE.Group();
        this.bgGroup = new THREE.Group();
        this.scene.add(this.bgGroup, this.mgGroup, this.fgGroup);

        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        
        this.buildBackground();
        this.buildMiddlegroundSlope();
        this.buildDetails();
        this.buildCharacter();
        this.buildSeasonalDecorations();
        this.buildForeground();
        this.buildAtmosphere();

        this.setupControls();
        this.setupScroll(); 

        window.addEventListener('resize', this.onResize.bind(this));
    }

    setupSeasons() {
        this.seasons = [
            { name: 'XUÂN', bg: new THREE.Color('#99f6e4'), fog: new THREE.Color('#99f6e4'), light: new THREE.Color('#fcd34d'), particleColor: new THREE.Color('#fdf2f8'), fogDensity: 0.0008, weather: 'sunny' },
            { name: 'HẠ',   bg: new THREE.Color('#fdba74'), fog: new THREE.Color('#fdba74'), light: new THREE.Color('#fef08a'), particleColor: new THREE.Color('#ffedd5'), fogDensity: 0.0005, weather: 'rainy' },
            { name: 'THU',  bg: new THREE.Color('#f97316'), fog: new THREE.Color('#f97316'), light: new THREE.Color('#fb923c'), particleColor: new THREE.Color('#ea580c'), fogDensity: 0.001, weather: 'rainy' },
            { name: 'ĐÔNG', bg: new THREE.Color('#0f172a'), fog: new THREE.Color('#0f172a'), light: new THREE.Color('#94a3b8'), particleColor: new THREE.Color('#ffffff'), fogDensity: 0.0012, weather: 'snowy' }
        ];
    }

    setupMilestones() {
        this.milestones = [
            { x: -100, title: "KHỞI ĐẦU", year: "2021", detail: "Junior Dev" },
            { x:  150, title: "BỨC PHÁ",  year: "2023", detail: "Fullstack Leader" },
            { x:  400, title: "LÃNH ĐẠO", year: "2024", detail: "CTO Startup" },
            { x:  680, title: "ĐỈNH CAO", year: "2026", detail: "AI Architect" }
        ];
    }

    setupScroll() {
        this.scrollProgress = 0;
        this.autoWalkSpeed = 0.03; 
        document.body.style.overflow = 'hidden'; 
        this.lastTime = performance.now() * 0.001;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(18, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.position.set(-45.93, 128.57, 151.08); 
    }

    setupRenderer() {
        this.container.innerHTML = ''; 
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const hemiLight = new THREE.HemisphereLight('#fef08a', '#0f172a', 0.8); 
        this.scene.add(hemiLight);

        this.dirLight = new THREE.DirectionalLight(this.seasons[0].light.getHex(), 2.0); 
        this.dirLight.position.set(120, 100, 60); 
        this.dirLight.castShadow = true;
        
        const d = 150;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.camera.far = 1000;
        this.dirLight.shadow.bias = -0.001;
        this.scene.add(this.dirLight);

        const rimLight = new THREE.DirectionalLight('#c084fc', 1.0); 
        rimLight.position.set(-100, 20, -100);
        this.scene.add(rimLight);
    }

    getMountainTopography(worldX, worldZ) {
        const vx = worldX;
        const vy = -worldZ;
        // Spine uốn lượn hùng vĩ hơn
        const spineOffset = Math.sin(vx * 0.045) * 24 + Math.sin(vx * 0.012) * 30;
        const distFromSpine = Math.abs(vy - spineOffset);

        const plateauWidth = 18; // Đường sống núi hẹp hơn → sắc cạnh low-poly rõ nét
        const distFromPeak = Math.abs(vx - 100);

        // Đỉnh núi chính
        const peakHeight = 140 * Math.exp(-Math.pow(distFromPeak / 250, 2));
        // Đỉnh phụ làm mượt hơn để tránh dốc gắt (giảm biên độ)
        const secondPeak = 40 * Math.exp(-Math.pow((vx + 60) / 120, 2));
        const thirdPeak  = 25 * Math.exp(-Math.pow((vx + 130) / 100, 2));
        // Vertebrae (nhịp gập ghềnh) kéo giãn và làm thấp hơn để tránh dốc cục bộ > 35 độ
        const vertebrae  = Math.sin(vx * 0.04) * 6 + Math.sin(vx * 0.1) * 3;

        const smoothFactor = Math.min(1, Math.pow(Math.max(0, distFromSpine - 8) / 12, 2));

        // Sườn dốc thoải hơn, không quá dựng đứng
        const ridgeSharpness = 55;
        const abyssDrop = Math.pow(Math.max(0, distFromSpine - plateauWidth) / ridgeSharpness, 1.25) * 110;

        // Thêm nhiễu góc cạnh trên sườn
        const craggy = (Math.sin(vx * 1.8) * Math.cos(vy * 1.5) * 4
                      + Math.sin(vx * 0.9) * Math.cos(vy * 1.1) * 3) * smoothFactor;
        const jagged  = Math.sin(vx * 1.3) * Math.cos(vy * 0.7) * 2 * smoothFactor;

        return {
            height: peakHeight + secondPeak + thirdPeak + vertebrae - abyssDrop + jagged + craggy,
            spineZ: -spineOffset
        };
    }

    getSpineTopography(worldX) {
        const spineOffset = Math.sin(worldX * 0.045) * 24 + Math.sin(worldX * 0.012) * 30;
        const distFromPeak = Math.abs(worldX - 100);
        
        const peakHeight = 140 * Math.exp(-Math.pow(distFromPeak / 250, 2));
        const secondPeak = 40 * Math.exp(-Math.pow((worldX + 60) / 120, 2));
        const thirdPeak  = 25 * Math.exp(-Math.pow((worldX + 130) / 100, 2));
        const vertebrae  = Math.sin(worldX * 0.04) * 6 + Math.sin(worldX * 0.1) * 3;
        
        // Nhiễu trên mặt đường mòn cực nhỏ để tránh nhấp nhô gây lún chân
        const smoothedJagged = Math.sin(worldX * 0.4) * Math.cos(spineOffset * 0.4) * 0.2;

        return {
            x: worldX,
            y: peakHeight + secondPeak + thirdPeak + vertebrae + smoothedJagged,
            z: -spineOffset
        };
    }

    buildMiddlegroundSlope() {
        // === LỚP NÚI CHÍNH: Giảm số segments xuống để lưới Grid vuông vức (200x140) => đúng chất Low Poly thay vì bị kéo dãn! ===
        const geo = new THREE.PlaneGeometry(2200, 600, 500, 150);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const topo = this.getMountainTopography(vx, -vy);
            pos.setZ(i, topo.height);
        }
        geo.computeVertexNormals();
        // Màu đá lạnh xanh-tím đặc trưng low-poly art
        const mat = new THREE.MeshStandardMaterial({ color: '#1b2b40', roughness: 0.95, flatShading: true });
        this.mainMountain = new THREE.Mesh(geo, mat);
        this.mainMountain.rotation.x = -Math.PI / 2;
        this.mainMountain.castShadow = true;
        this.mainMountain.receiveShadow = true;
        this.mgGroup.add(this.mainMountain);

        // === LỚP TUYẾT TRÊN ĐỈNH: Khớp segments với mesh gốc ===
        const snowGeo = new THREE.PlaneGeometry(2200, 600, 500, 150);
        const snowPos = snowGeo.attributes.position;
        const snowThreshold = 80; // Tuyết chỉ phủ trên độ cao 80
        for (let i = 0; i < snowPos.count; i++) {
            const vx = snowPos.getX(i);
            const vy = snowPos.getY(i);
            const topo = this.getMountainTopography(vx, -vy);
            const h = topo.height;
            // Nâng lớp tuyết cao hơn mặt đá 0.3 unit & chỉ giữ vùng cao
            snowPos.setZ(i, h > snowThreshold ? h + 0.3 : -999);
        }
        snowGeo.computeVertexNormals();
        const snowMat = new THREE.MeshStandardMaterial({
            color: '#e8f4ff', emissive: '#a8d4f0', emissiveIntensity: 0.12,
            roughness: 0.4, flatShading: true, transparent: true, opacity: 0.92
        });
        const snowCap = new THREE.Mesh(snowGeo, snowMat);
        snowCap.rotation.x = -Math.PI / 2;
        snowCap.position.y = 0.2;
        this.mgGroup.add(snowCap);

        // === LỚP ĐÁ MID-GROUND: Dải núi trung cảnh cách xa để tạo parallax ===
        const midGeo = new THREE.PlaneGeometry(2600, 300, 450, 60);
        const midPos = midGeo.attributes.position;
        for (let i = 0; i < midPos.count; i++) {
            const vx = midPos.getX(i) * 0.6; // Thu nhỏ theo X để khớp tỉ lệ xa
            const vy = midPos.getY(i);
            const topo = this.getMountainTopography(vx, -vy * 0.8);
            // Lớp này thấp hơn (scale 0.5) và đặt lui sau
            midPos.setZ(i, topo.height * 0.55 - 20);
        }
        midGeo.computeVertexNormals();
        const midMat = new THREE.MeshStandardMaterial({ color: '#263a52', roughness: 1.0, flatShading: true });
        const midLayer = new THREE.Mesh(midGeo, midMat);
        midLayer.rotation.x = -Math.PI / 2;
        midLayer.position.set(0, -2, -80); // Đặt lui sau núi chính
        this.mgGroup.add(midLayer);
    }

    buildDetails() {
        const dummy = new THREE.Object3D();

        // === TẢNG ĐÁ LỚN (Boulders) - Nổi bật trên sườn núi ===
        const boulderCount = 80;
        const boulderGeo = new THREE.IcosahedronGeometry(1, 0); // Low-poly cực đỉnh
        const boulderMat = new THREE.MeshStandardMaterial({ color: '#0d1f31', roughness: 1.0, flatShading: true });
        const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCount);
        boulders.castShadow = true; boulders.receiveShadow = true;
        for (let i = 0; i < boulderCount; i++) {
            const rx = -180 + Math.random() * 1060;
            const topo = this.getMountainTopography(rx, 0);
            // Ép đá lệch sang hai bên ít nhất 10 unit so với trục đường
            const sideOffset = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 25);
            const ry = -topo.spineZ + sideOffset;
            const topoFinal = this.getMountainTopography(rx, -ry);
            dummy.position.set(rx, topoFinal.height - 1, -ry);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            // Đá to: mix giữa khối vuông và khổng lồ
            const bSize = 2.5 + Math.random() * 6.5;
            dummy.scale.set(bSize * (0.7 + Math.random() * 0.6), bSize * (0.5 + Math.random() * 0.8), bSize * (0.7 + Math.random() * 0.6));
            dummy.updateMatrix();
            boulders.setMatrixAt(i, dummy.matrix);
        }
        this.mgGroup.add(boulders);

        // === ĐÁ VỪA (Rubble) - Rải khắp sườn ===
        const rockCount = 200;
        const rockGeo = new THREE.DodecahedronGeometry(1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: '#162132', roughness: 0.95, flatShading: true });
        const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
        rocks.castShadow = true; rocks.receiveShadow = true;
        for (let i = 0; i < rockCount; i++) {
            const rx = -180 + Math.random() * 1060;
            const topo = this.getMountainTopography(rx, 0);
            // Ép đá dăm lệch sang hai bên
            const sideOffset = (Math.random() > 0.5 ? 1 : -1) * (9 + Math.random() * 30);
            const ry = -topo.spineZ + sideOffset;
            const topoFinal = this.getMountainTopography(rx, -ry);
            dummy.position.set(rx, topoFinal.height - 0.5, -ry);
            dummy.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
            const rSize = 0.8 + Math.random() * 2.8;
            dummy.scale.set(rSize, rSize * (0.4 + Math.random() * 0.8), rSize);
            dummy.updateMatrix();
            rocks.setMatrixAt(i, dummy.matrix);
        }
        this.mgGroup.add(rocks);

        // === KHỐI ĐÁ SÁNG (Accent rocks - màu xám sáng để tạo tương phản) ===
        const accentCount = 40;
        const accentGeo = new THREE.TetrahedronGeometry(1, 0); // Tứ diện - rất low-poly nhọn
        const accentMat = new THREE.MeshStandardMaterial({
            color: '#3d5a73', emissive: '#1a3040', emissiveIntensity: 0.3, roughness: 0.7, flatShading: true
        });
        const accents = new THREE.InstancedMesh(accentGeo, accentMat, accentCount);
        accents.castShadow = true;
        for (let i = 0; i < accentCount; i++) {
            const rx = -180 + Math.random() * 1060;
            const topo = this.getMountainTopography(rx, 0);
            const sideOffset = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 20);
            const ry = -topo.spineZ + sideOffset;
            const topoFinal = this.getMountainTopography(rx, -ry);
            // Chỉ đặt accent rocks ở vùng cao (gần đỉnh)
            if (topoFinal.height > 40) {
                dummy.position.set(rx, topoFinal.height, -ry);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                const aSize = 3 + Math.random() * 8;
                dummy.scale.set(aSize * 0.6, aSize, aSize * 0.6);
                dummy.updateMatrix();
                accents.setMatrixAt(i, dummy.matrix);
            }
        }
        this.mgGroup.add(accents);

        // --- DỰNG CÁC MỐC HOLOGAM ---
        this.markers = [];
        this.milestones.forEach(m => {
            const topo = this.getSpineTopography(m.x);
            const mGroup = new THREE.Group();
            mGroup.position.set(m.x, topo.y + 12, topo.z);

            const crystalGeo = new THREE.OctahedronGeometry(2, 0);
            const crystalMat = new THREE.MeshStandardMaterial({ 
                color: '#60a5fa', emissive: '#3b82f6', emissiveIntensity: 2, transparent: true, opacity: 0.7 
            });
            const crystal = new THREE.Mesh(crystalGeo, crystalMat);
            mGroup.add(crystal);
            
            // Neon Ring
            const ringGeo = new THREE.TorusGeometry(3.5, 0.1, 16, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: '#60a5fa' });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            mGroup.add(ring);

            this.mgGroup.add(mGroup);
            this.markers.push({ group: mGroup, data: m });
        });

        // --- HỆ THỐNG HẠT BỤI CHÂN (FOOTSTEP PARTICLES) ---
        const fsGeo = new THREE.BufferGeometry();
        const fsCount = 100;
        const fsPos = new Float32Array(fsCount * 3);
        this.fsVel = new Float32Array(fsCount * 3);
        this.fsLife = new Float32Array(fsCount);
        for(let i=0; i<fsCount; i++) this.fsLife[i] = -1; // trạng thái chết

        fsGeo.setAttribute('position', new THREE.BufferAttribute(fsPos, 3));
        this.fsPoints = new THREE.Points(fsGeo, new THREE.PointsMaterial({ 
            size: 0.6, transparent: true, opacity: 0.8, color: '#ffffff' 
        }));
        this.mgGroup.add(this.fsPoints);
    }

    buildSeasonalDecorations() {
        const startX = -180;
        const endX = 820;
        const step = 4.0; // Tăng mật độ cây một chút

        const trunkMat = new THREE.MeshStandardMaterial({ color: '#4d2c19', roughness: 0.9 });
        
        for (let x = startX; x < endX; x += step) {
            const topo = this.getSpineTopography(x);
            // Ép cây mọc sang 2 bên sườn núi (tránh lối đi 7 unit ở giữa)
            const side = Math.random() > 0.5 ? 1 : -1;
            const sideOffset = side * (7 + Math.random() * 25); 
            const z = topo.z + sideOffset;
            const y = this.getMountainTopography(x, z).height;

            const group = new THREE.Group();
            group.position.set(x, y, z);
            group.rotation.y = Math.random() * Math.PI;
            
            // Tỷ lệ to nhỏ ngẫu nhiên cực đại (từ cây mầm đến đại thụ)
            const s = 0.5 + Math.pow(Math.random(), 2) * 2.2;
            group.scale.set(s, s, s);

            const progress = (x - startX) / (endX - startX);

            if (progress < 0.25) { // === XUÂN ===
                const rand = Math.random();

                if (rand > 0.65) {
                    // HOA ANH DAO (Sakura) — tan cau hong nhieu lop
                    const lightBarkMat = new THREE.MeshStandardMaterial({ color: '#6b3c2a', roughness: 0.85 });
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 5, 6), lightBarkMat);
                    trunk.position.y = 2.5; group.add(trunk);

                    const pinkMat  = new THREE.MeshStandardMaterial({ color: '#f9a8d4', roughness: 0.75, flatShading: true });
                    const whiteMat = new THREE.MeshStandardMaterial({ color: '#fce7f3', roughness: 0.75, flatShading: true });

                    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 0), pinkMat);
                    core.position.y = 5.2;
                    core.rotation.set(Math.random(), Math.random(), Math.random());
                    group.add(core);

                    for (let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI * 2;
                        const mat   = i % 2 === 0 ? pinkMat : whiteMat;
                        const r     = 1.2 + Math.random() * 0.4;
                        const sub   = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
                        sub.position.set(Math.sin(angle) * 1.9, 4.8 + (Math.random() - 0.5) * 1.0, Math.cos(angle) * 1.9);
                        sub.rotation.set(Math.random(), Math.random(), Math.random());
                        group.add(sub);
                    }
                    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), whiteMat);
                    top.position.y = 7.0;
                    top.rotation.set(Math.random(), Math.random(), Math.random());
                    group.add(top);

                } else if (rand > 0.32) {
                    // LIEU THUY DUONG (Weeping Willow) — tan ellipse ru xuong
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.32, 6, 6), trunkMat);
                    trunk.position.y = 3; trunk.rotation.z = 0.06; group.add(trunk);

                    const freshGreen = new THREE.MeshStandardMaterial({ color: '#86efac', roughness: 0.9, flatShading: true });
                    const lightGreen = new THREE.MeshStandardMaterial({ color: '#bbf7d0', roughness: 0.9, flatShading: true });

                    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), freshGreen);
                    canopy.position.y = 6.5;
                    canopy.scale.set(1.0, 0.55, 1.0);
                    canopy.rotation.set(Math.random(), Math.random(), Math.random());
                    group.add(canopy);

                    for (let i = 0; i < 7; i++) {
                        const angle  = (i / 7) * Math.PI * 2;
                        const radius = 2.0 + Math.random() * 0.5;
                        const drop   = Math.random() * 1.4;
                        const mat    = i % 3 === 0 ? lightGreen : freshGreen;
                        const leaf   = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 + Math.random() * 0.3, 0), mat);
                        leaf.position.set(Math.sin(angle) * radius, 5.8 - drop, Math.cos(angle) * radius);
                        leaf.scale.set(0.9, 1.6, 0.9);
                        leaf.rotation.set(Math.random() * 0.3, Math.random(), Math.random() * 0.3);
                        group.add(leaf);
                    }

                } else {
                    // BUI HOA XUAN — bui tron + hoa diem xuyet
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 3, 5), trunkMat);
                    trunk.position.y = 1.5; group.add(trunk);

                    const foliageMat = new THREE.MeshStandardMaterial({ color: '#d9f99d', roughness: 0.85, flatShading: true });
                    const flowerMat1 = new THREE.MeshStandardMaterial({ color: '#f0abfc', roughness: 0.8,  flatShading: true });
                    const flowerMat2 = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.8,  flatShading: true });

                    const base = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 0), foliageMat);
                    base.position.y = 3.4;
                    base.scale.set(1.0, 0.8, 1.0);
                    base.rotation.set(Math.random(), Math.random(), Math.random());
                    group.add(base);

                    [-1.4, 1.4].forEach((ox) => {
                        const side = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), foliageMat);
                        side.position.set(ox, 2.8 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8);
                        side.scale.set(1.0, 0.75, 1.0);
                        side.rotation.set(Math.random(), Math.random(), Math.random());
                        group.add(side);
                    });

                    for (let i = 0; i < 5; i++) {
                        const mat    = i % 2 === 0 ? flowerMat1 : flowerMat2;
                        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mat);
                        flower.position.set((Math.random() - 0.5) * 2.8, 4.0 + Math.random() * 1.0, (Math.random() - 0.5) * 2.8);
                        flower.rotation.set(Math.random(), Math.random(), Math.random());
                        group.add(flower);
                    }
                }
                
            } else if (progress < 0.5) { // === HẠ ===
                const rand = Math.random();
                if (rand > 0.6) { // Cây Thông (Pine tree)
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 6, 5), trunkMat);
                    trunk.position.y = 3; group.add(trunk);
                    const pineMat = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9, flatShading: true });
                    for(let i=0; i<3; i++) {
                        // 5 segments for low-poly cone
                        const layer = new THREE.Mesh(new THREE.ConeGeometry(2.8 - i*0.6, 3.8, 5), pineMat);
                        layer.position.y = 4.5 + i*1.8;
                        layer.rotation.y = Math.random() * Math.PI;
                        group.add(layer);
                    }
                } else if (rand > 0.3) { // Cây Sồi (Oak)
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4, 5), trunkMat);
                    trunk.position.y = 2; group.add(trunk);
                    const oakMat = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.8, flatShading: true });
                    for(let i=0; i<3; i++) {
                        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 0), oakMat);
                        leaf.position.set((Math.random()-0.5)*1.5, 3.8 + i, (Math.random()-0.5)*1.5);
                        leaf.rotation.set(Math.random(), Math.random(), Math.random());
                        group.add(leaf);
                    }
                } else { // Bụi cỏ lởm chởm
                    const bushMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.9, flatShading: true });
                    for(let i=0; i<4; i++) {
                        const bush = new THREE.Mesh(new THREE.TetrahedronGeometry(1.5 + Math.random(), 0), bushMat);
                        bush.position.set((Math.random()-0.5)*3, 0.5+Math.random(), (Math.random()-0.5)*3);
                        bush.rotation.set(Math.random(), Math.random(), Math.random());
                        group.add(bush);
                    }
                }
            } else if (progress < 0.75) { // === THU ===
                const isYellow = Math.random() > 0.5;
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 5), trunkMat);
                trunk.position.y = 2; group.add(trunk);

                const leafColor = isYellow ? '#f59e0b' : '#b91c1c'; 
                const fallMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.9, flatShading: true });
                for(let i=0; i<4; i++) {
                    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), fallMat);
                    leaf.position.set(Math.sin(i*1.5)*1.4, 4.2 + i*0.6, Math.cos(i*1.5)*1.4);
                    leaf.rotation.set(Math.random(), Math.random(), Math.random());
                    group.add(leaf);
                }
            } else { // === ĐÔNG ===
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 6, 5), trunkMat);
                trunk.position.y = 3; group.add(trunk);
                const snowPineMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6, flatShading: true });
                for(let i=0; i<3; i++) {
                    const layer = new THREE.Mesh(new THREE.ConeGeometry(2.6 - i*0.5, 4, 5), snowPineMat);
                    layer.position.y = 5 + i*2.0;
                    layer.rotation.y = Math.random() * Math.PI;
                    group.add(layer);
                }
                const rockExtra = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), new THREE.MeshStandardMaterial({ color: '#e2e8f0', flatShading: true }));
                rockExtra.position.set((Math.random()-0.5)*2, 0.5, (Math.random()-0.5)*2);
                rockExtra.rotation.set(Math.random(), Math.random(), Math.random());
                group.add(rockExtra);
            }
            this.mgGroup.add(group);
        }
    }

    buildCharacter() {
        this.characterGroup = new THREE.Group();
        
        // === VẬT LIỆU ===
        this.suitColors = ['#1a2744', '#f8fafc', '#1a2744', '#0f172a']; // Xuân (Navi), Hạ (White Sơ mi), Thu (Navi), Đông (Đen dày)
        this.suitMat      = new THREE.MeshStandardMaterial({ color: this.suitColors[0], roughness: 0.85 });
        this.suitLightMat = new THREE.MeshStandardMaterial({ color: '#243260', roughness: 0.8 });
        const shirtMat    = new THREE.MeshStandardMaterial({ color: '#f0f4ff', roughness: 0.9 });
        const tieMat      = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.6 });
        const skinMat     = new THREE.MeshStandardMaterial({ color: '#e8a87c', roughness: 0.5 });
        const shoesMat    = new THREE.MeshStandardMaterial({ color: '#0a0a12', roughness: 0.3, metalness: 0.2 });
        const hairMat     = new THREE.MeshStandardMaterial({ color: '#1a0a00', roughness: 0.9 });
        const briefMat    = new THREE.MeshStandardMaterial({ color: '#3b1a08', roughness: 0.7 });
        this.sweatMat     = new THREE.MeshStandardMaterial({ color: '#aedff7', transparent: true, opacity: 0.75 });

        // === THÂN ===
        this.torso = new THREE.Group();
        const waistGeo = new THREE.BoxGeometry(2.2, 1.5, 1.2);
        const waist = new THREE.Mesh(waistGeo, this.suitMat);
        waist.castShadow = true;
        this.torso.add(waist);

        const chestGeo = new THREE.BoxGeometry(2.6, 2.2, 1.4);
        this.chestMesh = new THREE.Mesh(chestGeo, this.suitMat);
        this.chestMesh.position.set(0, 0.8, 0);
        this.chestMesh.castShadow = true;
        this.torso.add(this.chestMesh);

        // Khăn len (Ẩn mặc định, chỉ hiện mùa Đông)
        const scarfGeo = new THREE.TorusGeometry(0.8, 0.3, 8, 16);
        this.scarf = new THREE.Mesh(scarfGeo, new THREE.MeshStandardMaterial({ color: '#991b1b' }));
        this.scarf.rotation.x = Math.PI / 2;
        this.scarf.position.set(0, 2, 0);
        this.scarf.visible = false;
        this.torso.add(this.scarf);

        // Ve áo trắng (Lapels)
        const lapelLGeo = new THREE.BoxGeometry(0.5, 1.4, 0.15);
        const lapelL = new THREE.Mesh(lapelLGeo, shirtMat);
        lapelL.position.set(-0.55, 0.9, 0.72);
        lapelL.rotation.z = 0.18;
        this.torso.add(lapelL);
        const lapelR = new THREE.Mesh(lapelLGeo, shirtMat);
        lapelR.position.set(0.55, 0.9, 0.72);
        lapelR.rotation.z = -0.18;
        this.torso.add(lapelR);

        // Cà vạt đỏ mỏng (gió tốc lên khi leo)
        const tieGeo = new THREE.BoxGeometry(0.32, 2.2, 0.1);
        this.tieMesh = new THREE.Mesh(tieGeo, tieMat);
        this.tieMesh.position.set(0, 0.6, 0.73);
        this.torso.add(this.tieMesh);

        // Cổ
        const neckGeo = new THREE.BoxGeometry(0.8, 0.7, 0.75);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.set(0, 2.0, 0);
        this.torso.add(neck);

        // === ĐẦU + MẶT ===
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 2.65, 0);

        const headGeo = new THREE.BoxGeometry(1.6, 1.8, 1.55);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.castShadow = true;
        this.headGroup.add(head);

        // Tóc
        const hairTopGeo = new THREE.BoxGeometry(1.75, 0.5, 1.65);
        const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
        hairTop.position.set(0, 1.0, 0);
        this.headGroup.add(hairTop);
        const hairBackGeo = new THREE.BoxGeometry(1.65, 1.2, 0.3);
        const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
        hairBack.position.set(0, 0.4, -0.8);
        this.headGroup.add(hairBack);

        // Lông mày nhíu (Struggling)
        const browGeo = new THREE.BoxGeometry(0.55, 0.14, 0.14);
        const browL = new THREE.Mesh(browGeo, hairMat);
        browL.position.set(-0.42, 0.42, 0.78);
        browL.rotation.z = -0.40;
        const browR = new THREE.Mesh(browGeo, hairMat);
        browR.position.set(0.42, 0.42, 0.78);
        browR.rotation.z = 0.40;
        this.headGroup.add(browL, browR);

        // Mắt nhắm nghiền cố sức
        const eyeGeo = new THREE.BoxGeometry(0.46, 0.1, 0.12);
        const eyeL = new THREE.Mesh(eyeGeo, hairMat);
        eyeL.position.set(-0.42, 0.16, 0.79);
        eyeL.rotation.z = -0.15;
        const eyeR = new THREE.Mesh(eyeGeo, hairMat);
        eyeR.position.set(0.42, 0.16, 0.79);
        eyeR.rotation.z = 0.15;
        this.headGroup.add(eyeL, eyeR);

        // Miệng mở hé ra thở dốc
        const jawGeo = new THREE.BoxGeometry(0.9, 0.22, 0.12);
        const jaw = new THREE.Mesh(jawGeo, new THREE.MeshStandardMaterial({ color: '#c0392b' }));
        jaw.position.set(0, -0.45, 0.79);
        this.headGroup.add(jaw);
        const teethGeo = new THREE.BoxGeometry(0.82, 0.1, 0.13);
        const teeth = new THREE.Mesh(teethGeo, new THREE.MeshStandardMaterial({ color: '#f5f5f5' }));
        teeth.position.set(0, -0.38, 0.80);
        this.headGroup.add(teeth);

        // Mồ hôi (3 giọt)
        const swGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const sw1 = new THREE.Mesh(swGeo, this.sweatMat); sw1.position.set(0.78, 0.3, 0.55); this.headGroup.add(sw1);
        const sw2 = new THREE.Mesh(swGeo, this.sweatMat); sw2.position.set(-0.70, 0.0, 0.65); this.headGroup.add(sw2);
        const sw3 = new THREE.Mesh(swGeo, this.sweatMat); sw3.position.set(0.60, -0.3, 0.72); this.headGroup.add(sw3);

        this.torso.add(this.headGroup);

        // === TAY TRÁI: BẮP TAY + KHUỶU + CẲNG TAY + BÀN TAY ===
        // Bắp tay trái (gắn vào vai)
        this.upperArmL = new THREE.Group();
        this.upperArmL.position.set(-1.55, 1.4, 0);
        const uArmGeo = new THREE.BoxGeometry(0.65, 2.0, 0.65);
        const uArmLMesh = new THREE.Mesh(uArmGeo, this.suitLightMat);
        uArmLMesh.position.set(0, -0.9, 0); // trục xoay ở vai
        uArmLMesh.castShadow = true;
        this.upperArmL.add(uArmLMesh);

        // Khuỷu tay trái (gắn vào đầu dưới bắp tay)
        this.elbowL = new THREE.Group();
        this.elbowL.position.set(0, -1.9, 0);
        const lArmGeo = new THREE.BoxGeometry(0.56, 1.7, 0.56);
        const lArmLMesh = new THREE.Mesh(lArmGeo, skinMat);
        lArmLMesh.position.set(0, -0.75, 0);
        lArmLMesh.castShadow = true;
        this.elbowL.add(lArmLMesh);
        // Bàn tay trái
        const handGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
        const handL = new THREE.Mesh(handGeo, skinMat);
        handL.position.set(0, -1.65, 0);
        this.elbowL.add(handL);
        this.upperArmL.add(this.elbowL);
        this.torso.add(this.upperArmL);

        // === TAY PHẢI: BẮP TAY + KHUỶU + CẲNG TAY + BÀN TAY + CẶP TÁP ===
        this.upperArmR = new THREE.Group();
        this.upperArmR.position.set(1.55, 1.4, 0);
        const uArmRMesh = new THREE.Mesh(uArmGeo, this.suitLightMat);
        uArmRMesh.position.set(0, -0.9, 0);
        uArmRMesh.castShadow = true;
        this.upperArmR.add(uArmRMesh);

        this.elbowR = new THREE.Group();
        this.elbowR.position.set(0, -1.9, 0);
        const lArmRMesh = new THREE.Mesh(lArmGeo, skinMat);
        lArmRMesh.position.set(0, -0.75, 0);
        lArmRMesh.castShadow = true;
        this.elbowR.add(lArmRMesh);
        const handR = new THREE.Mesh(handGeo, skinMat);
        handR.position.set(0, -1.65, 0);
        this.elbowR.add(handR);
        // Cặp táp
        const briefGeo = new THREE.BoxGeometry(2.0, 1.3, 0.5);
        const briefcase = new THREE.Mesh(briefGeo, briefMat);
        briefcase.position.set(0, -2.5, 0);
        briefcase.castShadow = true;
        this.elbowR.add(briefcase);
        this.upperArmR.add(this.elbowR);
        this.torso.add(this.upperArmR);

        // === CHÂN TRÁI: ĐÙI + ĐẦU GỐI + CẲNG CHÂN + BÀN CHÂN ===
        this.thighL = new THREE.Group();
        this.thighL.position.set(-0.65, -1.5, 0);
        const thighGeo = new THREE.BoxGeometry(0.85, 2.4, 0.85);
        const thighLMesh = new THREE.Mesh(thighGeo, this.suitMat);
        thighLMesh.position.set(0, -1.1, 0); 
        thighLMesh.castShadow = true;
        this.thighL.add(thighLMesh);

        this.kneeL = new THREE.Group();
        this.kneeL.position.set(0, -2.3, 0);
        const shinGeo = new THREE.BoxGeometry(0.72, 2.2, 0.72);
        const shinLMesh = new THREE.Mesh(shinGeo, this.suitMat);
        shinLMesh.position.set(0, -1.0, 0);
        shinLMesh.castShadow = true;
        this.kneeL.add(shinLMesh);
        const shoeGeo = new THREE.BoxGeometry(1.05, 0.55, 1.6);
        const shoeL = new THREE.Mesh(shoeGeo, shoesMat);
        shoeL.position.set(0, -2.1, 0.25);
        this.kneeL.add(shoeL);
        this.thighL.add(this.kneeL);
        this.torso.add(this.thighL);

        // === CHÂN PHẢI: ĐÙI + ĐẦU GỐI + CẲNG CHÂN + BÀN CHÂN ===
        this.thighR = new THREE.Group();
        this.thighR.position.set(0.65, -1.5, 0);
        const thighRMesh = new THREE.Mesh(thighGeo, this.suitMat);
        thighRMesh.position.set(0, -1.1, 0);
        thighRMesh.castShadow = true;
        this.thighR.add(thighRMesh);

        this.kneeR = new THREE.Group();
        this.kneeR.position.set(0, -2.3, 0);
        const shinRMesh = new THREE.Mesh(shinGeo, this.suitMat);
        shinRMesh.position.set(0, -1.0, 0);
        shinRMesh.castShadow = true;
        this.kneeR.add(shinRMesh);
        const shoeR = new THREE.Mesh(shoeGeo, shoesMat);
        shoeR.position.set(0, -2.1, 0.25);
        this.kneeR.add(shoeR);
        this.thighR.add(this.kneeR);
        this.torso.add(this.thighR);

        // === TRỤC XOAY VÀ TỶ LỆ ===
        this.characterGroup.rotation.order = "YXZ";
        this.characterGroup.rotation.y = Math.PI / 2;

        this.characterWrapper = new THREE.Group();
        this.characterWrapper.add(this.torso);
        this.characterGroup.add(this.characterWrapper);
        this.characterGroup.scale.set(1.3, 1.3, 1.3);
        this.mgGroup.add(this.characterGroup);
    }

    buildBackground() {
        // === TẦNG NÚI XA XÔI (Silhouette Hùng Vĩ) ===
        const mtMat = new THREE.MeshStandardMaterial({ roughness: 1.0, flatShading: true });
        
        for (let i = 0; i < 40; i++) {
            const group = new THREE.Group();
            const type = Math.random();
            let geo;
            let color;
            let pos;

            if (type > 0.6) { // Núi xa nhất - nhọn hoắt
                geo = new THREE.ConeGeometry(150 + Math.random() * 200, 400 + Math.random() * 400, 3);
                color = '#0d1b2a';
                pos = new THREE.Vector3((Math.random() - 0.5) * 3000, -150, -1000 - Math.random() * 800);
            } else if (type > 0.3) { // Núi trung cảnh - 4 mặt
                geo = new THREE.ConeGeometry(100 + Math.random() * 150, 300 + Math.random() * 300, 4);
                color = '#1a2b3c';
                pos = new THREE.Vector3((Math.random() - 0.5) * 2000, -100, -500 - Math.random() * 400);
            } else { // Rặng núi nhấp nhô - icosahedron
                geo = new THREE.IcosahedronGeometry(80 + Math.random() * 100, 0);
                color = '#243d58';
                pos = new THREE.Vector3((Math.random() - 0.5) * 1500, -50, -300 - Math.random() * 200);
            }

            // --- THÊM NOISE CHO ĐÁ (Craggy effect) ---
            const vPos = geo.attributes.position;
            for (let j = 0; j < vPos.count; j++) {
                vPos.setX(j, vPos.getX(j) + (Math.random() - 0.5) * 20);
                vPos.setY(j, vPos.getY(j) + (Math.random() - 0.5) * 20);
                vPos.setZ(j, vPos.getZ(j) + (Math.random() - 0.5) * 20);
            }
            geo.computeVertexNormals();

            const mesh = new THREE.Mesh(geo, mtMat.clone());
            mesh.material.color.set(color);
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.scale.set(1, 2.0 + Math.random() * 1.5, 1);
            group.position.copy(pos);
            group.add(mesh);

            // Chóp tuyết cho núi cao - cũng áp dụng noise
            if (type > 0.4 && Math.random() > 0.2) {
                const snowGeo = new THREE.ConeGeometry(geo.parameters.radius * 0.65, geo.parameters.height * 0.45, geo.type === 'ConeGeometry' ? geo.parameters.radialSegments : 4);
                const sPos = snowGeo.attributes.position;
                for (let j = 0; j < sPos.count; j++) {
                    sPos.setX(j, sPos.getX(j) + (Math.random() - 0.5) * 8);
                    sPos.setZ(j, sPos.getZ(j) + (Math.random() - 0.5) * 8);
                }
                const snow = new THREE.Mesh(snowGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true }));
                snow.position.y = geo.parameters.height * 0.38;
                group.add(snow);
            }

            this.bgGroup.add(group);
        }

        // === MÂY LOW-POLY: To, tích tụ thành dải ===
        this.clouds = [];
        for (let i = 0; i < 35; i++) {
            const cloud = new THREE.Group();
            const cloudMat = new THREE.MeshStandardMaterial({
                color: '#ffffff', transparent: true, opacity: 0.7, flatShading: true
            });
            const pCount = 6 + Math.floor(Math.random() * 10);
            for (let j = 0; j < pCount; j++) {
                const size = 10 + Math.random() * 20;
                const part = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), cloudMat);
                part.position.set(j * (size * 0.8), (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
                part.rotation.set(Math.random(), Math.random(), 0);
                cloud.add(part);
            }
            cloud.position.set((Math.random() - 0.5) * 2000, 180 + Math.random() * 150, -300 - Math.random() * 900);
            this.bgGroup.add(cloud);
            this.clouds.push({ mesh: cloud, speed: 0.1 + Math.random() * 0.3 });
        }
    }

    buildForeground() {
        const startX = -180;
        const endX = 820;

        // === ĐƯỜNG MÒN ĐẤT (Trail) - Liền mạch dạng Ruy Băng Rộng ===
        const trailMat = new THREE.MeshStandardMaterial({
            color: '#362419', roughness: 1.0, flatShading: true
        });
        
        const trailWidth = 12; // Đường siêu rộng
        const segmentCount = Math.floor((endX - startX) / 2);
        const positions = new Float32Array((segmentCount + 2) * 2 * 3);
        const indices = [];

        let vIdx = 0;
        for (let x = startX; x <= endX + 2; x += 2) {
            const topo = this.getSpineTopography(x);
            const nextTopo = this.getSpineTopography(x + 2);
            
            // Vector hướng đi và pháp tuyến ngang
            const dx = nextTopo.x - topo.x;
            const dz = nextTopo.z - topo.z;
            const len = Math.sqrt(dx*dx + dz*dz) || 1;
            const nx = -dz / len;
            const nz = dx / len;

            // Hai điểm hai bên lề đường
            positions[vIdx*6 + 0] = topo.x + nx * (trailWidth / 2);
            positions[vIdx*6 + 1] = topo.y + 0.15; // Nổi lên khỏi lớp đá
            positions[vIdx*6 + 2] = topo.z + nz * (trailWidth / 2);

            positions[vIdx*6 + 3] = topo.x - nx * (trailWidth / 2);
            positions[vIdx*6 + 4] = topo.y + 0.15;
            positions[vIdx*6 + 5] = topo.z - nz * (trailWidth / 2);

            if (vIdx < segmentCount + 1) {
                const i = vIdx * 2;
                indices.push(i, i+1, i+2);
                indices.push(i+1, i+3, i+2);
            }
            vIdx++;
        }
        
        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeo.setIndex(indices);
        trailGeo.computeVertexNormals();
        
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.receiveShadow = true;
        this.fgGroup.add(trail);

        // === TẢNG ĐÁ DỌC ĐƯỜNG (Scenic boulders ven đường) ===
        const scenicRockMat = new THREE.MeshStandardMaterial({ color: '#0a1825', roughness: 1.0, flatShading: true });
        for (let x = startX; x < endX; x += 12) {
            const topo = this.getSpineTopography(x + (Math.random()-0.5)*5);
            // Đặt xen kẽ 2 bên đường
            const sides = [1, -1];
            sides.forEach(side => {
                if (Math.random() > 0.35) { // 65% xuất hiện mỗi bên
                    // Tăng spread lên tối thiểu 9 để cách xa hẳn lề đường 6 units
                    const spread = 9 + Math.random() * 12;
                    const rx = x + (Math.random()-0.5)*8;
                    const rTopo = this.getSpineTopography(rx);
                    const sz = rTopo.z + side * spread;
                    const rz = this.getMountainTopography(rx, sz).height;
                    const rock = new THREE.Group();
                    // Tạo cụm đá (1-3 tảng)
                    const pieceCount = 1 + Math.floor(Math.random() * 3);
                    for(let p = 0; p < pieceCount; p++) {
                        const gType = Math.random();
                        let rGeo;
                        if (gType > 0.6) rGeo = new THREE.IcosahedronGeometry(1, 0);
                        else if (gType > 0.3) rGeo = new THREE.DodecahedronGeometry(1, 0);
                        else rGeo = new THREE.TetrahedronGeometry(1, 0);
                        const rMesh = new THREE.Mesh(rGeo, scenicRockMat);
                        const pSize = 1.5 + Math.random() * 4;
                        rMesh.scale.set(
                            pSize*(0.7+Math.random()*0.6),
                            pSize*(0.5+Math.random()*0.8),
                            pSize*(0.7+Math.random()*0.6)
                        );
                        rMesh.position.set(
                            (Math.random()-0.5)*3, pSize*0.3,
                            (Math.random()-0.5)*3
                        );
                        rMesh.rotation.set(
                            Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI
                        );
                        rock.add(rMesh);
                    }
                    rock.position.set(rx, rz - 0.5, sz);
                    rock.castShadow = true;
                    this.fgGroup.add(rock);
                }
            });
        }
    }

    buildAtmosphere() {
        const particleCount = 600; 
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        const pVel = new Float32Array(particleCount); 
        for (let i = 0; i < particleCount; i++) {
            pPos[i * 3] = (Math.random() - 0.5) * 1000;
            pPos[i * 3 + 1] = Math.random() * 300;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 500;
            pVel[i] = 0.5 + Math.random();
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        this.atmosphereVel = pVel;
        this.pMat = new THREE.PointsMaterial({
            color: this.seasons[0].particleColor.clone(), 
            size: 2.5, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(pGeo, this.pMat);
        this.scene.add(this.particles);

        // === HỆ THỐNG MƯA DYNAMIC ===
        const rainCount = 1500;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i++) {
            rainPos[i * 3] = (Math.random() - 0.5) * 800;
            rainPos[i * 3 + 1] = Math.random() * 400;
            rainPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
        this.rainMat = new THREE.PointsMaterial({
            color: '#a5f3fc', size: 0.6, transparent: true, opacity: 0
        });
        this.rain = new THREE.Points(rainGeo, this.rainMat);
        this.scene.add(this.rain);

        // Lens Flare giả lập bằng Sprite
        const flareGeo = new THREE.RingGeometry(5, 7, 32);
        const flareMat = new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.3 });
        this.sunFlare = new THREE.Mesh(flareGeo, flareMat);
        this.sunFlare.position.copy(this.dirLight.position).multiplyScalar(0.9);
        this.scene.add(this.sunFlare);
    }

    emitFootstep(x, y, z) {
        const pos = this.fsPoints.geometry.attributes.position.array;
        // Giới hạn phase trong [0-3] để tránh lỗi khi scrollProgress = 1.0 (Đỉnh núi)
        const phase = Math.min(3, Math.floor(this.scrollProgress * 4));
        const color = this.seasons[phase].particleColor;
        this.fsPoints.material.color.copy(color);

        for(let i=0; i<5; i++) { // Bắn 5 hạt mỗi bước
            const idx = this.fsLife.findIndex(l => l <= 0);
            if(idx === -1) break;
            this.fsLife[idx] = 1.0;
            pos[idx*3] = x; pos[idx*3+1] = y; pos[idx*3+2] = z;
            this.fsVel[idx*3] = (Math.random()-0.5)*2;
            this.fsVel[idx*3+1] = Math.random()*3;
            this.fsVel[idx*3+2] = (Math.random()-0.5)*2;
        }
        this.fsPoints.geometry.attributes.position.needsUpdate = true;
    }

    updateFootsteps(dt) {
        const pos = this.fsPoints.geometry.attributes.position.array;
        for(let i=0; i<this.fsLife.length; i++) {
            if(this.fsLife[i] > 0) {
                this.fsLife[i] -= dt * 2;
                pos[i*3] += this.fsVel[i*3] * dt;
                pos[i*3+1] += this.fsVel[i*3+1] * dt;
                pos[i*3+2] += this.fsVel[i*3+2] * dt;
                this.fsVel[i*3+1] -= 9.8 * dt * 0.5; // Gravity
            }
        }
        this.fsPoints.geometry.attributes.position.needsUpdate = true;
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; 
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(34.15, 126.59, 7.13); 
        this.controls.enabled = true; 
    }

    updateDebugLog(camP, tarP) {
        if (!this.debugEl) return;
        this.debugEl.innerHTML = `
            <b>[ DIORAMA 2.5D CAMERA ]</b><br><br>
            <i>Telephoto Lens (FOV ${this.camera.fov})</i><br><br>
            Camera Pos: x: ${camP.x.toFixed(2)}, y: ${camP.y.toFixed(2)}, z: ${camP.z.toFixed(2)}<br>
            Target Pos: x: ${tarP.x.toFixed(2)}, y: ${tarP.y.toFixed(2)}, z: ${tarP.z.toFixed(2)}<br>
            Travel Progress: ${(this.scrollProgress * 100).toFixed(0)}%
        `;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const currentTime = performance.now() * 0.001;
        const dt = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // --- XỬ LÝ TRẠNG THÁI THAY ĐỒ TẠI BIÊN MÙA ---
        const currentPhase = Math.floor(this.scrollProgress * 4);
        if (currentPhase > this.lastPhase && !this.isChangingClothes) {
            this.isChangingClothes = true;
            this.changeTimer = 3.0; // Dừng lại 3 giây
            this.lastPhase = currentPhase;
            // Update diện mạo ngay khi dừng
            this.suitMat.color.set(this.suitColors[currentPhase] || this.suitColors[0]);
            if (currentPhase === 3) this.scarf.visible = true; // Đến mùa đông thì hiện khăn quàng
        }

        if (this.isChangingClothes) {
            this.changeTimer -= dt;
            if (this.changeTimer <= 0) this.isChangingClothes = false;
            // Hiệu ứng xoay tròn khi thay đồ (Whirlwind)
            this.characterWrapper.rotation.y += 15 * dt;
        } else {
            if (this.scrollProgress < 1.0) {
                this.scrollProgress += this.autoWalkSpeed * dt;
                if (this.scrollProgress > 1.0) this.scrollProgress = 1.0;
            }
            this.characterWrapper.rotation.y = 0; 
        }

        const time = currentTime;

        const startX = -180; 
        const endX = 810;  
        const charX = startX + (endX - startX) * this.scrollProgress;
        
        // 1. AVERAGE HEIGHT: Tránh giật xóc (Làm mượt bằng trung bình cộng 3 điểm lân cận)
        const topoCenter = this.getSpineTopography(charX); 
        const topoFront = this.getSpineTopography(charX + 1.5);
        const topoBack = this.getSpineTopography(charX - 1.5);
        
        const avgY = (topoCenter.y + topoFront.y + topoBack.y) / 3;

        // === CHIỀU CAO BÁM ĐẤT CHUẨN XÁC (Foot-to-Hip chain length) ===
        // Khoảng cách thực tế từ hông (Y=0 local của Torso) xuống gót giày là đúng 7.6 unit
        const FOOT_TO_HIP = 7.6; 
        const charZ = topoCenter.z;   
        const charY = avgY + FOOT_TO_HIP;

        this.characterGroup.position.set(charX, charY, charZ);

        const topoP = this.getSpineTopography(charX + 2.5);
        const topoM = this.getSpineTopography(charX - 2.5);
        
        // ĐỘ DỐC CHUẨN TÍNH PITCH
        const rawSlope = Math.atan2(topoP.y - topoM.y, 5); 
        const maxPitch = 1.0; // max ~57 độ
        const minPitch = -1.0; 
        const slopeAngle = Math.max(minPitch, Math.min(maxPitch, rawSlope));
        this.characterGroup.rotation.x = slopeAngle; 

        // YAW
        const yawAngle = Math.atan2(topoP.z - topoM.z, 5);
        this.characterGroup.rotation.y = Math.PI / 2 - yawAngle;

        const cycle = this.scrollProgress * 250;
        const t = currentTime;

        // === CLIMB MODE: 0 = ĐI BỘ, 1 = TRÈO VÁCH ĐỨNG ===
        const CLIMB_START = 15 * Math.PI / 180;
        const CLIMB_FULL  = 28 * Math.PI / 180;
        const climbMode = Math.max(0, Math.min(1, (rawSlope - CLIMB_START) / (CLIMB_FULL - CLIMB_START)));
        const walkMode  = 1 - climbMode;

        // === DÁP DỀNH THÂN NGƯỜI ===
        const bob = Math.abs(Math.sin(cycle)) * (0.25 * walkMode + 0.08 * climbMode);
        this.characterWrapper.position.y = bob;

        // === TORSO LEAN: NGẢ VỀ PHÍA TRƯỚC ===
        const leanTarget = 0.1 * walkMode + 0.1 * climbMode; 
        this.torso.rotation.x = leanTarget;

        // === ĐIỀU CHỈNH CHAR_Y ĐỂ KHÔNG CHÌM ĐẦU ===
        // Khi lên dốc, nhích người ra để cẳng chân/mũi giày ko găm thẳng vào đất
        const pushOut = Math.max(0, rawSlope * 1.2); 
        this.characterGroup.position.y += pushOut * climbMode;

        // === ĐẦU: NGƯỚC MẮT NHÌN ĐỈNH ===
        this.headGroup.rotation.x = -0.15 - Math.abs(Math.sin(cycle)) * 0.18;
        this.headGroup.rotation.z = Math.sin(cycle * 0.5) * 0.06;

        // === CÀ VẠT TUNG BAY THEO GIÓ ===
        if (this.tieMesh) this.tieMesh.rotation.x = 0.15 + Math.sin(t * 2.5) * 0.12;

        // === TAY TRÁI ===
        // Walk: vung tay so le. Climb: vươn tay thẳng lên cao bám đá
        const armLSwing = Math.sin(cycle) * 0.7;
        const walkArmL_x = -0.9 + armLSwing;
        const climbArmL_x = -2.1;  // Gần thẳng lên trời, tay chạm vách
        this.upperArmL.rotation.x = walkArmL_x * walkMode + climbArmL_x * climbMode;
        this.upperArmL.rotation.z = -0.1 - climbMode * 0.2;
        // Khuỷu trái: Walk gập vừa. Climb gập nhớn chẹn vào vách
        const walkElbL = 0.2 + Math.max(0, -armLSwing) * 0.6;
        const climbElbL = 0.7;
        this.elbowL.rotation.x = walkElbL * walkMode + climbElbL * climbMode;

        // === TAY PHẢI ===
        const armRSwing = -Math.sin(cycle) * 0.5;
        const walkArmR_x = 0.4 + armRSwing;
        const climbArmR_x = -1.6; // Cũng vươn lên bám (một chút thấp hơn trái vì cặp táp)
        this.upperArmR.rotation.x = walkArmR_x * walkMode + climbArmR_x * climbMode;
        this.upperArmR.rotation.z = 0.15 + climbMode * 0.15;
        const walkElbR = 0.3 + Math.max(0, armRSwing) * 0.4;
        const climbElbR = 0.65;
        this.elbowR.rotation.x = walkElbR * walkMode + climbElbR * climbMode;

        // === CHÂN TRÁI ===
        const legLSwing = Math.sin(cycle) * 0.65;
        // Walk: bước thưỜng. Climb: nhấc gối sát ngực tìm chỗ đặt chân
        const walkThighL = -0.1 + legLSwing;
        const climbThighL = 0.3 + Math.sin(cycle) * 0.8; // nhấc chân cao hơn
        this.thighL.rotation.x = walkThighL * walkMode + climbThighL * climbMode;
        // Khi leo: gối gập cực đại khi nhấc chân lên
        const walkKneeL = Math.max(0, legLSwing) * 1.1;
        const climbKneeL = Math.max(0, Math.sin(cycle)) * 1.6;
        this.kneeL.rotation.x = walkKneeL * walkMode + climbKneeL * climbMode;

        // === CHÂN PHẢI ===
        const legRSwing = -Math.sin(cycle) * 0.65;
        const walkThighR = 0.1 + legRSwing;
        const climbThighR = -0.2 + Math.sin(cycle + Math.PI) * 0.8;
        this.thighR.rotation.x = walkThighR * walkMode + climbThighR * climbMode;
        const walkKneeR = Math.max(0, -legRSwing) * 0.5;
        const climbKneeR = Math.max(0, Math.sin(cycle + Math.PI)) * 1.6;
        this.kneeR.rotation.x = walkKneeR * walkMode + climbKneeR * climbMode;

        // === IK: SCALE CẰNG CHÂN BÁM ĐẤT (Hông -> Đầu gối -> Bàn chân) ===
        // Hông (hip) nằm ở Y = -1.5 (local), scale 1.3 -> charY - 1.95
        const hipOffsetInWorld = 1.95;
        const hipWorldY = charY - hipOffsetInWorld; 

        // Chiều dài các đốt xương (đã nhân scale 1.3)
        const thighLen = 2.3 * 1.3; // 2.99
        const shinLen  = 2.1 * 1.3; // 2.73 (shinNeutral)
        
        // Xác định tọa độ bàn chân chuẩn xác để dùng cho cả IK và Hạt bụi chân
        const fXL = charX + Math.sin(legLSwing) * 2;
        const fXR = charX + Math.sin(legRSwing) * 2;
        const gYL = this.getSpineTopography(fXL).y;
        const gYR = this.getSpineTopography(fXR).y;

        if (walkMode > 0.1) {
            // Khoảng cách lý tưởng cần có để cẳng chân chạm mặt đất
            const ikTargetL = hipWorldY - thighLen - gYL;
            const ikTargetR = hipWorldY - thighLen - gYR;
            
            // Tính scale để co duỗi cẳng chân (Shin) bám khít đất
            const ikScaleL = Math.max(0.65, Math.min(1.3, ikTargetL / shinLen));
            const ikScaleR = Math.max(0.65, Math.min(1.3, ikTargetR / shinLen));
            
            this.kneeL.scale.y = this.kneeL.scale.y * 0.8 + ikScaleL * 0.2; 
            this.kneeR.scale.y = this.kneeR.scale.y * 0.8 + ikScaleR * 0.2;
        } else {
            // Climb mode: trả về scale 1 để co gối tự nhiên
            this.kneeL.scale.y = this.kneeL.scale.y * 0.9 + 1.0 * 0.1;
            this.kneeR.scale.y = this.kneeR.scale.y * 0.9 + 1.0 * 0.1;
        }

        // === HIỆU ỨNG HẠT BỤI DƯỚI CHÂN (Khi chân hạ xuống mặt đất) ===
        const isFootL_Down = Math.sin(cycle) > 0.95;
        const isFootR_Down = Math.sin(cycle) < -0.95;
        if ((isFootL_Down || isFootR_Down) && !this.isChangingClothes) {
            this.emitFootstep(isFootL_Down ? fXL : fXR, isFootL_Down ? gYL : gYR, topoCenter.z);
        }
        this.updateFootsteps(dt);

        // === CẬP NHẬT MARKERS & MÂY TRÔI ===
        this.markers.forEach(m => {
            m.group.rotation.y += 2 * dt;
            m.group.position.y += Math.sin(time * 2 + m.data.x) * 0.05;
        });

        this.clouds.forEach(c => {
            c.mesh.position.x += 2 * dt; // Mây trôi chậm sang phải
            if (c.mesh.position.x > 600) c.mesh.position.x = -600; // Loop mây
        });

        // 2. CAMERA TRACKING KHÓA VÀO NHÂN VẬT 
        // ... (phần camera giữ nguyên)
        // ===============================================
        const targetLookX = charX;
        const targetLookY = charY + 2; 
        const targetLookZ = charZ + 7.13; 
        const currentRefTarget = new THREE.Vector3(targetLookX, targetLookY, targetLookZ);

        if (!this.previousTarget) {
            this.controls.target.copy(currentRefTarget);
            this.camera.position.set(charX - 80.08, charY + 1.98, charZ + 143.95);
            this.previousTarget = currentRefTarget.clone();
        } else {
            const diff = currentRefTarget.clone().sub(this.previousTarget);
            this.camera.position.add(diff);
            this.controls.target.add(diff);
            this.previousTarget.copy(currentRefTarget);
        }

        this.controls.update();

        // 3. MÔI TRƯỜNG & CHUYỂN MÙA (4 SEASONS)
        const phaseTotal = this.scrollProgress * 3; 
        let seasonIndex = Math.floor(phaseTotal);
        let lerpFactor = phaseTotal - seasonIndex;
        if (seasonIndex >= 3) {
            seasonIndex = 2; 
            lerpFactor = 1.0;
        }

        const currS = this.seasons[seasonIndex];
        const nextS = this.seasons[seasonIndex + 1];

        this.scene.background.copy(currS.bg).lerp(nextS.bg, lerpFactor);
        this.scene.fog.color.copy(currS.fog).lerp(nextS.fog, lerpFactor);
        this.scene.fog.density = currS.fogDensity + (nextS.fogDensity - currS.fogDensity) * lerpFactor;
        
        this.dirLight.color.copy(currS.light).lerp(nextS.light, lerpFactor);
        this.pMat.color.copy(currS.particleColor).lerp(nextS.particleColor, lerpFactor);

        // === CẬP NHẬT MÂY TRÔI ===
        this.clouds.forEach(c => {
            c.mesh.position.x += c.speed * dt * 20;
            if (c.mesh.position.x > 1500) c.mesh.position.x = -1500;
        });

        // === CẬP NHẬT THỜI TIẾT (Mưa / Tuyết / Nắng) ===
        const currentSeason = this.seasons[Math.floor(this.scrollProgress * 3.9)];
        const weather = currentSeason.weather;
        
        if (weather === 'rainy' || weather === 'snowy') {
            const rainPos = this.rain.geometry.attributes.position.array;
            this.rainMat.opacity = Math.min(0.6, this.rainMat.opacity + dt);
            for (let i = 0; i < rainPos.length / 3; i++) {
                rainPos[i * 3 + 1] -= (weather === 'rainy' ? 120 : 40) * dt;
                if (rainPos[i * 3 + 1] < 0) rainPos[i * 3 + 1] = 400;
            }
            this.rain.geometry.attributes.position.needsUpdate = true;
            this.rainMat.color.set(weather === 'rainy' ? '#a5f3fc' : '#ffffff');
            
            // Lightning Flash (Mưa dông)
            if (weather === 'rainy' && Math.random() > 0.992) {
                this.scene.background.set('#ffffff');
                setTimeout(() => {
                    const phaseUpdate = Math.floor(this.scrollProgress * 3.9);
                    this.scene.background.copy(this.seasons[phaseUpdate].bg);
                }, 40);
            }
        } else {
            this.rainMat.opacity = Math.max(0, this.rainMat.opacity - dt);
        }

        const lightIntensity = seasonIndex === 3 ? 1.0 : 2.0;
        this.dirLight.intensity += (lightIntensity - this.dirLight.intensity) * 0.05;

        // 4. HỆ THỐNG HAỊ TỬ (PARTICLE WEATHER ENGINE)
        if (this.particles) {
            this.particles.material.color.copy(currS.particleColor).lerp(nextS.particleColor, lerpFactor);

            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                let speedY = 0; let windX = 0; let windZ = 0;
                if (this.scrollProgress < 0.25) { 
                    speedY = 0.08; 
                    windX = Math.sin(time*0.5 + i)*0.06;
                    windZ = Math.cos(time*0.5 + i)*0.06;
                } else if (this.scrollProgress < 0.5) { 
                    speedY = -0.05; 
                    windX = 0.15 + Math.sin(time + i)*0.02;
                } else if (this.scrollProgress < 0.75) { 
                    speedY = 0.15; 
                    windX = Math.sin(time*3 + i)*0.2;
                    windZ = Math.cos(time*2 + i)*0.1;
                } else { 
                    speedY = 0.35 + Math.random()*0.2; 
                    windX = -0.2 - Math.sin(time*2 + i)*0.1; 
                }

                positions[i] += windX;      
                positions[i + 1] -= speedY; 
                positions[i + 2] += windZ;  

                if (positions[i + 1] < this.camera.position.y - 40 || positions[i + 1] > this.camera.position.y + 150) {
                    positions[i + 1] = this.camera.position.y + 80 + Math.random() * 50;
                    positions[i] = this.camera.position.x + (Math.random() - 0.5) * 200;
                    positions[i + 2] = this.camera.position.z + (Math.random() - 0.5) * 150 - 50; 
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        this.bgGroup.position.x = this.camera.position.x * 0.1; 
        this.updateDebugLog(this.camera.position, this.controls.target);
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.debugEl.style.display = 'block'; 
        this.animate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new MountainJourney();
    engine.start();
});
