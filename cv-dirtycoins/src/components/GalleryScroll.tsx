import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';

const rawImages = import.meta.glob('../../assets/*.jpg', { eager: true, query: '?url', import: 'default' });
const baseImages = Object.values(rawImages) as string[];

// Nhồi nhét một lượng khổng lồ ảnh (x20 lần = Hơn 400 bức) để đáp ứng mật độ dày đặc kín bưng
const images: string[] = [];
for (let i = 0; i < 20; i++) {
  images.push(...baseImages);
}

export const GalleryScroll = () => {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  const positions = useMemo(() => {
    // Thuật toán: Chia mặt phẳng màn hình thành các "Làn đường bay" (Lanes/Grid) để ép ảnh cách xa nhau
    const lanes: {x: number, y: number}[] = [];
    const cols = 9;  // 9 cột
    const rows = 7;  // 7 hàng
    const gridWidth = 60;
    const gridHeight = 40;
    
    // Khởi tạo các ô grid (Lanes)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        lanes.push({
          x: (c / cols - 0.5) * gridWidth,
          y: (r / rows - 0.5) * gridHeight
        });
      }
    }

    return images.map((_, i) => {
      // Phân bổ các ảnh cạnh nhau theo độ Z vào các làn bay tít xa nhau (nhân với số nguyên tố 17 để xóc grid)
      const laneIndex = (i * 17) % lanes.length;
      const lane = lanes[laneIndex];
      
      // Thêm jitter xê dịch ngẫu nhiên thật nhẹ bên trong tầm an toàn của Làn bay để phá bỏ sự rập khuôn
      const x = lane.x + (Math.random() - 0.5) * 2; 
      const y = lane.y + (Math.random() - 0.5) * 2; 
      
      // Mật độ siêu nhặt Z
      const z = -20 - (i * 2.5);
      
      const rotation = [0, 0, 0] as [number, number, number];

      // Bóp nhẹ cái scale tối đa để tụi nó lọt thỏm giữa làn, chừa đúng khoảng cách lề hở y như yêu cầu 5~10px
      const scale = 1.0 + Math.random() * 2.2; 

      return { x, y, z, rotation, scale };
    });
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Vì thư viện ảnh quá đông, kéo targetZ xa hơn để có khả năng scroll lướt tới bức cuối cùng (2.5 * 400 = 1000)
      const targetZ = scroll.offset * 1050;
  
      groupRef.current.position.z = THREE.MathUtils.damp(
        groupRef.current.position.z,
        targetZ,
        4,
        delta
      );

      const currentGroupZ = groupRef.current.position.z;
      
      groupRef.current.children.forEach((imageMesh: any) => {
        const absoluteZ = imageMesh.position.z + currentGroupZ;
        
        let desiredOpacity = 0;
        if (absoluteZ > -20) {
          desiredOpacity = 0.85;
        } else if (absoluteZ < -70) {
          desiredOpacity = 0;
        } else {
          desiredOpacity = 0.85 * (1 - (absoluteZ - (-20)) / (-70 - (-20)));
        }

        // Tối ưu hóa hạng nặng (Culling): Nếu ảnh mờ tăm do ở xa, ẩn luôn khỏi bộ quét WebGL để chống chết GPU
        if (desiredOpacity === 0) {
          imageMesh.visible = false;
        } else {
          imageMesh.visible = true;
          if (imageMesh.material) {
            imageMesh.material.opacity = desiredOpacity;
            imageMesh.material.transparent = true;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {images.map((url, i) => (
        <DreiImage
          key={i}
          url={url}
          position={[positions[i].x, positions[i].y, positions[i].z]}
          rotation={positions[i].rotation}
          scale={[positions[i].scale, positions[i].scale * 1.2, 1]}
          transparent
          grayscale={1 as any} 
          opacity={0.85}
        />
      ))}
    </group>
  );
};
