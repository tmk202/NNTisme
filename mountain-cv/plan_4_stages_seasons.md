# 🏞️ KẾ HOẠCH TRIỂN KHAI: HÀNH TRÌNH LEO NÚI QUA 4 MÙA (SCROLLYTELLING)

Hệ thống sẽ chuyển từ màn hình tĩnh (Diorama) sang một trải nghiệm **Cuộn chuột (ScrollyTelling)** thực thụ. Người dùng cuộn chuột xuống, nhân vật tiến về phía trước, phong cảnh chuyển biến mượt mà theo 4 mùa.

## 1. ⚙️ HỆ THỐNG LÕI: SCROLL PROGRESS MAP (0.0 -> 1.0)
Chúng ta sẽ nối sự kiện `window.addEventListener('scroll')` vào một biến `scrollProgress` (từ `0.0` đến `1.0`). Toàn bộ hoạt cảnh trong Game được tính toán nội suy (Interpolation) dựa qua biến duy nhất này.
- `0.0`: Chân núi.
- `1.0`: Đỉnh núi.

## 2. 🚶‍♂️ HOẠT ẢNH NHÂN VẬT LEO NÚI (PROCEDURAL ANIMATION)
Không dùng Animation có sẵn, ta dùng Toán Học để điều khiển các khớp xương giả lập bước đi leo núi phụ thuộc vào *tốc độ cuộn chuột*.

1. **Di chuyển tịnh tiến:** Trục X của nhân vật sẽ dịch từ `X = 40` (điểm bắt đầu) đến `X = 100` (đỉnh núi). Trục Y tự động neo theo hàm `getMountainHeightAt(X, 0)`.
2. **Tuần hoàn cử động đi (Walk Cycle):**
   - Đặt biến `cycle = scrollProgress * 150` (Tạo nhiều bước đi hơn trong một quãng đường dốc).
   - Khớp đùi (Hip): Thay đổi góc xoay `rotation.z` bằng `Math.sin(cycle)`.
   - Cánh tay (Shoulder): Đổi góc bằng `Math.cos(cycle)`.
   - Cơ thể (Torso): Dập dềnh bằng `Math.abs(Math.sin(cycle))`.
   - Nếu người dùng dừng cuộn, các hàm `Math.sin` dừng lại ngay vị trí dở dang (ví dụ đang nhấc 1 chân giữa không trung).

## 3. 🌤️ KỊCH BẢN CHUYỂN MÙA (THE 4 SEASONS TIMELINE)
Sử dụng hàm `THREE.Color.lerp()` để pha trộn màu mượt mà giữa các mốc `scrollProgress`.

### Chặng 1: Mùa Xuân / Spring (0.0 - 0.25)
*Biểu tượng cho: Khởi đầu nỗ lực, chập chững những bước đầu tiên.*
- **Màu nền (Sky/Fog):** Xanh thiên thanh pha hồng nhạt (Màu hoa đào).
- **Màu ánh sáng:** Ánh nắng buổi sớm tinh sương sáng, trong trẻo.
- **Hệ thống Hạt (Particles):** Cánh hoa Đào bay nghiêng ngả nhẹ nhàng (vận tốc X ngang, Z xoắn ốc).

### Chặng 2: Mùa Hạ / Summer (0.25 - 0.5)
*Biểu tượng cho: Gian nan gay gắt, nhiệt huyết nhưng cực nhọc.*
- **Màu nền (Sky/Fog):** Cam cháy, vàng rực rỡ, độ sương mù (Fog) giảm hẳn để lộ chân núi rõ nhất.
- **Màu ánh sáng:** Vàng chói chang, hiệu ứng đổ bóng (Shadows) tương phản sâu, sắc nét.
- **Hệ thống Hạt:** Những vệt "Sóng nhiệt/Bụi nắng" lướt nhanh ngang màn hình. Không khí khô khốc, nóng bức.

### Chặng 3: Mùa Thu / Autumn (0.5 - 0.75)
*Biểu tượng cho: Đi qua giông bão, chín muồi và thu hoạch.*
- **Màu nền (Sky/Fog):** Tím mộng mơ, đỏ cam của ráng chiều hoàng hôn tàn (Bối cảnh gốc ban đầu đang có).
- **Màu ánh sáng:** Nắng chéo hông vàng mượt, sương mù dày lên.
- **Hệ thống Hạt:** Lá khô rụng lộn vòng bay chéo xuống thung lũng (Tạo hàm Fall theo trục Y gắt hơn).

### Chặng 4: Mùa Đông / Winter (0.75 - 1.0)
*Biểu tượng cho: Cán đích vinh quang, vách đá dựng đứng cực độ băng giá.*
- **Màu nền (Sky/Fog):** Lạnh buốt, Ám xanh lam thẫm, xanh navy tối (Mờ ảo bí ẩn).
- **Màu ánh sáng:** Xám bạc nhợt nhạt, Directional Light giảm cường độ, mờ đi.
- **Hệ thống Hạt:** Trận Bão tuyết dữ dội. Hạt chuyển sang màu Trắng và lao thẳng xuống với gia tốc mạnh, quỹ đạo lảo đảo loạn xạ.

## 4. 🎥 QUAN SÁT CAMERA THEO NHÂN VẬT (CAMERA TRACKING)
Hiện tại `OrbitControls` đang nhắm vào trung tâm. Ta sẽ thay đổi để:
- Vị trí Camera (Camera.position) luôn luôn bay theo lưng nhân vật với khoảng cách `OFFSET` duy trì không đổi (`camX = charX - 80`, `camY = charY + 30`).
- Điểm nhìn (Target) luôn khóa chặt (Lock-on) vào người mặc Suit dính đầy sương tuyết.

## TRIỂN KHAI CODE TIẾP THEO (Giai đoạn Thực hành)
1. Thêm bộ biến lưu trữ 4 Bảng Màu (Mùa Xuân $\rightarrow$ Đông).
2. Viết lại hàm `animate()` để không chạy theo thời gian thực nữa, mà chạy nội suy (Lerp) bám sát theo độ cuộn chuột (Scroll position).
3. Gắn CSS `height: 500vh` cho body ẩn để tạo con lăn thực vật lý trên trình duyệt.
