/**
 * DESERT GAME - Dựa trên logic xe sa mạc từ d:\tunn3\CODE\blog
 */

class DesertGame {
    constructor() {
        this.container = document.getElementById('game-canvas-container');
        this.scene = new THREE.Scene();
        
        // Màu sương mù và nền cho giống sa mạc hoàng hôn
        const fogColor = new THREE.Color('#d83e4f');
        this.scene.background = fogColor;
        this.scene.fog = new THREE.FogExp2(fogColor, 0.015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Vị trí camera nhìn từ phía sau xe
        this.camera.position.set(-8, 3, 0);
        this.camera.lookAt(5, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Gắn canvas vào div
        this.container.innerHTML = ''; // Clear placeholder
        this.container.appendChild(this.renderer.domElement);

        // Khởi tạo Core
        this.setupLights();
        this.setupGround();
        this.setupCar();
        this.setupControls();
        this.setupMilestones();

        // Game State (tương lai sẽ cập nhật thêm EXP, máu, v.v)
        this.isPaused = false;
        this.keys = { w: false, a: false, s: false, d: false };
        this.speed = 0;
        this.maxSpeed = 0.8;
        this.acceleration = 0.02;
        this.friction = 0.95; // Quán tính
        this.turnSpeed = 0.05;
        this.groundOffset = 0; // Để tạo hiệu ứng xe đang chạy tới tấp (Treadmill)

        // Cập nhật giao diện thanh trượt
        this.progressBar = document.querySelector('.progress-bar-fill');
        this.progress = 0; // Tiến độ / quãng đường đã đi (điểm)

        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        this.isActive = false; // Chỉ chạy Animation mạnh khi người dùng click
    }

    start() {
        this.isActive = true;
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffcc80, 0.4);
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.dirLight.position.set(-20, 15, 10);
        this.dirLight.castShadow = true;
        
        // Tối ưu shadow camera
        this.dirLight.shadow.camera.left = -30;
        this.dirLight.shadow.camera.right = 30;
        this.dirLight.shadow.camera.top = 30;
        this.dirLight.shadow.camera.bottom = -30;
        
        this.scene.add(this.dirLight);
    }

    setupGround() {
        // Tái sử dụng logic Treadmill (Mặt đất phẳng vô tận cuốn theo) từ code blog
        const terrainGeo = new THREE.PlaneGeometry(160, 80, 80, 40);
        terrainGeo.rotateX(-Math.PI / 2);

        const groundMat = new THREE.MeshStandardMaterial({ 
            color: '#c28b57', // Màu cát sa mạc
            roughness: 0.9,
            flatShading: true
        });
        
        // Gợn sóng trên cát đơn giản
        const posAttr = terrainGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const bump = Math.sin(x * 0.2 + z * 0.1) * 1.5 
                       + Math.cos(x * 0.4 - z * 0.2) * 0.5;
            // Ép phẳng khu vực chính giữa làm đường (Trục Z gần 0)
            let intensity = 1.0;
            if (Math.abs(z) < 4) intensity = 0.1; // Mặt đường
            posAttr.setY(i, bump * intensity);
        }
        terrainGeo.computeVertexNormals();

        this.ground1 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground2 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground1.receiveShadow = true;
        this.ground2.receiveShadow = true;

        this.groundGroup = new THREE.Group();
        this.groundGroup.add(this.ground1);
        this.groundGroup.add(this.ground2);
        
        // Đặt mặt đất
        this.ground1.position.set(0, 0, 0);
        this.ground2.position.set(160, 0, 0);
        this.groundGroup.position.set(0, -1, 0);

        this.scene.add(this.groundGroup);

        // Tạo sỏi đá rải rác chạy dọc hoang mạc
        this.rocksGroup = new THREE.Group();
        const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: '#554433', flatShading: true });
        
        for(let i=0; i<30; i++) {
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(
                (Math.random() - 0.5) * 160,
                0,
                (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 20) // Nằm ngoài đường lộ
            );
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            this.rocksGroup.add(rock);
        }
        this.groundGroup.add(this.rocksGroup);
    }

    setupCar() {
        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);

        this.carBody = new THREE.Group();
        this.carGroup.add(this.carBody);

        // Model hộp thay thế tạm thời trong lúc chưa Load GLB thật
        // Đây chính là điểm bạn sẽ Replace "tôi muốn dùng lại xe xa mạc" (gltf loader)
        const loader = new THREE.GLTFLoader();
        // loader.load('/assets/models/low-poly_truck_car_drifter.glb', ... ) => Tạm tắt để trang demo chạy

        // Fallback: Một chiếc xe Box nghệ thuật
        const boxGeo = new THREE.BoxGeometry(3, 1.2, 1.5);
        const boxMat = new THREE.MeshStandardMaterial({ color: '#ffb703' }); // Màu vàng
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 0.6;
        box.castShadow = true;
        this.carBody.add(box);

        // Bánh xe giả lập
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
        wheelGeo.rotateX(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: '#111' });
        
        this.wheels = [];
        const positions = [
            [1, 0.4, 0.8], [-1, 0.4, 0.8], [1, 0.4, -0.8], [-1, 0.4, -0.8]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            this.carGroup.add(wheel);
            this.wheels.push(wheel);
        });

        // Xe xuất phát ở tâm
        this.carGroup.position.set(0, 0, 0);
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if(this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if(this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
            }
        });
    }

    setupMilestones() {
        this.milestoneObjects = [];
        this.milestonesData = [
            { id: 1, dist: 150, title: "HOCMAI - Streamapp", year: "2023 - Nay", desc: "Nền tảng học trực tuyến hỗ trợ 5.000+ người dùng. Chịu tải cao, tối ưu MySQL < 50ms và real-time qua Redis Pub/Sub.", tags: ["Node.js", "Redis", "Socket.IO", "MySQL"] },
            { id: 2, dist: 350, title: "Virtual Co-Working", year: "2024", desc: "Hệ thống phòng tự học tương tác ảo. Xây dựng kiến trúc Mediasoup SFU cho hàng nghìn video streams, tối ưu độ trễ end-to-end.", tags: ["Mediasoup", "WebRTC", "FastAPI"] },
            { id: 3, dist: 550, title: "AI Chatbot RAG", year: "2024 - 2025", desc: "Hệ sinh thái tự động hoá CSKH, tích hợp Supabase Vector và Gemini/OpenAI. Hoạt động trên n8n giúp xử lý data cực lớn.", tags: ["LLM", "RAG", "n8n", "Vector DB"] },
            { id: 4, dist: 750, title: "Automation Farm", year: "2025", desc: "Farm tài khoản TikTok & Tự động hoá hệ sinh thái tải Video. Chrome Extension crawl siêu tốc & Rotate Proxy nội suy bọc máy.", tags: ["Puppeteer", "Chrome Auth", "Proxy"] }
        ];

        // Tạo một tháp ánh sáng (Monolith) đại diện cho Dự Án
        const monolithGeo = new THREE.BoxGeometry(1.5, 8, 1.5);
        const monolithMat = new THREE.MeshStandardMaterial({ 
            color: '#111', 
            emissive: '#d4af37', 
            emissiveIntensity: 0.6,
            roughness: 0.2
        });

        this.milestonesData.forEach((item, index) => {
            const mesh = new THREE.Mesh(monolithGeo, monolithMat);
            // X là khoảng cách phía trước, Z là lề đường (trái/phải)
            const side = index % 2 === 0 ? -6 : 6; 
            mesh.position.set(item.dist, 3, side);
            mesh.castShadow = true;
            this.scene.add(mesh);
            
            this.milestoneObjects.push({
                mesh: mesh,
                data: item,
                triggered: false
            });
            
            // Halo sáng cho Monolith
            const haloGeo = new THREE.PlaneGeometry(10, 10);
            const haloMat = new THREE.MeshBasicMaterial({
                color: '#d4af37', transparent: true, opacity: 0.2, 
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            halo.position.y = 2;
            mesh.add(halo);
        });

        // Setup Đóng Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('projectModal').classList.remove('show');
            this.isPaused = false;
        });
    }

    triggerMilestone(data) {
        this.isPaused = true;
        this.speed = 0; // Phanh gấp xe lại
        this.keys = { w: false, a: false, s: false, d: false }; // Xóa thao tác phím

        // Render dữ liệu Modal
        document.getElementById('modalYear').innerText = data.year;
        document.getElementById('modalTitle').innerText = data.title;
        document.getElementById('modalDesc').innerText = data.desc;
        
        const tagsHtml = data.tags.map(t => `<span>${t}</span>`).join('');
        document.getElementById('modalTags').innerHTML = tagsHtml;
        
        // Hiển thị Popup
        document.getElementById('projectModal').classList.add('show');
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePhysics() {
        if(this.isPaused) return;

        // Tốc độ xe (W: Tăng tốc, S: Phanh/Lùi)
        if (this.keys.w) {
            this.speed += this.acceleration;
        } else if (this.keys.s) {
            this.speed -= this.acceleration;
        }

        // Quán tính ma sát
        this.speed *= this.friction;

        // Giới hạn maxSpeed
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        // Bẻ lái (A, D) khi đang có tốc độ
        if (Math.abs(this.speed) > 0.05) {
            const turnMod = (this.speed > 0) ? 1 : -1;
            if (this.keys.a) this.carGroup.position.z -= this.turnSpeed * turnMod;
            if (this.keys.d) this.carGroup.position.z += this.turnSpeed * turnMod;
            
            // Giới hạn chạy lệch ra lề đường
            if(this.carGroup.position.z > 8) this.carGroup.position.z = 8;
            if(this.carGroup.position.z < -8) this.carGroup.position.z = -8;
            
            // Hiệu ứng nghiêng xe khi bẻ lái
            const targetRoll = (this.keys.a ? 0.1 : (this.keys.d ? -0.1 : 0));
            this.carGroup.rotation.x += (targetRoll - this.carGroup.rotation.x) * 0.1;
        } else {
            this.carGroup.rotation.x *= 0.9; // Trả lái
        }

        // Hiệu ứng tăng/giảm tốc giật lùi camera (Nose dive/lift)
        const targetPitch = this.speed * 0.05;
        this.carGroup.rotation.z += (targetPitch - this.carGroup.rotation.z) * 0.1;

        // Xoay bánh xe
        this.wheels.forEach(w => w.rotation.z -= this.speed * 0.5);

        // Cuộn mặt đất (Treadmill) ngược lại với chiều xe chạy
        this.groundOffset -= this.speed;
        if (this.groundOffset <= -160) {
            this.groundOffset += 160;
        } else if (this.groundOffset >= 160) {
            this.groundOffset -= 160;
        }
        this.groundGroup.position.x = this.groundOffset;

        // Rung nhẹ thân xe khi phóng nhanh (Bump)
        this.carBody.position.y = (Math.random() * 0.05 * (this.speed / this.maxSpeed));
        
        // Progress HUD update (Cầu đường thăng tiến!)
        if(this.speed > 0) {
            // Thanh máu full ở quãng đường 850
            this.progress = (this.milestoneObjects[0].mesh.position.x > -1000) ? 
                (1 - (Math.max(0, this.milestoneObjects[this.milestoneObjects.length-1].mesh.position.x) / 750)) * 100 : 100;
            
            if(this.progress > 100) this.progress = 100;
            if(this.progressBar) this.progressBar.style.width = this.progress + "%";
        }
        
        // Di chuyển các khối Milestones lao về phía xe
        this.milestoneObjects.forEach(m => {
            m.mesh.position.x -= this.speed;
            
            // Nếu Milestone lại gần xe (khoảng cách x = 1) -> Kích hoạt Pop up
            if(!m.triggered && Math.abs(m.mesh.position.x) < 2) {
                m.triggered = true;
                this.triggerMilestone(m.data);
            }
            // Quay vòng quay nhỏ cho vui mắt
            m.mesh.rotation.y += 0.01;
            m.mesh.children[0].lookAt(this.camera.position); // Chỉnh Halo luôn hướng về Camera
        });

        // Cập nhật vị trí Camera đi theo lén xe
        // Z của camera lerp nhẹ theo Z của xe
        this.camera.position.z += (this.carGroup.position.z - this.camera.position.z) * 0.05;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (this.isActive) {
            this.updatePhysics();
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Chờ click "Bắt đầu chuyến đi" để Boot game
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Game nhưng chưa Render mạnh
    const game = new DesertGame();

    const startBtn = document.querySelector('.action-btn');
    startBtn.addEventListener('click', () => {
        // Hàm startgame nạp vào JS
        game.start();
    });
});
