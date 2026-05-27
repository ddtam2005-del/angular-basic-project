import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // 1. Bổ sung công cụ Router

@Component({
  selector: 'app-detail1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail1.html',
  styleUrl: './detail1.css'
})
export class Detail1 { // (Hoặc Detail1Component tùy theo máy ntt sinh ra)

  images: string[] = [
    'images/ha-long.jpg',   // Ảnh số 0
    'images/ha-long-2.jpg', // Ảnh số 1 
    'images/ha-long-3.jpg'  // Ảnh số 2
  ];
  currentIndex: number = 0;
  // 2. Mở cửa đón công cụ Router vào nhà
  constructor(private router: Router, 
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // 3. Định nghĩa hành động cho hàm goBack()
  goBack() {
    // Lệnh này sẽ đưa người dùng quay thẳng về trang chủ
    // (Nếu trang tìm kiếm của ntt có tên khác, ví dụ '/explore', thì ntt sửa lại ở trong ngoặc nhé)
    this.router.navigate(['/']); 
  }
  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.images.length - 1; // Vòng lại ảnh cuối
    }
  }

  // 4. Hàm tiến ảnh
  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Vòng lại ảnh đầu
    }
  }

  // 5. Hàm bấm thẳng vào dấu chấm tròn
  setIndex(index: number) {
    this.currentIndex = index;
  }

  async ngAfterViewInit() {
  if (isPlatformBrowser(this.platformId)) {
    const L = await import('leaflet');
    await import('leaflet-fullscreen');

    // 1. Cấu hình Icon TRƯỚC TIÊN
    const iconRetinaUrl = 'images/marker-icon-2x.png';
    const iconUrl = 'images/marker-icon.png';
    const shadowUrl = 'images/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl, iconUrl, shadowUrl,
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // 2. Khởi tạo map
    const lat = 20.9101;
    const lng = 107.1839;
    const map = L.map('map-detail', {
      fullscreenControl: true,
      dragging: true, 
      zoomControl: true,
      attributionControl: false
    }).setView([lat, lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // 3. Bây giờ mới tạo Marker (nó sẽ lấy cấu hình icon bên trên)
    L.marker([lat, lng]).addTo(map)
      .bindPopup("Vịnh Hạ Long")
      .openPopup();
  }
}
// 1. Mảng dữ liệu bình luận động
  reviews: any[] = [
    {
      id: 1, name: 'Hoàng Nam', avatar: 'H', bgColor: '#00a86b', rating: 5,
      text: 'Chuyến đi tuyệt vời! Du thuyền rất sang trọng và đồ ăn ngon. Chắc chắn sẽ quay lại.',
      helpfulCount: 30, isLiked: false, dateStr: '2 ngày trước', timestamp: 4, // timestamp mô phỏng độ mới
      replies: [], showReplyInput: false
    },
    {
      id: 2, name: 'Linh Chi', avatar: 'L', bgColor: '#3b82f6', rating: 4,
      text: 'Cảnh sắc Hạ Long thực sự hùng vĩ. Hang Sửng Sốt đẹp hơn mình tưởng tượng rất nhiều.',
      helpfulCount: 24, isLiked: false, dateStr: '4 ngày trước', timestamp: 3,
      replies: [
        // Đây là ví dụ một phản hồi đã có sẵn
        { name: 'Việt Nam Travel', text: 'Cảm ơn Linh Chi đã lựa chọn dịch vụ của chúng tôi!', dateStr: '3 ngày trước' }
      ], 
      showReplyInput: false
    },
    {
      id: 3, name: 'Tuấn Anh', avatar: 'T', bgColor: '#f59e0b', rating: 3,
      text: 'Thời tiết tháng 11 siêu đẹp, chụp ảnh góc nào cũng mê. Tuy nhiên cuối tuần hơi đông khách.',
      helpfulCount: 45, isLiked: false, dateStr: '7 ngày trước', timestamp: 2,
      replies: [], showReplyInput: false
    },
    {
      id: 4, name: 'Mai Phương', avatar: 'M', bgColor: '#ef4444', rating: 5,
      text: 'Dịch vụ 5 sao. Chèo Kayak hơi mỏi tay tí nhưng là một trải nghiệm rất đáng để thử!',
      helpfulCount: 12, isLiked: false, dateStr: '10 ngày trước', timestamp: 1,
      replies: [], showReplyInput: false
    }
  ];

  // 2. Hàm xử lý Sắp xếp bình luận
  onFilterChange(event: any) {
    const criterion = event.target.value;
    if (criterion === 'helpful') {
      this.reviews.sort((a, b) => b.helpfulCount - a.helpfulCount); // Nhiều tim nhất lên đầu
    } else if (criterion === 'oldest') {
      this.reviews.sort((a, b) => a.timestamp - b.timestamp); // 5 sao lên đầu
    } else if (criterion === 'recent') {
      this.reviews.sort((a, b) => b.timestamp - a.timestamp); // Mới nhất lên đầu
    }
  }

  // 3. Hàm thả tim (Bấm vào tăng tim, bấm lại trừ tim)
  toggleLike(review: any) {
    if (review.isLiked) {
      review.helpfulCount--;
      review.isLiked = false;
    } else {
      review.helpfulCount++;
      review.isLiked = true;
    }
  }

  // 4. Hàm Bật/Tắt ô nhập phản hồi
  toggleReplyInput(review: any) {
    review.showReplyInput = !review.showReplyInput;
  }

  // 5. Hàm Gửi phản hồi mới
  submitReply(review: any, text: string) {
    if (!text.trim()) return; // Không cho gửi nội dung trống
    review.replies.push({
      name: 'Bạn', // Giả lập người dùng hiện tại
      text: text,
      dateStr: 'Vừa xong'
    });
    review.showReplyInput = false; // Gửi xong thì ẩn ô nhập đi
  }
  // Hàm đăng đánh giá mới của chính người dùng (ntt)
  submitNewReview(text: string) {
    if (!text.trim()) return; // Chặn gửi nội dung trống

    // Lấy ID lớn nhất hiện tại để tạo ID mới
    const newId = this.reviews.length > 0 ? Math.max(...this.reviews.map(r => r.id)) + 1 : 1;
    
    // Đẩy bình luận mới vào đầu mảng (unshift)
    this.reviews.unshift({
      id: newId,
      name: 'ntt', // Tên mặc định của bạn
      avatar: 'N',
      bgColor: '#111827', // Nền đen cho avatar nổi bật
      rating: 5, // Tạm thời mặc định cho 5 sao
      text: text,
      helpfulCount: 0,
      isLiked: false,
      dateStr: 'Vừa xong',
      timestamp: Date.now(), // Lấy thời gian thực để bộ lọc "Mới nhất" hoạt động chuẩn xác
      replies: [],
      showReplyInput: false
    });
  }
}

