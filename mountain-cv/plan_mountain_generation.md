# 🏔️ KIẾN TRÚC 2.5D: XÂY DỰNG NGỌN NÚI BẰNG THỊ GIÁC & TOÁN LÝ (PROCEDURAL 2.5D MOUNTAIN)

Với tư duy của một Chuyên gia thiết kế Three.js kết hợp với bộ "Bí kíp" 2.5D Parallax của bạn, ngọn núi giờ đây không rỗng tuếch mà là một "Sân khấu kịch nghệ" thị giác có điểm nhấn, mảng khối và Vật lý học.

## 1. PHÂN LỚP CHIỀU SÂU QUANG HỌC (THE PARALLAX LAYERS)
Trong môi trường 2.5D, ngọn núi không đứng đơn độc. Scene sẽ được dựng tách làm 3 Layer `THREE.Group` diệt trừ sự "phẳng lặng" của Web:
- **Tiền Cảnh (Foreground):** Code thuật toán nặn một vài tảng đá mờ tối đen, bụi gai nhô ra ngay Sát camera che một phần rìa màn hình. Dùng ống kính chèn nhẹ hiệu ứng nhòe DoF (Depth of Field) tạo cảm giác rình rập, hùng vĩ.
- **Lớp Tương Tác (Middleground):** Chính là lõi lưới Poly `PlaneGeometry` mà Phượt Chủ đang dẫm lên.
- **Hậu Cảnh (Background):** Phông nền là chuỗi hình bình phong dạng chóp núi xếp lớp. Gắn `THREE.FogExp2` (Sương Khí quyển) để các rặng núi nén sau nhạt dần, xám ngoét chìm vào vô cực (Atmospheric Perspective).

## 2. BIẾN THIÊN GIAO DIỆN MẶT DỐC (SLOPE & TRANSITION DETAILS)
Thay vì một con dốc thẳng băng tẻ nhạt, mặt núi được nhào nặn "có hồn":
- **Độ dốc Thay đổi (Slope Variation):** Áp dụng Toán học Bước sóng Sine Wave hòa tan với Perlin Noise để địa hình uốn lượn. Sẽ có những chặng Lên đỉnh dốc đứng gắt gao (Thể hiện Cực khổ), và những bãi nghiêng tà tà (Trạm thu hoạch ngắm CV, xả hơi).
- **Rễ ngầm & Thạch Nhũ (Detail Transitions):** Viết mã Cấy ngẫu nhiên (`THREE.InstancedMesh`) một vài đoạn rễ cây bám chặt gân guốc, hòn sỏi lăn lóc vào chính các điểm gấp khúc tụt dốc để neo thị giác, báo hiệu ma sát.

## 3. THỦ THUẬT ÉP GÓC MÁY QUAY (CAMERA TRICKS)
Đoạn này ta sẽ dùng hệ thống Camera cực ngầu để làm phẳng không gian (Flatten Depth):
- **Phép nén Tiêu Cự (Telephoto Perspective):** Dùng `PerspectiveCamera` nhưng đặt FOV siêu bé hẹp (Góc nhìn tầm `15 - 30 độ`) sau đó đẩy dạt Camera lùi xa khung cảnh hàng chục mét. Kiểu "Zoom từ trực thăng" này ép phẳng Foreground và Background lại với nhau, tạo chiều sâu 2.5D đậm đặc như dòng game Ori, Hollow Knight!
- Hoặc mạnh tay dùng trực tiếp **`OrthographicCamera`** - Xóa sổ luật xa gần (Perspective Distortion), mọi tỷ lệ núi trước núi sau đều bằng nhau tăm tắp thành nét cắt đồ họa ốp phẳng.

## 4. XỬ LÝ LỘ TRÌNH VÀ VẬT LÝ VA CHẠM (COLLISION & PHYSICS)
Ngọn núi gồ ghề nhưng nhân vật không được lún chân xuyên đá:
- **Đường bao Mượt Mà (Smooth Edge Collider):** Quỹ đạo đi sẽ chạy dựa trên spline curve `CatmullRomCurve3`. Trục Y của đôi chân hoàn toàn bị khóa cứng bám sát liếm sàn Curve này, loại bỏ tối đa hiện tượng nhân vật giật nhảy cóc.
- **Ảo Giác Ma Sát (Friction Illusion):** Căn cứ vào Đạo Hàm Y (Tangent vector đo độ dốc): Ở các đoạn núi dốc, Nhân vật sẽ bị trừ lực kéo cuộn chuột (Scroll chậm rù), bước chân lê lết, chòi chống gậy.

## 5. ÁNH SÁNG CẮT KHỐI & HIỆU ỨNG THỜI TIẾT (ATMOSPHERICS & LIGHTING)
Tạo khối cho không gian 2.5D sống động:
- **Đổ bóng Khắc Lõm (Directional Shadowing):** Áp đặt ngọn hải đăng mặt trời góc chiếu Tà ngang. Dốc núi một bên hứng sáng căng đanh gắt, một bên tự thân gánh lõi đen (Silhouettes shadow), ngay lập tức đánh bật đường gân nổi khối đá núi mà không lo bị giải.
- **Hạt Rơi (Particle Engines):** Xuyên giữa các Layer 1 2 3 sẽ là lưới hệ thống hạt sương mù giăng ngang. Thi thoảng bụi đá hất tung hoặc vài lá khô xoáy lướt từ trái sang phải màn ảnh, phủ đầy sự khốc liệt và Epic của Hành trình.
