# Zombie Shooter Game - Hướng dẫn triển khai

## Cấu trúc file

Trò chơi được tổ chức thành nhiều file để dễ bảo trì và mở rộng. Dưới đây là cấu trúc thư mục và mô tả chức năng của từng file:

```
zombie-shooter/
│
├── index.html                  # File HTML chính
├── styles.css                  # CSS chính cho giao diện game
├── screen-flash.css            # CSS cho hiệu ứng flash màn hình
│
├── js/                         # Thư mục chứa code JavaScript
│   ├── config.js               # Cấu hình và hằng số game
│   ├── utils.js                # Các hàm tiện ích
│   ├── player.js               # Hệ thống người chơi
│   ├── weapons.js              # Hệ thống vũ khí
│   ├── zombies.js              # Logic zombie và AI
│   ├── map.js                  # Hệ thống bản đồ
│   ├── ui.js                   # Giao diện người dùng và menu
│   └── game.js                 # Logic chính của game
│
└── assets/                     # (Tùy chọn) Thư mục chứa tài nguyên
    ├── sounds/                 # Âm thanh
    └── fonts/                  # Font chữ
```

## Cách triển khai

1. Tạo thư mục `zombie-shooter` trên máy tính của bạn

2. Tạo cấu trúc thư mục như trên

3. Sao chép nội dung của mỗi file từ các artifact vào file tương ứng

4. Đối với file HTML, thêm đường dẫn đến thư mục `js/` (Hiện tại đang link trực tiếp đến root)
   ```html
   <!-- Thay đổi từ -->
   <script src="config.js"></script>
   
   <!-- Thành -->
   <script src="js/config.js"></script>
   ```

5. Thêm link đến file CSS flash screen trong index.html:
   ```html
   <head>
       <!-- ... các phần khác ... -->
       <link href="styles.css" rel="stylesheet">
       <link href="screen-flash.css" rel="stylesheet">
   </head>
   ```

## Chạy game

1. Mở file `index.html` trong trình duyệt web hiện đại (Chrome, Firefox, Edge, v.v.)
2. Game sẽ bắt đầu tự động sau khi màn hình loading hoàn tất

## Điều khiển

- **Di chuyển**: Phím W, A, S, D
- **Nhắm và bắn**: Chuột
- **Nạp đạn**: Phím R
- **Mở cửa hàng**: Phím E hoặc nút Shop
- **Nâng cấp vũ khí**: Phím Tab hoặc nút Upgrade Weapon

## Tính năng chính

1. **Bản đồ vô hạn**: Không giới hạn không gian, độ khó tăng theo khoảng cách
2. **Hệ thống nhân vật**: Tăng cấp chỉ số (sát thương, tỉ lệ chí mạng, tốc độ di chuyển, máu)
3. **Hệ thống vũ khí**: Nhiều loại vũ khí với đặc tính khác nhau, có thể nâng cấp
4. **Zombie đa dạng**: Bốn loại zombie với hành vi và chỉ số khác nhau
5. **Minimap**: Hiện thị vị trí zombie và khu vực đã khám phá

## Mở rộng

Bạn có thể dễ dàng mở rộng game bằng cách:

1. Thêm vũ khí mới vào `weapons.js`
2. Thêm loại zombie mới vào `config.js` và `zombies.js`
3. Thêm nâng cấp mới vào `config.js`
4. Thêm âm thanh và hình ảnh (cần thêm code để hỗ trợ)

## Lưu ý

- Game sử dụng nhiều tính năng JavaScript hiện đại, nên cần trình duyệt cập nhật.
- Game hiện tại chưa có chức năng lưu trữ, mọi tiến trình sẽ mất khi refresh trang.
- Để thêm âm thanh, bạn cần tạo hàm `playSound()` trong `utils.js` và bỏ comment các dòng gọi hàm này.
