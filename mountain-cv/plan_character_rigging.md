# 🚶 CHI TIẾT KỸ THUẬT: CƠ KHÍ NHÂN VẬT THỦ CÔNG (PROCEDURAL HIKER RIGGING)

Không phó thác thiết kế vào các mẫu xương Rig đơ cứng bằng file tải sẵn. Chúng ta sẽ "khoét gỗ" để nặn ra 1 con rối **Dân Phượt Chuyên Nghiệp (The Hiker)** trực tiếp bằng hàm Toán Hình học. Rất góc cạnh, rất nghệ thuật Indie.

## 1. CẤU TRÚC HỆ XƯƠNG PHẢ HỆ (HIERARCHY KINEMATIC TREE)
Ta sẽ lắp ráp từ các khối `THREE.BoxGeometry` đặt trong một gia phả. Một khớp xương gốc di động (Xoay/Trượt) sẽ kéo theo sự gập của toàn cạp xương con:
- **`Group_ToanThân`** (Hộp Chứa vị trí rốn, neo bản đồ tuyệt đối)
  - **`Torso`** (Thân Bụng - Khoác áo dã ngoại sặc sỡ, đeo hẳn 1 khối Balo sau lưng cồng kềnh)
    - **`Head`** (Đầu & Đội chiếc thùng nón vành tai bèo úp che nắng mặt trời)
    - **`ShoulderLeft`** $\rightarrow$ **`ArmLeft`** (Bắp tay trái vung vẩy hờ hững)
    - **`ShoulderRight`** $\rightarrow$ **`ArmRight`** $\rightarrow$ **`TrekkingPole`** (Tay phải nắm chặt một Cán trụ Dài đâm toạc chống đất cày từng nhịp)
  - **`HipLeft`** $\rightarrow$ **`LegLeft`** (Chân trái)
  - **`HipRight`** $\rightarrow$ **`LegRight`** (Chân phải gập gối đầm chồi)

## 2. CHUYỂN ĐỘNG LEAN & WALK (PROCEDURAL WALK CYCLE LOGIC)
Vì trục quay Cuộn chuột đã tự động đẩy lùi cái Cột Rốn `Group_ToanThân` lao trên đường núi (Thanh Curoa Ròng Rọc), việc còn lại của Đôi chân Gỗ là nhấp nháy xoay khớp giả lập chuyển động nhịp:
- **Bắt mạch Nhịp Đi (Pacing):** `const cycle = ScrollDelta * speedWalk;` (Lăn nhanh $\rightarrow$  chạy dốc sức. Khựng tay lăn $\rightarrow$  Đóng băng thở dốc, rất chân thực).
- **Tuần hoàn Tay Chân So Le:** Tay Trái và Chân Phải sẽ đung đưa cùng Phương Sine. Tay Phải, Chân Trái đung đưa mạn Ngược (Nghịch dấu Sine).
   - `LegLeft.rotation.x = Math.sin(cycle) * MAX_STEP;`
   - `ArmLeft.rotation.x = -Math.sin(cycle) * MAX_SWING;`
- **Khối tâm Nhấp nhô (Weight Bobbing):** Lúc hất chân lên tảng đá, cơ Thể sẽ nhấc bổng 1 cái và chịu gia tốc Y Rơi. Chiều dọc `Y-axis` của khối Bụng sẽ nảy theo hàm `Math.abs(Math.sin)` tuyệt đối.
- **Rướn Về Phía Trước Gồng Leo:** Người phượt thủ lên Dốc thì Thân hình (Torso) không thể đứng thẳng, phải bẻ Rướn cắm đầu vào `rotation.x = -15 độ` đối nghịch chống lại độ dốc Lực hút Trái Đất núi non!

## 3. THỊ GIÁC ĐỊNH HƯỚNG TANGENT (THE TANGENT LOOKAT)
Không có chuyện nhân vật trôi trên núi mà mặt mũi xoay ngang lệch tâm vách lề được! Khi Cuộn quanh Co:
- Bóc tách Đạo Yếu Tố Khúc cua (Vector Tiếp tuyến): `const targetDir = curve.getTangentAt(ScrollPercent);`
- Ép con rối hướng mặt `lookAt()` cực gắt rà theo vector mũi tên Đạo hàm đó.
- Ngay lúc vách đá bị bẻ ngoặt 90 độ mạn sườn, anh ta sẽ dứt khoát ngoái đầu vặn mình nghiêng dọc đúng cái hướng quẹo ngay tức khắc, ngạo nghễ đạp bước lên đường vòng xuyến ngõ khuất!
