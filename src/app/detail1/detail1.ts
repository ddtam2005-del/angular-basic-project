import { Component, OnInit, PLATFORM_ID, Inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; 

@Component({
  selector: 'app-detail1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail1.html',
  styleUrl: './detail1.css'
})
export class Detail1 implements OnInit { 
  locationData: any = null; // Biến chứa toàn bộ dữ liệu từ Backend

  images: string[] = ['images/ha-long.jpg']; // Ảnh mặc định
  currentIndex: number = 0;
  
  // Dữ liệu bình luận mẫu
  reviews: any[] = [];
  newReviewRating: number = 5;
  averageRating: string = '0.0';

  setNewRating(stars: number) {
    this.newReviewRating = stars;
  }

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchLocationDetail(id);
      }
    });
  }

  getRandomColor() {
    const colors = ['#00a86b', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // HÀM KÉO DỮ LIỆU TỪ BACKEND
  async fetchLocationDetail(id: string) {
    try {
      const response = await fetch(`http://localhost:8000/api/locations/${id}`);
      if (response.ok) {
        this.locationData = await response.json();

        // 1. Cập nhật ảnh
        if (this.locationData.images && this.locationData.images.length > 0) {
           this.images = this.locationData.images;
        }

        // 2. Vẽ bản đồ
        if (this.locationData.latitude && this.locationData.longitude) {
           this.initMap(this.locationData.latitude, this.locationData.longitude, this.locationData.name);
        }

        // 3. MAP DỮ LIỆU REVIEWS TỪ BACKEND VÀO UI (Đã thêm bộ lọc Approved)
        if (this.locationData.reviews && this.locationData.reviews.length > 0) {
          
          // Lọc chỉ lấy các đánh giá đã được duyệt (hoặc dữ liệu cũ chưa có cột status)
          const approvedReviews = this.locationData.reviews.filter((r: any) => 
               r.status === 'approved' || !r.status
          );

          this.reviews = approvedReviews.map((r: any) => ({
            id: r.review_id,
            name: r.guest_name || 'Khách ẩn danh',
            avatar: (r.guest_name ? r.guest_name.charAt(0) : 'U').toUpperCase(),
            bgColor: this.getRandomColor(),
            rating: r.rating,
            text: r.comment,
            helpfulCount: Math.floor(Math.random() * 20),
            isLiked: false,
            dateStr: 'Gần đây',
            replies: [],
            showReplyInput: false
          }));
          if (this.reviews.length > 0) {
            // Cộng tổng số sao của tất cả bình luận
            const totalStars = this.reviews.reduce((sum, review) => sum + review.rating, 0);
            // Chia trung bình và làm tròn 1 chữ số thập phân (VD: 4.666 -> 4.7)
            this.averageRating = (totalStars / this.reviews.length).toFixed(1);
          } else {
            this.averageRating = '0.0';
          }
        } else {
          this.reviews = []; 
          this.averageRating = '0.0';
        }

        // ÉP ANGULAR VẼ LẠI GIAO DIỆN NGAY LẬP TỨC 
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết địa điểm:", error);
    }
  }

  // HÀM KHỞI TẠO BẢN ĐỒ TÁCH RỜI
  async initMap(lat: number, lng: number, placeName: string) {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      await import('leaflet-fullscreen');

      const iconDefault = L.icon({
        iconRetinaUrl: 'images/marker-icon-2x.png',
        iconUrl: 'images/marker-icon.png',
        shadowUrl: 'images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41],
        popupAnchor: [1, -34], tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;

      const map = L.map('map-detail', {
        fullscreenControl: true, dragging: true, zoomControl: true, attributionControl: false
      }).setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${placeName}</b>`)
        .openPopup();
    }
  }

  // --- CÁC HÀM XỬ LÝ GIAO DIỆN GIỮ NGUYÊN ---
  goBack() { this.router.navigate(['/']); }
  prevImage() { this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1; }
  nextImage() { this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0; }
  setIndex(index: number) { this.currentIndex = index; }
  onFilterChange(event: any) { /* Logic lọc */ }
  toggleLike(review: any) { 
    if (review.isLiked) { review.helpfulCount--; review.isLiked = false; } 
    else { review.helpfulCount++; review.isLiked = true; }
  }
  toggleReplyInput(review: any) { review.showReplyInput = !review.showReplyInput; }
  submitReply(review: any, text: string) { /* Logic phản hồi */ }
  
  // HÀM ĐĂNG ĐÁNH GIÁ (Chỉ lưu vào DB và chờ duyệt)
  async submitNewReview(name: string, text: string) {
    if (!text.trim()) return;

    const finalName = name.trim() ? name.trim() : 'Khách ẩn danh';
    const rating = this.newReviewRating;

    // Payload gửi xuống DB
    const reviewPayload = {
      locationId: this.locationData.location_id || this.locationData.locationId, 
      guestName: finalName,
      rating: rating,
      comment: text
    };

    try {
      const response = await fetch('http://localhost:8000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewPayload)
      });

      if (response.ok) {
        // Reset lại điểm đánh giá sau khi gửi thành công
        this.newReviewRating = 5; 
        this.cdr.detectChanges(); 
        
        // Hiện thông báo cho người dùng biết là đã được lưu nhưng chờ duyệt
        alert('Cảm ơn bạn! Đánh giá đã được gửi và đang chờ Quản trị viên duyệt.');
      } else {
        alert('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      alert('Không thể kết nối đến máy chủ Backend!');
    }
  }
}