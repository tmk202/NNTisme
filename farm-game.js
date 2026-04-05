/**
 * ==========================================
 * AUTOMATION FARM (THẾ HỆ MỚI: 3D ISOMETRIC LÀM NÔNG TRẠI 2.5D)
 * ==========================================
 * Bằng cách dùng Three.js + Orthographic Camera, ta sẽ có góc nhìn
 * chính xác 100% tỷ lệ 2.5D (Không bị bè/méo) giống hệt FarmCity / Hayday / Township.
 */

const DATA_CV = [
    { id: 1, cost: 0, type: 'PROJECT', title: "HOCMAI - Streamapp", year: "2023 - Nay", desc: "Nền tảng học trực tuyến 5.000+ PCU...", tags: ["Node.js", "Redis"] },
    { id: 2, cost: 20, type: 'PROJECT', title: "Virtual Co-Working", year: "2024", desc: "SFU Mediasoup kiến trúc video đa luồng...", tags: ["WebRTC", "FastAPI"] },
    { id: 3, cost: 50, type: 'SKILL', title: "AI Chatbot RAG", year: "2024", desc: "Dựng hệ sinh thái Chatbot tự động n8n mượt mà...", tags: ["LLM", "n8n"] },
    { id: 4, cost: 100, type: 'SKILL', title: "Automation Farm", year: "2025", desc: "Automation Tool cho MXH, chống ban clone...", tags: ["Puppeteer", "Proxy"] }
];

class FarmIsometricGame {
    constructor() {
        this.container = document.getElementById('game-canvas-container');
        this.scene = new THREE.Scene();
        // Set up nền bầu trời trong vắt
        this.scene.background = new THREE.Color('#f0fdf4');
        this.scene.fog = new THREE.FogExp2('#f0fdf4', 0.015);

        this.gridSize = 12;
        this.tileSize = 2; // Kích thước vật lý 1 ô

        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupGrid();
        this.setupBot();

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.dataPointer = 0;
        this.plants = [];
        
        // Game Economy Core
        this.coreData = 0;
        this.orbs = []; // Chứa các cục Data rớt ra
        this.orbGroup = new THREE.Group();
        this.scene.add(this.orbGroup);

        window.addEventListener('resize', this.onResize.bind(this));
        
        // Listeners kích hoạt click trồng trọt
        this.container.addEventListener('click', this.onClick.bind(this));
        // Hover
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Đóng Modal (UI HTML)
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('projectModal').classList.remove('show');
        });
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 16; // Độ phóng đại orthographic (Càng to nhìn càng rộng)
        
        // DÙNG CAMERA TRỰC GIAO (ORTHOGRAPHIC) Để tạo góc chiếu 2.5D song song hoàn hảo!
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        
        // Góc 2.5D Kinh điển: Xoay chéo góc
        this.camera.position.set(20, 20, 20); 
        this.camera.lookAt(0, 0, 0); // Nhìn vào chính giữa bản đồ
        this.scene.add(this.camera);
    }

    setupRenderer() {
        // Tái cấu trúc lại canvas
        this.container.innerHTML = ''; 
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Đổ bóng siêu mềm
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Trưa Nắng sáng sủa
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2); // Vàng nhẹ của Mặt trời
        // Đặt mặt trời ở góc chuẩn đổ bóng Isometric FarmCity (Chéo góc)
        this.dirLight.position.set(-15, 25, 10);
        this.dirLight.castShadow = true;
        
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.left = -20;
        this.dirLight.shadow.camera.right = 20;
        this.dirLight.shadow.camera.top = 20;
        this.dirLight.shadow.camera.bottom = -20;

        this.scene.add(this.dirLight);
    }

    setupGrid() {
        this.tiles = [];
        this.tilesGroup = new THREE.Group();
        this.scene.add(this.tilesGroup);

        const geoBox = new THREE.BoxGeometry(this.tileSize * 0.96, 0.4, this.tileSize * 0.96); // Tạo viền rãnh
        
        const matGrass = new THREE.MeshStandardMaterial({ color: '#86efac', roughness: 0.8 });
        const matDirt = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 1.0 });
        const matWater = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, metalness: 0.2 });

        const offset = (this.gridSize * this.tileSize) / 2 - (this.tileSize / 2);

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                
                let type = 'DIRT';
                let mat = matDirt;
                let yPos = 0;

                // Thiết kế: Xung quanh là nước, rải rác một ít cỏ
                if(row === 0 || col === 0 || row === this.gridSize-1 || col === this.gridSize-1) {
                    type = 'WATER'; mat = matWater; yPos = -0.15; // Nước sâu hơn
                } else if (Math.random() > 0.7) {
                    type = 'GRASS'; mat = matGrass;
                }

                const mesh = new THREE.Mesh(geoBox, mat);
                mesh.position.set(
                    col * this.tileSize - offset, 
                    yPos, 
                    row * this.tileSize - offset
                );
                
                mesh.receiveShadow = true;
                if(type !== 'WATER') mesh.castShadow = true;

                mesh.userData = { row, col, type, plant: null, originalY: yPos };
                this.tilesGroup.add(mesh);
                this.tiles.push(mesh);
            }
        }
    }

    setupBot() {
        this.bot = new THREE.Group();
        
        // Tạo Voxel Nông Dân Người (Gradients and Textures with BoxGeometry)
        const skinMat = new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.6 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.8 }); // Áo xanh lá
        const pantMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.9 }); // Quần jean
        const hairMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 1.0 }); // Tóc nâu đậm
        
        // 1. Đầu
        this.head = new THREE.Group();
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
        headMesh.castShadow = true;
        this.head.add(headMesh);
        
        // Tóc/Mũ
        const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), hairMat);
        hairMesh.position.y = 0.3;
        this.head.add(hairMesh);

        // Mắt (2 ô đen nhỏ Front)
        const eyeMat = new THREE.MeshBasicMaterial({ color: '#000' });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
        eyeL.position.set(-0.15, 0.1, 0.3); // Nằm trước mặt (Z+)
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
        eyeR.position.set(0.15, 0.1, 0.3);
        this.head.add(eyeL, eyeR);
        
        // Mũi
        const noseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.15), skinMat);
        noseMesh.position.set(0, -0.05, 0.32);
        this.head.add(noseMesh);

        this.head.position.y = 1.3;
        this.bot.add(this.head);

        // 2. Thân (Body)
        this.body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), shirtMat);
        this.body.position.y = 0.65;
        this.body.castShadow = true;
        this.bot.add(this.body);

        // 3. Hai Tay (Arms) - Gắn vào tâm vai để xoay được khớp
        this.armLGroup = new THREE.Group();
        this.armLGroup.position.set(-0.5, 0.9, 0); // Vai trái
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
        armL.position.y = -0.25; 
        armL.castShadow = true;
        this.armLGroup.add(armL);
        this.bot.add(this.armLGroup);

        this.armRGroup = new THREE.Group();
        this.armRGroup.position.set(0.5, 0.9, 0); // Vai phải
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
        armR.position.y = -0.25;
        armR.castShadow = true;
        this.armRGroup.add(armR);
        this.bot.add(this.armRGroup);

        // 4. Hai Chân (Legs)
        this.legLGroup = new THREE.Group();
        this.legLGroup.position.set(-0.2, 0.4, 0); // Khớp háng trái
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantMat);
        legL.position.y = -0.2;
        legL.castShadow = true;
        this.legLGroup.add(legL);
        this.bot.add(this.legLGroup);

        this.legRGroup = new THREE.Group();
        this.legRGroup.position.set(0.2, 0.4, 0); // Khớp háng phải
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantMat);
        legR.position.y = -0.2;
        legR.castShadow = true;
        this.legRGroup.add(legR);
        this.bot.add(this.legRGroup);

        // Tia nước (Tưới từ dưới lòng bàn tay phải của Nông dân)
        const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3, transparent: true, opacity: 0 });
        const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,-1.5,1.5)]);
        this.botLaser = new THREE.Line(laserGeo, laserMat);
        this.botLaser.position.y = -0.5; // Đuôi tay phải
        this.armRGroup.add(this.botLaser); 

        this.bot.position.set(0, 0, 0); // Tỷ lệ đã cân cho đúng mặt đất Y=0
        this.bot.scale.set(1.2, 1.2, 1.2); 
        this.scene.add(this.bot);

        this.botState = { state: 'IDLE', targetPlant: null }; 
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.tilesGroup.children);
        
        // Reset Hover
        this.tiles.forEach(t => {
            if(t.position.y > t.userData.originalY + 0.1) {
                // Return smoothly via GSAP auto-tween
                gsap.to(t.position, {y: t.userData.originalY, duration: 0.2});
            }
        });

        if (intersects.length > 0) {
            const tile = intersects[0].object;
            if (tile.userData.type === 'DIRT') {
                gsap.to(tile.position, {y: tile.userData.originalY + 0.2, duration: 0.2}); // Nhô lên
            }
        }
    }

    onClick(event) {
        // Tắt raycast nếu UI đang mở
        if(document.getElementById('projectModal').classList.contains('show')) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Intersect với đất và cả với cây
        const intersects = this.raycaster.intersectObjects([...this.tilesGroup.children, ...this.scene.children], true);

        if (intersects.length > 0) {
            let hit = intersects[0].object;

            // Nếu Click trúng Cây đang MATURE -> Thu hoạch / Xem Modal
            if (hit.userData.isPlant && hit.userData.state === 'MATURE') {
                this.openCVModal(hit.userData.data);
                return;
            }

            // Truy xuất lấy Tile gốc nếu click vào Cây
            if (hit.userData.isPlant) {
                hit = hit.userData.parentTile;
            }

            // Nếu click và ô đất Trống (DIRT)
            if (hit.userData && hit.userData.type === 'DIRT' && !hit.userData.plant) {
                if (this.dataPointer >= DATA_CV.length) return; // Hết cờ

                const cvData = DATA_CV[this.dataPointer];
                
                // KIỂM TRA TÀI CHÍNH (LUẬT GAME)
                if (this.coreData >= cvData.cost) {
                    this.updateDataCount(-cvData.cost); // Trừ tiền
                    this.plantSeed(hit);
                } else {
                    this.showFloatingWarning("Cần " + cvData.cost + " TB Data! (Hãy chờ Thu Hoạch)", hit.position);
                }
            }
        }
    }

    updateDataCount(amount) {
        this.coreData += amount;
        document.getElementById('dataScore').innerText = this.coreData;
        
        // Cập nhật giá text
        const nextData = DATA_CV[this.dataPointer];
        if(nextData) {
            document.getElementById('nextCostInfo').innerText = "Giá mở khóa dự án kế tiếp: " + nextData.cost + " TB";
        } else {
            document.getElementById('nextCostInfo').innerText = "Đã hoàn thành mọi mục tiêu!";
        }
    }

    showFloatingWarning(msg, position) {
        const div = document.createElement('div');
        div.innerText = msg;
        div.style.position = 'absolute';
        div.style.color = '#ef4444';
        div.style.fontWeight = 'bold';
        div.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '1000';
        document.body.appendChild(div);

        // Chuyển Toạ độ 3D -> 2D
        const pos = position.clone();
        pos.project(this.camera);
        const x = (pos.x * .5 + .5) * window.innerWidth;
        const y = (pos.y * -.5 + .5) * window.innerHeight;

        div.style.left = (x - 50) + 'px';
        div.style.top = (y - 50) + 'px';

        // Animate bay lên bằng GSAP
        gsap.to(div, {
            top: y - 100,
            opacity: 0,
            duration: 2,
            ease: 'power1.out',
            onComplete: () => div.remove()
        });
    }

    plantSeed(tileMesh) {
        const cvData = DATA_CV[this.dataPointer];
        this.dataPointer++;
        this.updateProgressBar();
        this.updateDataCount(0); // Cập nhật text UI giá tiếp theo

        // 1. Tạo hình hài hạt giống 3D
        const plantGroup = new THREE.Group();
        
        // Hạt mầm vàng (Kích thước nhỏ)
        const seedGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const seedMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 });
        const seedModel = new THREE.Mesh(seedGeo, seedMat);
        seedModel.position.y = 0.4;
        seedModel.castShadow = true;
        
        // Lưu trữ cờ kiểm tra khi Click Raycast
        seedModel.userData = { isPlant: true, state: 'SEED', data: cvData, parentTile: tileMesh };
        plantGroup.add(seedModel);

        plantGroup.position.copy(tileMesh.position);
        plantGroup.position.y = 0; // Đặt sát đất
        
        this.scene.add(plantGroup);
        tileMesh.userData.plant = seedModel; // Link móc nối
        
        this.plants.push(seedModel);

        // Hiệu ứng rớt xuống đất
        seedModel.position.y = 5;
        gsap.to(seedModel.position, { y: 0.3, duration: 0.5, ease: "bounce.out" });

        // N8N BOT NHẬN LỆNH ĐẾN TƯỚI!
        this.assignBotTask();
    }

    assignBotTask() {
        if (this.botState.state !== 'IDLE') return;

        // Ưu tiên 1: THU THẬP DATA ORBS (Thu hoạch)
        if (this.orbs.length > 0) {
            const targetOrb = this.orbs[0];
            this.botState.targetOrb = targetOrb;
            this.botState.state = 'COLLECTING';

            const targetX = targetOrb.position.x;
            const targetZ = targetOrb.position.z;

            const angle = Math.atan2(targetX - this.bot.position.x, targetZ - this.bot.position.z);
            gsap.to(this.bot.rotation, { y: angle, duration: 0.3 });

            const dist = Math.sqrt(Math.pow(targetX - this.bot.position.x, 2) + Math.pow(targetZ - this.bot.position.z, 2));
            const moveTime = dist * 0.2; 

            gsap.to(this.bot.position, {
                x: targetX, z: targetZ,
                duration: moveTime, ease: 'none',
                onComplete: () => {
                    // Ăn cục Data
                    this.updateDataCount(10); // Mỗi cục rớt ra được 10 TB
                    
                    // Phóng to biến mất
                    gsap.to(targetOrb.scale, {x:0, y:0, z:0, duration: 0.3, onComplete: () => {
                        this.orbGroup.remove(targetOrb);
                    }});
                    
                    // Gỡ khỏi mảng
                    this.orbs.shift();

                    this.botState.state = 'IDLE';
                    this.botState.targetOrb = null;
                    setTimeout(() => this.assignBotTask(), 100);
                }
            });
            return;
        }

        // Ưu tiên 2: TƯỚI CÂY (Chăm sóc)
        const target = this.plants.find(p => p.userData.state === 'SEED');
        if (target) {
            this.botState.targetPlant = target;
            this.botState.state = 'MOVING';
            
            // GSAP tính năng Đi Bộ của Nông Dân
            const targetX = target.parent.position.x;
            const targetZ = target.parent.position.z;
            const targetY = 0; // Đứng trên mặt đất

            const dist = Math.sqrt(Math.pow(targetX - this.bot.position.x, 2) + Math.pow(targetZ - this.bot.position.z, 2));
            const moveTime = dist * 0.25; // Chậm hơn Drone bay

            // 1. Quay mặt về hướng cần tới (Nhân vật đang có mặt phẳng Front = Z+)
            const angle = Math.atan2(targetX - this.bot.position.x, targetZ - this.bot.position.z);
            gsap.to(this.bot.rotation, { y: angle, duration: 0.3 });

            // 2. Đi tới kế bên cây để tưới
            const offsetX = Math.sin(angle) * 1.5;
            const offsetZ = Math.cos(angle) * 1.5;

            gsap.to(this.bot.position, {
                x: targetX - offsetX, y: targetY, z: targetZ - offsetZ,
                duration: moveTime,
                ease: 'none', // Đi bộ tà tà đều đặn
                onComplete: () => {
                    this.waterPlant(target);
                }
            });
        }
    }

    waterPlant(plantModel) {
        this.botState.state = 'WATERING';
        
        // Cử động tay vươn ra xa chĩa vào mầm cây
        gsap.to(this.armRGroup.rotation, { x: -Math.PI/2, duration: 0.3 });

        // Phụt nước
        setTimeout(() => {
            this.botLaser.material.opacity = 0.8;
        }, 300);
        
        // Thời gian tưới (1.5 giây)
        setTimeout(() => {
            this.botLaser.material.opacity = 0;
            // Hạ tay xuống
            gsap.to(this.armRGroup.rotation, { x: 0, duration: 0.3 });

            this.growPlant(plantModel);
            
            // Xong -> Đứng thở một chút rồi tìm việc khác
            this.botState.state = 'IDLE';
            this.botState.targetPlant = null;
            setTimeout(() => {
                this.assignBotTask();
            }, 500);
        }, 1500);
    }

    growPlant(plantModel) {
        plantModel.userData.state = 'MATURE';
        const isProject = plantModel.userData.data.type === 'PROJECT';
        
        // Đổi màu hạt giống thành gốc cây
        plantModel.material = new THREE.MeshStandardMaterial({ color: '#78350f' });
        
        // Cây mọc lên: tạo lá box
        const leavesGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const leavesMat = new THREE.MeshStandardMaterial({ 
            color: isProject ? '#0ea5e9' : '#a855f7', // Xanh Dương (Project) hoặc Tím (Kỹ Năng)
            roughness: 0.6
        });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 1.0;
        leaves.scale.set(0,0,0);
        leaves.castShadow = true;
        
        leaves.userData = plantModel.userData; 
        plantModel.add(leaves);

        gsap.to(plantModel.scale, { y: 2, duration: 0.5, ease: "back.out" });
        gsap.to(leaves.scale, { x: 1, y: 1, z: 1, duration: 1, delay: 0.3, ease: "elastic.out(1, 0.3)" });
        
        const light = new THREE.PointLight(isProject ? '#0ea5e9' : '#a855f7', 2, 4);
        light.position.y = 1.0;
        plantModel.add(light);

        gsap.to(leaves.rotation, {x: 0.1, z: -0.1, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut'});

        // GAME LOOP CORE: Cây phát triển sẽ rớt ra "Data" (Tiền tệ) định kỳ
        setInterval(() => {
            this.dropDataOrb(plantModel);
        }, 5000 + Math.random() * 5000); // Rớt mỗi 5-10 giây
    }

    dropDataOrb(plantModel) {
        // Rớt Data xuống đất gần cây
        const orbGeo = new THREE.OctahedronGeometry(0.2, 0); // Hình tinh thể Data
        const orbMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 1.0 });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        
        // Vị trí ngẫu nhiên xung quanh rễ cây
        const parentPos = plantModel.parent.position;
        const oX = parentPos.x + (Math.random() - 0.5) * 2;
        const oZ = parentPos.z + (Math.random() - 0.5) * 2;
        
        orb.position.set(oX, 1.5, oZ); // Bắn lên rồi rớt
        orb.castShadow = true;
        
        this.orbGroup.add(orb);
        this.orbs.push(orb);

        gsap.to(orb.position, { y: 0.2, duration: 0.8, ease: "bounce.out" });
        
        // Đánh thức Bot dậy đi Lượm Data
        this.assignBotTask();
    }

    openCVModal(data) {
        document.getElementById('modalYear').innerText = data.year;
        document.getElementById('modalTitle').innerText = data.title;
        document.getElementById('modalDesc').innerText = data.desc;
        const tagsHtml = data.tags.map(t => `<span>${t}</span>`).join('');
        document.getElementById('modalTags').innerHTML = tagsHtml;
        document.getElementById('projectModal').classList.add('show');
    }

    updateProgressBar() {
        const bar = document.querySelector('.progress-bar-fill');
        const percent = (this.dataPointer / DATA_CV.length) * 100;
        if (bar) bar.style.width = percent + '%';
    }

    onResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 16;
        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = Date.now() / 150;

        // Xoay các tinh thể Data Orbs mượt mà trên không
        this.orbGroup.children.forEach(orb => {
            orb.rotation.y += 0.05;
            orb.position.y = 0.2 + Math.abs(Math.sin(time + orb.position.x)) * 0.1;
        });

        // Động cơ Animation cho Bác Nông Dân Voxel
        if (this.botState.state === 'MOVING' || this.botState.state === 'COLLECTING') {
            // Bước đi đánh võng (Vung tay chéo ngược với chân)
            this.legLGroup.rotation.x = Math.sin(time) * 0.6;
            this.legRGroup.rotation.x = -Math.sin(time) * 0.6;
            this.armLGroup.rotation.x = -Math.sin(time) * 0.5;
            this.armRGroup.rotation.x = Math.sin(time) * 0.5;
            
            // Ngảy xóc (Bobbing) khi đi
            this.bot.position.y = Math.abs(Math.sin(time * 2)) * 0.15;
            // Đầu lắc lư nhè nhẹ
            if(this.head) this.head.rotation.z = Math.sin(time) * 0.05;
        } else if (this.botState.state === 'IDLE') {
            // Đứng tụt thế thở đều đặn
            this.legLGroup.rotation.x = 0;
            this.legRGroup.rotation.x = 0;
            this.armLGroup.rotation.x = 0;
            this.armRGroup.rotation.x = 0;
            this.bot.position.y = 0;
            
            // Đầu ngó nghiêng vô định
            if(this.head) this.head.rotation.y = Math.sin(time * 0.2) * 0.2;
            if(this.head) this.head.rotation.z = 0;
        }

        // Animation trong lúc vươn tay Tưới Cây
        if (this.botState.state === 'WATERING') {
            this.botLaser.material.opacity = 0.5 + Math.random() * 0.5;
            // Cánh tay xịt nước giật giật
            this.armRGroup.rotation.x = -Math.PI/2 + Math.sin(time * 5) * 0.05;

            // Nhìn thẳng mục tiêu 
            if(this.head) this.head.rotation.y = 0;
            this.legLGroup.rotation.x = 0;
            this.legRGroup.rotation.x = 0;
            this.bot.position.y = 0;
        }

        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.animate();
    }
}

// Khởi chạy khi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    const engine = new FarmIsometricGame();

    const startBtn = document.querySelector('.action-btn');
    startBtn.addEventListener('click', () => {
        engine.start();
    });
});
