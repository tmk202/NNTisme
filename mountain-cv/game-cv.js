document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.querySelector('.action-btn');
    if (!startBtn) return;
    
    startBtn.addEventListener('click', () => {
        // Thêm class gaming-mode vào body để kích hoạt animation ẩn UI
        document.body.classList.add('gaming-mode');
        
        // Cập nhật text hoặc đổi trạng thái các nút
        const title = document.querySelector('.panel-title');
        title.style.opacity = '0'; // Ẩn mượt mà đi
        
        // Giả lập đưa người chơi vào game...
        console.log("▶ Bắt đầu Game Engine... Chờ load Three.js...");
        
        // Bạn có thể chèn code Khởi tạo Experience 3D (xe sa mạc) ở đây sau khi kết nối.
    });
});
