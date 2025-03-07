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
│   ├── map.js                  # Hệ thống bản đồ và lãnh thổ
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

4. Đảm bảo tất cả các file script được đặt trong thư mục `js/`

5. Mở file `index.html` trong trình duyệt web hiện đại để bắt đầu chơi

## Điều khiển

- **Di chuyển**: Phím W, A, S, D
- **Nhắm và bắn**: Chuột
- **Nạp đạn**: Phím R
- **Mở cửa hàng**: Phím E hoặc nút Shop
- **Nâng cấp vũ khí**: Phím Tab hoặc nút Upgrade Weapon
- **Đặt đuốc lãnh thổ**: Phím F
- **Chuyển vũ khí**: Phím Q (tiếp theo), cuộn chuột hoặc phím số 1-3
- **Tương tác với rương**: Tự động khi đến gần

## Tính năng chính

### 1. Hệ thống Lãnh thổ
- **Dọn dẹp Section**: Mỗi section có số lượng zombie cần tiêu diệt cố định
- **Đặt đuốc đánh dấu**: Đặt 4 đuốc ở 4 góc phần tư của section đã dọn dẹp để biến thành lãnh thổ
- **Hiệu ứng trực quan**: Phần tư section đã đặt đuốc sẽ được đánh dấu bằng màu sắc
- **Thanh tiến độ**: Hiển thị số lượng đuốc đã đặt và tiến độ chiếm lãnh thổ
- **Hiệu ứng lãnh thổ**: Tự động hồi máu, tăng sát thương, tăng tốc độ di chuyển
- **Khu vực nhà chính**: Khu vực xuất phát có hiệu ứng lãnh thổ mạnh hơn

### 2. Hệ thống Rương Báu
- **Mở rương kho báu**: Xuất hiện sau khi dọn sạch zombie trong section
- **Phần thưởng đuốc**: Luôn nhận được đuốc với số lượng khác nhau (1-4 đuốc tùy theo tỉ lệ)
- **Phần thưởng đa dạng**: Tiền, đạn, đuốc lãnh thổ, phụ kiện vũ khí

### 3. Hệ thống Đạn Dược
- **Kho đạn riêng biệt**: Mỗi loại vũ khí có loại đạn riêng
- **Nạp đạn từ kho dự trữ**: Hoạt động giống như FPS thực tế
- **Mua đạn tại cửa hàng**: Bổ sung đạn dự trữ bằng tiền xu

### 4. Hệ thống Vũ khí Nâng cấp
- **Phụ kiện vũ khí**: Gắn các phụ kiện (ống ngắm, báng súng, ống giảm thanh...)
- **Tùy chỉnh vũ khí**: Nâng cấp sát thương, tốc độ bắn, độ chính xác
- **Chuyển đổi nhanh**: Chuyển đổi giữa tối đa 3 vũ khí đã trang bị

### 5. Hệ thống UI cải tiến
- **Thanh tiến độ dọn dẹp section**: Hiển thị tiến trình dọn dẹp zombie
- **Hiển thị trạng thái lãnh thổ**: Chỉ báo lãnh thổ và các hiệu ứng đang kích hoạt
- **Chọn vũ khí nhanh**: UI chọn vũ khí trực quan ở phía trên màn hình
- **Hiển thị đuốc lãnh thổ**: Hiển thị số lượng đuốc hiện có

## Cơ chế chiếm lãnh thổ cải tiến

### Dọn dẹp Section
1. Mỗi section có một số lượng zombie cố định dựa trên độ khó
2. Tiêu diệt tất cả zombie để "dọn dẹp" section
3. Section đã dọn dẹp sẽ hiển thị rương báu và đường kẻ chia 4 phần
4. Section đã dọn sẽ không xuất hiện zombie nữa

### Đánh dấu Lãnh thổ
1. Sau khi section đã dọn dẹp, sử dụng đuốc để đánh dấu (phím F)
2. Section được chia thành 4 phần tư bằng nhau, hiển thị bằng đường kẻ đứt
3. Mỗi phần tư cần đặt 1 đuốc (tổng cộng 4 đuốc) ở vị trí khác nhau
4. Mỗi phần tư đã đặt đuốc sẽ được tô màu để dễ nhận biết
5. Thanh tiến độ hiển thị số lượng đuốc đã đặt (1/4, 2/4, 3/4, 4/4)
6. Khi đặt đủ 4 đuốc, section sẽ tự động trở thành lãnh thổ
7. Người chơi nhận bonus XP và hồi máu khi chiếm lãnh thổ thành công

### Rương Kho Báu
1. Xuất hiện tại trung tâm section đã dọn dẹp
2. Mở rương bằng cách đến gần
3. Luôn nhận được đuốc với số lượng khác nhau:
   - 20% cơ hội nhận 1 đuốc
   - 50% cơ hội nhận 2 đuốc
   - 25% cơ hội nhận 3 đuốc
   - 5% cơ hội nhận 4 đuốc
4. Có thể nhận được đạn, tiền xu, phụ kiện vũ khí

## Mở rộng

Game đã được cấu trúc để dễ dàng mở rộng:
1. Thêm loại zombie mới trong `config.js` và `zombies.js`
2. Thêm vũ khí mới trong `weapons.js`
3. Thêm phụ kiện mới trong `config.js` (phần ATTACHMENTS)
4. Thêm hiệu ứng lãnh thổ mới trong `player.js` và `zombies.js`

## Chiến lược chơi

1. Dọn dẹp các section gần để xây dựng mạng lưới lãnh thổ an toàn
2. Mua và nâng cấp vũ khí phù hợp với phong cách chơi
3. Thu thập phụ kiện để cải thiện hiệu suất vũ khí
4. Đặt chiến lược sử dụng đuốc để chiếm lãnh thổ hiệu quả
5. Mở rộng lãnh thổ để có nhiều khu vực an toàn để hồi máu và tái tổ chức
6. Tiêu diệt zombie từ trong lãnh thổ để nhận hiệu ứng tăng sát thương

## Lưu ý

- Game sử dụng nhiều tính năng JavaScript hiện đại, nên cần trình duyệt cập nhật.
- Game hiện tại chưa có chức năng lưu trữ, mọi tiến trình sẽ mất khi refresh trang.
- Để thêm âm thanh, bạn cần tạo hàm `playSound()` trong `utils.js` và bỏ comment các dòng gọi hàm này.