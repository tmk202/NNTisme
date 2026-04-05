import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, OrbitControls, Environment, useTexture, ScrollControls, Scroll, useScroll } from '@react-three/drei';
import * as THREE from 'three';

const FloatingLogo = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll(); // Móc lấy dữ liệu cuộn từ R3F
  
  const texture = useTexture('/logo.png');
  texture.colorSpace = THREE.SRGBColorSpace;

  // Tính toán tỷ lệ dựa theo hình ảnh thực tế
  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  // Kích thước uy nghi của trùm cuối (Đã nhân đôi cho to như núi)
  const width = 30;
  const height = width / aspect;

  // Lấy lại khối lượng không gian đặc bằng 30 lớp siêu khít tạo thành solid 3D mass
  const layers = 30;
  const depthSpacing = 0.02;

  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  React.useLayoutEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < layers; i++) {
        dummy.position.set(0, 0, (i - layers / 2) * depthSpacing);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [layers, depthSpacing, dummy]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Hướng logo nhìn theo con trỏ chuột
      const targetRotationX = -(state.pointer.y * 0.25); 
      const targetRotationY = (state.pointer.x * 0.4);   

      meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotationX, 5, delta);
      meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotationY, 5, delta);
    }

    // Scroll Storytelling: Hoạt ảnh thu nhỏ hình nền và xê dịch sang trái nhường màn hình phải cho Content
    if (groupRef.current && scroll) {
      // Lấy ranh giới 35% thanh cuộn đầu tiên để chuyển cảnh
      const progress = Math.min(scroll.offset / 0.35, 1);
      
      // Nội suy gia tốc trơn tru (Smoothstep) đễ tránh chuyển động gắt
      const smoothT = progress * progress * (3 - 2 * progress);
      
      // X = 0 (Giữa) -> Dạt sang X = -16 (Trượt sâu hơn tẹo để nhường chỗ bản rộng)
      const targetX = THREE.MathUtils.lerp(0, -16, smoothT);
      // Thu nhỏ từ Tỉ lệ gốc 1.0 -> 0.6 (Chỉ thu lại một nửa, giữ dáng uy nghi to bản)
      const targetScale = THREE.MathUtils.lerp(1, 0.6, smoothT);

      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5, delta);
      
      const s = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 5, delta);
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    // Dìm logo rớt thẳng về trạm cuối hệ mặt trời (z = -30) và khai báo Group Reference
    <group ref={groupRef} position={[0, 0, -30]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Ép renderOrder = -1 để rớt xuống làm Layer Cuối Cùng tuyệt đối */}
        <instancedMesh ref={meshRef} args={[undefined, undefined, layers]} renderOrder={-1}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial
            map={texture}
            alphaTest={0.5} // Vẫn giữ đường nét cắt logo
            transparent={true}
            color={'#ffffff'}
            emissive={'#ffffff'}
            emissiveMap={texture}
            emissiveIntensity={10} // Bơm điện lên cực điểm 
            side={THREE.DoubleSide}
            depthWrite={false} // Tắt bộ chắn Z-Buffer để ảnh xa cỡ nào cũng đè lên mặt logo được
            fog={false} // Loại bỏ triệt để sương mù bám vào logo, giúp nó rực rỡ 100% không vệt đen
          />
        </instancedMesh>
      </Float>
    </group>
  );
};

const Scene: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <color attach="background" args={['#000000']} />

        {/* Chỉnh lại màn sương lùi nhẹ ra đằng xa để đỡ kéo sập độ sáng của Logo */}
        <fog attach="fog" args={['#000000', 10, 60]} />

        <ambientLight intensity={1.5} />
        <Environment preset="studio" />

        {/* Bọc lại bằng công cụ Scroll, độ dài 5 trang */}
        <ScrollControls pages={5} damping={0.15} distance={1}>
          <React.Suspense fallback={null}>
            <FloatingLogo />
            
            {/* Giao diện Overlay HTML 2D chạy bám cứng trên nền 3D theo Scroll */}
            <Scroll html style={{ width: '100vw', height: '100vh' }}>
              
              {/* Trang 2: Câu chuyện Khởi nguyên */}
              <div className="absolute top-[120vh] right-[10%] w-[40%] text-right pointer-events-auto">
                <h2 className="text-5xl md:text-7xl font-heading mb-6 tracking-tighter text-white">BORN FROM<br/>THE STREETS</h2>
                <p className="text-xl md:text-2xl text-gray-400 font-body uppercase tracking-widest leading-relaxed">
                  HNBMG không chỉ là nền tảng mặt đất.<br/><span className="text-white font-bold">Đó là bản nguyên vững bền của một thế hệ cuồng Sneaker.</span>
                </p>
              </div>

              {/* Trang 3: Câu chuyện Lưu Trữ Di Sản */}
              <div className="absolute top-[220vh] right-[10%] w-[40%] text-right pointer-events-auto">
                <h2 className="text-5xl md:text-7xl font-heading mb-6 tracking-tighter text-white">THE ARCHIVE</h2>
                <p className="text-xl md:text-2xl text-gray-400 font-body uppercase tracking-widest leading-relaxed">
                  Màu Trắng. Màu Đen. Những vết xước nhuốm vệt thời gian.<br/><span className="text-white font-bold">Mỗi tác phẩm là một nhịp điệu của sự sinh tồn và cái tôi gai góc.</span>
                </p>
              </div>
              
              {/* Trang 4: Tương lai */}
              <div className="absolute top-[340vh] right-[10%] w-[40%] text-right pointer-events-auto">
                <h2 className="text-5xl md:text-7xl font-heading mb-6 tracking-tighter text-white">A NEW ERA</h2>
                <p className="text-xl md:text-2xl text-gray-400 font-body uppercase tracking-widest leading-relaxed">
                  Cuộc chơi nghệ thuật chưa bao giờ có ranh giới.<br/>Băng qua màn sương, chạm đến cốt lõi di sản.
                </p>
              </div>

            </Scroll>

          </React.Suspense>
        </ScrollControls>

        {/* Khóa hoàn toàn góc nhìn camera, không tự động xoay để giữ vững trải nghiệm góc nhìn thứ nhất (tunnel) khi Scroll */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Scene;
