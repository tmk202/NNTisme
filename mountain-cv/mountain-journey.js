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
        // Bỏ sương mù theo yêu cầu để test bầu trời
        // this.scene.fog = new THREE.FogExp2(this.seasons[0].fog.getHex(), this.seasons[0].fogDensity); 
        
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
            { name: 'XUÂN', bg: new THREE.Color('#99f6e4'), fog: new THREE.Color('#99f6e4'), light: new THREE.Color('#fcd34d'), particleColor: new THREE.Color('#fdf2f8'), fogDensity: 0.0008 },
            { name: 'HẠ',   bg: new THREE.Color('#fdba74'), fog: new THREE.Color('#fdba74'), light: new THREE.Color('#fef08a'), particleColor: new THREE.Color('#ffedd5'), fogDensity: 0.0005 },
            { name: 'THU',  bg: new THREE.Color('#f97316'), fog: new THREE.Color('#f97316'), light: new THREE.Color('#fb923c'), particleColor: new THREE.Color('#ea580c'), fogDensity: 0.001 },
            { name: 'ĐÔNG', bg: new THREE.Color('#0f172a'), fog: new THREE.Color('#0f172a'), light: new THREE.Color('#94a3b8'), particleColor: new THREE.Color('#ffffff'), fogDensity: 0.0012 }
        ];
    }

    setupMilestones() {
        this.milestones = [
            { x: -140, title: "KHỞI ĐẦU", year: "2021", detail: "Junior Dev" },
            { x: -70,  title: "BỨC PHÁ", year: "2023", detail: "Fullstack Leader" },
            { x: 10,   title: "LÃNH ĐẠO", year: "2024", detail: "CTO Startup" },
            { x: 80,   title: "ĐỈNH CAO", year: "2026", detail: "AI Architect" }
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
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        
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
        const spineOffset = Math.sin(vx * 0.05) * 18 + Math.sin(vx * 0.015) * 22;
        const distFromSpine = Math.abs(vy - spineOffset);
        
        // ĐẠI LỘ TRÊN ĐỈNH NÚI (SIÊU RỘNG): Rộng 22 unit để đi bộ thoải mái tuyệt đối
        const plateauWidth = 22; 
        const distFromPeak = Math.abs(vx - 100);
        
        // Đỉnh núi thấp và thoải hơn
        const peakHeight = 110 * Math.exp(-Math.pow(distFromPeak / 250, 2));
        const vertebrae = Math.sin(vx * 0.08) * 8; // Nhịp điệu lên xuống cực khẽ
        
        // CHỈ SỐ LÀM PHẲNG MẶT ĐƯỜNG: Ở trong plateau thì không có nhiễu nát
        const smoothFactor = Math.min(1, Math.pow(Math.max(0, distFromSpine - 10) / 15, 2));
        
        // Sườn núi đổ xuống thoai thoải (sharpness 60 thay vì 40)
        const ridgeSharpness = 60; 
        const abyssDrop = Math.pow(Math.max(0, distFromSpine - plateauWidth) / ridgeSharpness, 1.5) * 100;
        
        const craggy = Math.sin(vx * 1.5) * Math.cos(vy * 1.5) * 3 * smoothFactor;
        const jagged = Math.sin(vx * 0.8) * Math.cos(vy * 0.5) * 2 * smoothFactor;
        
        return {
            height: peakHeight + vertebrae - abyssDrop + jagged + craggy,
            spineZ: -spineOffset 
        };
    }

    getSpineTopography(worldX) {
        const spineOffset = Math.sin(worldX * 0.05) * 18 + Math.sin(worldX * 0.015) * 22;
        const distFromPeak = Math.abs(worldX - 100);
        const peakHeight = 140 * Math.exp(-Math.pow(distFromPeak / 200, 2));
        const vertebrae = Math.sin(worldX * 0.1) * 12 + Math.sin(worldX * 0.25) * 6;
        // Loại bỏ gai nhiễu cường độ cao khi tính toán bề mặt cạo lên cho bàn chân (Tránh giật giật)
        const smoothedJagged = Math.sin(worldX * 0.8) * Math.cos(spineOffset * 0.5) * 0.5;
        
        return {
            x: worldX,
            y: peakHeight + vertebrae + smoothedJagged, 
            z: -spineOffset
        };
    }

    buildMiddlegroundSlope() {
        // Kéo rộng chiều Y (ngang) của tấm PlaneGeometry ra 400 để sườn núi phình to
        let baseGeo = new THREE.PlaneGeometry(600, 400, 500, 120); 
        const basePos = baseGeo.attributes.position;
        for (let i = 0; i < basePos.count; i++) {
            const vx = basePos.getX(i); 
            const vy = basePos.getY(i); 
            const topo = this.getMountainTopography(vx, -vy);
            basePos.setZ(i, topo.height);
        }
        baseGeo.computeVertexNormals();
        
        // Tách lưới thành các tam giác rời rạc (Non-indexed) để tô màu Solid per Face (Chuẩn Low-poly)
        const geo = baseGeo.toNonIndexed();
        const pos = geo.attributes.position;
        const count = pos.count;
        const colors = new Float32Array(count * 3);
        
        const colorRock = new THREE.Color('#334155'); // Đá xám
        const colorGrass = new THREE.Color('#166534'); // Cỏ xanh mướt (Thêm màu xanh tự nhiên)
        const colorDirt = new THREE.Color('#78350f'); // Đất nâu
        const colorSnow = new THREE.Color('#f8fafc'); // Tuyết
        const tempColor = new THREE.Color();
        const vA = new THREE.Vector3();
        const vB = new THREE.Vector3();
        const vC = new THREE.Vector3();
        const cb = new THREE.Vector3();
        const ab = new THREE.Vector3();

        // Mỗi mảnh (face) gồm 3 đỉnh i, i+1, i+2
        for (let i = 0; i < count; i += 3) {
            vA.fromBufferAttribute(pos, i);
            vB.fromBufferAttribute(pos, i+1);
            vC.fromBufferAttribute(pos, i+2);
            
            // Tính vector Normal của Face để biết độ dốc
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);
            cb.normalize(); 
            
            // Độ dốc dựa vào trục Z (vì plane tạo trên mặt phẳng XY, lên dốc là Z)
            const slope = 1.0 - Math.abs(cb.z); 
            
            const centerX = (vA.x + vB.x + vC.x) / 3;
            // Tiến trình X đi từ -180 đến 110 (Mùa Xuân -> Mùa Đông)
            const progress = (centerX - -180) / (110 - -180); 
            
            // --- TÔ MÀU (COLOR BIOMES) ---
            if (slope > 0.4 + Math.random()*0.15) {
                // Vách núi dựng đứng -> Vách đá Xám pha Nâu
                tempColor.copy(colorRock).lerp(colorDirt, Math.random() * 0.3);
            } else {
                // Sườn thoải -> Cỏ, tuyết, đất tùy theo mùa
                if (progress > 0.75) { 
                    // Mùa Đông: Tuyết phủ xen vách đá
                    tempColor.copy(colorSnow).lerp(colorRock, slope * 1.5);
                } else if (progress > 0.5) { 
                    // Mùa Thu: Cỏ úa (Cam/Nâu/Vàng)
                    const fallColor = new THREE.Color(Math.random() > 0.5 ? '#d97706' : '#9a3412');
                    tempColor.copy(colorGrass).lerp(fallColor, (progress - 0.5) * 4);
                } else { 
                    // Mùa Xuân & Hạ: Cỏ xanh mướt (Grass)
                    tempColor.copy(colorGrass);
                    // Rắc thêm tí noise sáng tối cho bớt nhàm chán
                    const lightness = 0.8 + Math.random() * 0.4;
                    tempColor.r *= lightness;
                    tempColor.g *= lightness;
                    tempColor.b *= lightness;
                }
            }
            
            // Đổ Solid Color cho 3 đỉnh của một Face
            colors[i*3]     = tempColor.r; colors[i*3+1]   = tempColor.g; colors[i*3+2]   = tempColor.b;
            colors[(i+1)*3] = tempColor.r; colors[(i+1)*3+1] = tempColor.g; colors[(i+1)*3+2] = tempColor.b;
            colors[(i+2)*3] = tempColor.r; colors[(i+2)*3+1] = tempColor.g; colors[(i+2)*3+2] = tempColor.b;
        }
        
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        // Thêm vertexColors: true
        const mat = new THREE.MeshStandardMaterial({ 
            color: '#ffffff', // Màu base trắng để hiển thị màu Vertex
            roughness: 0.9, 
            flatShading: true,
            vertexColors: true
        });
        
        this.mainMountain = new THREE.Mesh(geo, mat);
        this.mainMountain.rotation.x = -Math.PI / 2;
        this.mainMountain.castShadow = true;
        this.mainMountain.receiveShadow = true;
        this.mgGroup.add(this.mainMountain);
    }

    buildDetails() {
        const rockCount = 150;
        // Đổi từ gai nhọn hoắt thành Tảng đá lăn tự nhiên hình đa diện
        const rockGeo = new THREE.DodecahedronGeometry(2.5, 0); 
        const rockMat = new THREE.MeshStandardMaterial({ color: '#0f172a', flatShading: true });
        const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
        rocks.castShadow = true;
        rocks.receiveShadow = true;

        const dummy = new THREE.Object3D();
        for (let i = 0; i < rockCount; i++) {
            const rx = (Math.random() - 0.5) * 580;
            const topo = this.getMountainTopography(rx, 0); 
            const ry = -topo.spineZ + (Math.random() - 0.5) * 20; // Rải rộng đá hai bên dốc hơn
            const topoFinal = this.getMountainTopography(rx, -ry);
            const rz = topoFinal.height - 2; 
            dummy.position.set(rx, rz, -ry);
            dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
            // Kích thước đá ngẫu nhiên dẹt lùn
            dummy.scale.set(1 + Math.random()*1.5, 0.5 + Math.random()*1.5, 1 + Math.random()*1.5);
            dummy.updateMatrix();
            rocks.setMatrixAt(i, dummy.matrix);
        }
        this.mgGroup.add(rocks);

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
        const fsVel = new Float32Array(fsCount * 3);
        const fsLife = new Float32Array(fsCount);
        for(let i=0; i<fsCount; i++) fsLife[i] = -1; // trạng thái chết
        
        fsGeo.setAttribute('position', new THREE.BufferAttribute(fsPos, 3));
        const fsMat = new THREE.PointsMaterial({ size: 1.5, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        this.fsPoints = new THREE.Points(fsGeo, fsMat);
        this.scene.add(this.fsPoints);
        this.fsLife = fsLife;
        this.fsVel = fsVel;
    }

    buildSeasonalDecorations() {
        const startX = -180;
        const endX = 110;
        const step = 4.5;

        // Tái sử dụng Materials
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#3f2716', roughness: 0.9, flatShading: true });
        const willowLeafMat = new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.8, flatShading: true });
        const ginkgoLeafMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8, flatShading: true });
        const sakuraLeafMat = new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.8, flatShading: true });
        const pineMat = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9, flatShading: true });
        const oakMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7, flatShading: true });
        const bushMat = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.7, flatShading: true });
        const fallYellowMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.9, flatShading: true });
        const fallRedMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.9, flatShading: true });
        const snowMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4, flatShading: true });

        // Tái sử dụng Geometries để tối ưu và cho hình dáng Low-poly đẹp mắt
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 3, 5); 
        const thickTrunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4, 5);
        const tallTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 5);
        
        const canopyGeo = new THREE.DodecahedronGeometry(2.5, 0); // Tán sồi/rẻ quạt
        const sakuraGeo = new THREE.IcosahedronGeometry(2.0, 0); // Hoa anh đào
        const bushGeo = new THREE.DodecahedronGeometry(1.5, 0); // Bụi cây
        
        const pineGeo1 = new THREE.ConeGeometry(2.5, 3.5, 5);
        const pineGeo2 = new THREE.ConeGeometry(2.0, 3.5, 5);
        const pineGeo3 = new THREE.ConeGeometry(1.5, 3.5, 5);
        const snowPineGeo1 = new THREE.ConeGeometry(2.6, 3.6, 5); // Tuyết phủ dày hơn chút xíu

        for (let x = startX; x < endX; x += step) {
            const topo = this.getSpineTopography(x);
            // Phân tán rộng sang 2 bên sườn núi (tới 35 unit)
            const sideOffset = (Math.random() - 0.5) * 45; 
            const z = topo.z + sideOffset;
            const y = this.getMountainTopography(x, z).height;

            const group = new THREE.Group();
            group.position.set(x, y, z);
            group.rotation.y = Math.random() * Math.PI;
            
            // Tỷ lệ to nhỏ ngẫu nhiên cực đại
            const s = 0.6 + Math.pow(Math.random(), 2) * 1.5;
            group.scale.set(s, s, s);

            const progress = (x - startX) / (endX - startX);

            if (progress < 0.25) { // === XUÂN ===
                const rand = Math.random();
                if (rand > 0.6) { // Cây Phong nhỏ xanh non
                    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                    trunk.position.y = 1.5; group.add(trunk);
                    const leaf = new THREE.Mesh(canopyGeo, willowLeafMat);
                    leaf.position.y = 3.5; group.add(leaf);
                } else if (rand > 0.3) { // Cây Sồi nhỏ xanh lơ
                    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                    trunk.position.y = 1.5; group.add(trunk);
                    const leaf = new THREE.Mesh(canopyGeo, ginkgoLeafMat);
                    leaf.position.y = 3.8; leaf.scale.set(1.2, 0.6, 1.2); group.add(leaf);
                } else { // Hoa Anh Đào (Sakura)
                    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                    trunk.position.y = 1.5; group.add(trunk);
                    // 3 khóm Anh đào cụm lại
                    const leaf1 = new THREE.Mesh(sakuraGeo, sakuraLeafMat); leaf1.position.set(0, 3.5, 0);
                    const leaf2 = new THREE.Mesh(sakuraGeo, sakuraLeafMat); leaf2.position.set(1.2, 3.0, 1.2); leaf2.scale.setScalar(0.7);
                    const leaf3 = new THREE.Mesh(sakuraGeo, sakuraLeafMat); leaf3.position.set(-1.2, 2.7, -0.8); leaf3.scale.setScalar(0.6);
                    group.add(leaf1, leaf2, leaf3);
                }
                
            } else if (progress < 0.5) { // === HẠ ===
                const rand = Math.random();
                if (rand > 0.6) { // Cây Thông Cao
                    const trunk = new THREE.Mesh(tallTrunkGeo, trunkMat);
                    trunk.position.y = 3; group.add(trunk);
                    const layer1 = new THREE.Mesh(pineGeo1, pineMat); layer1.position.y = 3.5; group.add(layer1);
                    const layer2 = new THREE.Mesh(pineGeo2, pineMat); layer2.position.y = 5.5; group.add(layer2);
                    const layer3 = new THREE.Mesh(pineGeo3, pineMat); layer3.position.y = 7.0; group.add(layer3);
                } else if (rand > 0.2) { // Cây Sồi Cổ Thụ
                    const trunk = new THREE.Mesh(thickTrunkGeo, trunkMat);
                    trunk.position.y = 2; group.add(trunk);
                    const leaves = new THREE.Mesh(canopyGeo, oakMat);
                    leaves.position.y = 4.5; leaves.scale.setScalar(1.4); group.add(leaves);
                } else { // Bụi rậm rạp
                    const bush = new THREE.Mesh(bushGeo, bushMat);
                    bush.position.y = 0.5; bush.scale.set(1.5, 0.8, 1.5);
                    group.add(bush);
                    if(Math.random() > 0.5) {
                        const bush2 = new THREE.Mesh(bushGeo, bushMat);
                        bush2.position.set(1.5, 0.3, 1.0); bush2.scale.setScalar(0.8);
                        group.add(bush2);
                    }
                }
            } else if (progress < 0.75) { // === THU ===
                const isYellow = Math.random() > 0.5;
                const fallMat = isYellow ? fallYellowMat : fallRedMat;
                const rand = Math.random();
                
                if (rand > 0.4) { // Sồi thu
                    const trunk = new THREE.Mesh(thickTrunkGeo, trunkMat);
                    trunk.position.y = 2; group.add(trunk);
                    const leaves = new THREE.Mesh(canopyGeo, fallMat);
                    leaves.position.y = 4.5; leaves.scale.setScalar(1.3); group.add(leaves);
                } else { // Bụi thu
                    const bush = new THREE.Mesh(bushGeo, fallMat);
                    bush.position.y = 0.5; bush.scale.set(1.2, 0.8, 1.2);
                    group.add(bush);
                }
            } else { // === ĐÔNG ===
                const rand = Math.random();
                if (rand > 0.6) { // Thông phủ tuyết
                    const trunk = new THREE.Mesh(tallTrunkGeo, trunkMat);
                    trunk.position.y = 3; group.add(trunk);
                    const layer1 = new THREE.Mesh(snowPineGeo1, snowMat); layer1.position.y = 3.5; group.add(layer1);
                    const layer2 = new THREE.Mesh(pineGeo2, snowMat); layer2.position.y = 5.5; group.add(layer2);
                    const layer3 = new THREE.Mesh(pineGeo3, snowMat); layer3.position.y = 7.0; group.add(layer3);
                } else { // Cây trụi lá (Dead tree)
                    const trunk = new THREE.Mesh(tallTrunkGeo, trunkMat);
                    trunk.position.y = 3; group.add(trunk);
                    // Cành trơ trọi
                    const branch1 = new THREE.Mesh(trunkGeo, trunkMat); 
                    branch1.position.set(0.8, 4.5, 0); branch1.rotation.z = Math.PI / 4; branch1.scale.setScalar(0.5);
                    const branch2 = new THREE.Mesh(trunkGeo, trunkMat); 
                    branch2.position.set(-0.8, 5.5, 0.5); branch2.rotation.z = -Math.PI / 3; branch2.rotation.x = Math.PI/4; branch2.scale.setScalar(0.4);
                    group.add(branch1, branch2);
                }
            }
            this.mgGroup.add(group);
        }
    }
    buildCharacter() {
        this.characterGroup = new THREE.Group();
        
        // === VẬT LIỆU ===
        this.suitColors = ['#1a2744', '#f8fafc', '#1a2744', '#0f172a']; // Xuân (Navi), Hạ (White Sơ mi), Thu (Navi), Đông (Đen dày)
        this.suitMat      = new THREE.MeshStandardMaterial({ color: this.suitColors[0], roughness: 0.85, flatShading: true });
        this.suitLightMat = new THREE.MeshStandardMaterial({ color: '#243260', roughness: 0.8, flatShading: true });
        const shirtMat    = new THREE.MeshStandardMaterial({ color: '#f0f4ff', roughness: 0.9, flatShading: true });
        const tieMat      = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.6, flatShading: true });
        const skinMat     = new THREE.MeshStandardMaterial({ color: '#e8a87c', roughness: 0.5, flatShading: true });
        const shoesMat    = new THREE.MeshStandardMaterial({ color: '#0a0a12', roughness: 0.3, metalness: 0.2, flatShading: true });
        const hairMat     = new THREE.MeshStandardMaterial({ color: '#1a0a00', roughness: 0.9, flatShading: true });
        const briefMat    = new THREE.MeshStandardMaterial({ color: '#3b1a08', roughness: 0.7, flatShading: true });
        const sweatMat    = new THREE.MeshStandardMaterial({ color: '#aedff7', transparent: true, opacity: 0.75, flatShading: true });

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
        this.scarf = new THREE.Mesh(scarfGeo, new THREE.MeshStandardMaterial({ color: '#991b1b', flatShading: true }));
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
        const jaw = new THREE.Mesh(jawGeo, new THREE.MeshStandardMaterial({ color: '#c0392b', flatShading: true }));
        jaw.position.set(0, -0.45, 0.79);
        this.headGroup.add(jaw);
        const teethGeo = new THREE.BoxGeometry(0.82, 0.1, 0.13);
        const teeth = new THREE.Mesh(teethGeo, new THREE.MeshStandardMaterial({ color: '#f5f5f5', flatShading: true }));
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
        this.characterGroup.visible = false; // TẠM ẨN: Thiết kế cảnh Low-Poly
        this.mgGroup.add(this.characterGroup);
    }

    buildBackground() {
        const loader = new THREE.GLTFLoader();
        loader.load('assets/glb/fantasy_sky_background.glb', (gltf) => {
            const bgModel = gltf.scene;
            
            // Đặt kích thước để đường kính skybox ~1600 (phù hợp với viễn cảnh 2000 của Camera)
            bgModel.scale.set(50, 50, 50); 
            
            // Đảm bảo background không cản bóng VÀ KHÔNG BỊ SƯƠNG MÙ (FOG) CHE KHUẤT
            bgModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    if (child.material) {
                        child.material.fog = false; // QUAN TRỌNG: Không để sương mù nuốt chửng bầu trời
                        // Phát sáng nhẹ để rõ họa tiết mây dù đứng trong góc tối
                        child.material.emissive = new THREE.Color('#ffffff');
                        child.material.emissiveIntensity = 0.4; 
                    }
                }
            });

            // Chạy animation (vd: Mây trôi, chim bay) nếu có sẵn trong file GLB
            if (gltf.animations && gltf.animations.length > 0) {
                this.bgMixer = new THREE.AnimationMixer(bgModel);
                gltf.animations.forEach(clip => {
                    this.bgMixer.clipAction(clip).play();
                });
            }
            
            this.bgModel = bgModel;
            this.scene.add(bgModel); // Bầu trời thêm vào scene tổng để không bị lôi kéo bởi Parallax núi
        }, undefined, (error) => {
            console.error('Lỗi khi tải fantasy_sky_background.glb:', error);
        });
    }

    buildForeground() {
        const startX = -180;
        const endX = 110;
        const postMat = new THREE.MeshStandardMaterial({ color: '#3b2518', roughness: 0.9, flatShading: true });
        
        for (let x = startX; x < endX; x += 4) {
            const topo = this.getSpineTopography(x);

            // Loại bỏ các tấm PlaneGeometry (bước gỗ / trail planks) vì gây nhiễu và vỡ bề mặt
            
            // Chỉ giữ lại một vài cọc đánh dấu đường nho nhỏ
            if (Math.round(x) % 30 === 0) {
                const postBaseGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 5);
                
                const postL = new THREE.Mesh(postBaseGeo, postMat);
                postL.position.set(x, topo.y + 0.5, topo.z + 8); 
                this.fgGroup.add(postL);
                
                const postR = postL.clone(); 
                postR.position.z = topo.z - 8;
                this.fgGroup.add(postR);
            }
        }
    }

    buildAtmosphere() {
        const particleCount = 400; 
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

        if (this.bgMixer) {
            this.bgMixer.update(dt);
        }

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
        const endX = 100;  
        const charX = startX + (endX - startX) * this.scrollProgress;
        
        // 1. AVERAGE HEIGHT: Tránh giật xóc (Làm mượt bằng trung bình cộng 3 điểm lân cận)
        const topoCenter = this.getSpineTopography(charX); 
        const topoFront = this.getSpineTopography(charX + 2);
        const topoBack = this.getSpineTopography(charX - 2);
        
        const avgY = (topoCenter.y + topoFront.y + topoBack.y) / 3;

        // === CHIỀU CAO BÁM ĐẤT CHUẨN XÁC (Foot-to-Hip chain length) ===
        // Thân dưới tỉ lệ người thật: Chân chiếm ~1/2 chiều cao.
        // Khoảng cách từ Hông đến Mặt đất lý tưởng là ~6.0 unit (đã tính scale 1.3)
        // Nhân vật đặt gốc tại ngực/bụng, nên charY cần cao hơn mặt đất ~8.0 unit.
        const FOOT_TO_HIP = 8.0; 
        const charZ = topoCenter.z;   
        const charY = avgY + FOOT_TO_HIP;

        this.characterGroup.position.set(charX, charY, charZ);

        const topoP = this.getSpineTopography(charX + 3);
        const topoM = this.getSpineTopography(charX - 3);
        
        // ĐỘ DỐC CHUẨN TÍNH PITCH - nới giới hạn để trèo được vách đứng (~80 độ)
        const rawSlope = Math.atan2(topoP.y - topoM.y, 6); 
        const maxPitch = 1.4; // 80 độ max lên dốc
        const minPitch = -1.0; // 57 độ max xuống dốc
        const slopeAngle = Math.max(minPitch, Math.min(maxPitch, rawSlope));
        this.characterGroup.rotation.x = slopeAngle; 

        // YAW - cũng lấy khoảng rộng hơn để mượt
        const yawAngle = Math.atan2(topoP.z - topoM.z, 6);
        this.characterGroup.rotation.y = Math.PI / 2 - yawAngle;

        const cycle = this.scrollProgress * 250;
        const t = currentTime; // alias cho time animation tuyệt đối

        // === CLIMB MODE: 0 = ĐI BỘ, 1 = TRÈO VÁCH ĐỨNG ===
        // Khi độ dốc > 25° -> bắt đầu chuyển sang tư thế trèo
        const CLIMB_START = 20 * Math.PI / 180;
        const CLIMB_FULL  = 32 * Math.PI / 180;
        const climbMode = Math.max(0, Math.min(1, (rawSlope - CLIMB_START) / (CLIMB_FULL - CLIMB_START)));
        const walkMode  = 1 - climbMode;

        // === DÁP DỀNH THÂN NGƯỜI ===
        const bob = Math.abs(Math.sin(cycle)) * (0.25 * walkMode + 0.08 * climbMode);
        this.characterWrapper.position.y = bob;

        // === TORSO LEAN: NGẢ VỀ PHÍA TRƯỚC ===
        // KHÔNG cộng dồn quá đà: 
        // Khi đi bộ (walk): người đứng thẳng hơn (nghiêng ít)
        // Khi trèo (climb): người bám song song vách (đã có slopeAngle lo)
        const leanTarget = 0.1 * walkMode + 0.1 * climbMode; 
        this.torso.rotation.x = leanTarget;

        // === ĐIỀU CHỈNH CHAR_Y ĐỂ KHÔNG CHÌM ĐẦU ===
        // Khi dốc quá gắt, đẩy nhân vật lùi ra sau một chút (theo trục Y world) để ngực không chạm đá
        const pushOut = Math.max(0, rawSlope * 4.0); 
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

        // Bỏ scale cẳng chân để không làm bẹp/kéo dài chiếc giày (Tránh Jelly Effect)
        this.kneeL.scale.y = 1.0;
        this.kneeR.scale.y = 1.0;

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
        // Procedural clouds removed as part of GLB background upgrade

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
        
        // Tạm thời tắt update sương mù
        // this.scene.fog.color.copy(currS.fog).lerp(nextS.fog, lerpFactor);
        // this.scene.fog.density = currS.fogDensity + (nextS.fogDensity - currS.fogDensity) * lerpFactor;
        this.dirLight.color.copy(currS.light).lerp(nextS.light, lerpFactor);
        
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

        // Khóa bầu trời luôn nằm cùng gốc với vị trí mắt người nhìn (Sky Dome)
        // Tạo cảm giác mây ở xa vô tận, không phình to khi đi tới
        if (this.bgModel) {
            this.bgModel.position.copy(this.camera.position);
            this.bgModel.position.y -= 50; 
        }

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
