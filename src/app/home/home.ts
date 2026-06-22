import { Component, AfterViewInit, PLATFORM_ID, Inject, NgZone, signal } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css' 
})
export class Home implements AfterViewInit {
  selectedCategory: string = 'Tất cả'; 
  private map: any; 
  private L: any;   
  private markerLayers: { id: string, instance: any; category: string }[] = []; 
  topMapLocationIds: string[] = [];

  // KHAI BÁO TÍN HIỆU ĐỂ HỨNG DỮ LIỆU TỪ BACKEND
  trendingLocations = signal<any[]>([]);
  categories = signal<any[]>([]);
  searchKeyword: string = '';
  searchRegion: string = 'tat-ca';
  searchCategory: string = 'tat-ca';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone
  ) {}
  
  ngOnInit() {
    this.loadCategories();
  }

  handleSearch() { this.router.navigate(['/kham-pha'], {
      queryParams: {
        keyword: this.searchKeyword,
        region: this.searchRegion,
        category: this.searchCategory
      }
    });
   }
  goToExplore() { this.router.navigate(['/kham-pha']); }
  goToDetail(id: string | number) {
  this.router.navigate(['/detail', id]);
}
  // 🎨 HÀM LẤY MÀU SẮC CHO BẢNG PHÂN LOẠI
  getBadgeColor(category: string): string {
    const cat = category?.toLowerCase() || '';
    
    if (cat.includes('sinh thái')) return '#32CD32'; // Xanh lá
    if (cat.includes('lịch sử') || cat.includes('di tích')) return '#FFD700'; // Vàng
    if (cat.includes('biển đảo')) return '#1E90FF'; // Xanh dương
    if (cat.includes('vui chơi')) return '#FF4500'; // Cam đỏ
    
    return '#555555'; // Màu xám mặc định
  }

  // 📍 HÀM LẤY ICON ĐỊNH VỊ CHO BẢN ĐỒ
  getIconForCategory(category: string) {
    const cat = category?.toLowerCase() || '';
    let iconUrl = 'images/marker-icon.png'; // Màu xanh dương mặc định (Biển đảo)

    // Đổi màu icon dựa trên từ khóa
    if (cat.includes('sinh thái')) {
      iconUrl = 'images/marker-icon-green.png'; // Chuyển sang lá
    } else if (cat.includes('lịch sử') || cat.includes('di tích')) {
      iconUrl = 'images/marker-icon-gold.png'; // Chuyển sang vàng
    } else if (cat.includes('vui chơi')) {
      iconUrl = 'images/marker-icon-red.png'; // Chuyển sang đỏ
    }

    const leaflet = this.L || (window as any).L;
    return leaflet.icon({
      iconUrl: iconUrl,
      shadowUrl: 'images/marker-shadow.png',
      iconSize: [20, 32], 
      iconAnchor: [10, 32], 
      popupAnchor: [0, -30], 
      shadowSize: [32, 32]
    });
  }

  async loadCategories() {
    try {
      // Đảm bảo bạn đã có API này ở Backend Spring Boot
      const response = await fetch('http://localhost:8000/api/categories'); 
      if (response.ok) {
         const data = await response.json();
         this.categories.set(data); // Đổ dữ liệu vào biến
      }
    } catch (error) {
       console.error("Lỗi tải dữ liệu Danh mục:", error);
    }
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      await import('leaflet-fullscreen');
      this.L = L; 
      (window as any).L = L; 

      this.map = L.map('map', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        attributionControl: false
      } as any).setView([16.0, 108.0], 5); // Tọa độ trung tâm Việt Nam

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      // 🌟 VẼ BẢN ĐỒ XONG THÌ GỌI API
      await this.loadRealData();
    }
  }

  // HÀM KÉO DỮ LIỆU TỪ SPRING BOOT
  async loadRealData() {
    try {
      const response = await fetch('http://localhost:8000/api/locations');
      if (response.ok) {
         const allData = await response.json();

         //  Chạy ngầm API chi tiết để rút số sao chuẩn xác
         // 🌟 LẤY SAO VÀ ẢNH TRUNG BÌNH
         const formattedData = await Promise.all(allData.map(async (loc: any) => {
            let avg = '0.0';
            let imgUrl = 'images/ha-long.jpg';

            try {
              const detailId = loc.id || loc.locationId || loc.location_id;
              const detailRes = await fetch(`http://localhost:8000/api/locations/${detailId}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();

                // 📸 LẤY ẢNH ĐẦU TIÊN
                if (detailData.images && detailData.images.length > 0) {
                    const firstImg = detailData.images[0];
                    imgUrl = typeof firstImg === 'string' ? firstImg : firstImg.imageUrl;
                    if (imgUrl && !imgUrl.startsWith('http')) {
                        imgUrl = 'http://localhost:8000/uploads/' + imgUrl;
                    }
                }

                // LẤY SỐ SAO TRUNG BÌNH
                if (detailData.reviews && detailData.reviews.length > 0) {
                  const approved = detailData.reviews.filter((r: any) => r.status === 'approved' || !r.status);
                  if (approved.length > 0) {
                    const total = approved.reduce((sum: number, r: any) => sum + r.rating, 0);
                    avg = (total / approved.length).toFixed(1);
                  }
                }
              }
            } catch (e) { }

            return { ...loc, averageRating: avg, imageUrl: imgUrl };
         }));

        // Chỉ lấy những địa điểm active 
         const activeData = formattedData.filter((loc: any) => 
            loc.status === 'active' || loc.status === 'approved'
         );

         //  SẮP XẾP TOÀN BỘ THEO LƯỢT XEM TỪ CAO XUỐNG THẤP
         const sortedLocations = [...activeData].sort((a, b) => (b.views || 0) - (a.views || 0));

         // 1. TÁCH TOP 4 CHO PHẦN THỊNH HÀNH
         const topTrending = sortedLocations.slice(0, 4);
         this.trendingLocations.set(topTrending);

         // 2. LƯU LẠI ID CỦA TOP 10 ĐỊA ĐIỂM (Không cắt bỏ dữ liệu đi)
         this.topMapLocationIds = sortedLocations.slice(0, 10).map(loc => loc.id);
         
         // 3. Bơm TOÀN BỘ dữ liệu cho Bản đồ tạo ghim
         this.renderMarkers(activeData);
         
         // 4. Gọi bộ lọc mặc định để hiển thị Top 10 lúc mới vào web
         this.selectCategory('Tất cả');
      }
    } catch (error) {
       console.error("Lỗi tải dữ liệu Trang chủ:", error);
    }
  }

  // HÀM VẼ GHIM LÊN BẢN ĐỒ
  renderMarkers(locations: any[]) {
     locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;

        // 🌟 BỎ đuôi .addTo(this.map) ở dòng này
        const marker = this.L.marker([loc.latitude, loc.longitude], { 
          icon: this.getIconForCategory(loc.category) 
        });

        const imageUrl = loc.imageUrl || 'images/ha-long.jpg'; 
        const desc = loc.description ? loc.description.substring(0, 60) : 'Đang cập nhật...';

        marker.bindTooltip(`
          <div class="my-tooltip-card">
            <img src="${imageUrl}" alt="${loc.name}" class="my-tooltip-img" onerror="this.src='images/ha-long.jpg'" />
            <div class="my-tooltip-text">
              <b>${loc.name}</b>
              <span>Nằm tại ${loc.province} - ${desc}...</span>
            </div>
          </div>`, {
          permanent: false, direction: 'right', offset: [15, 0], className: 'custom-popup'
        }); // 🌟 BỎ đuôi .openPopup() ở đây luôn để nó không tự mở lúc load
        
        marker.on('click', () => {
          this.ngZone.run(() => {
             this.router.navigate(['/detail', loc.id]);
          });
        });

        // 🌟 CẬP NHẬT: Lưu cả id của địa điểm
        this.markerLayers.push({ id: loc.id, instance: marker, category: loc.category });
     });
  }

  // LỌC BẢN ĐỒ
  selectCategory(categoryName: string) {
    this.selectedCategory = categoryName;
    if (!this.map || !this.L) return;

    this.markerLayers.forEach(item => {
      this.map.removeLayer(item.instance); // 🌟 Ẩn hết tất cả trước

      if (categoryName === 'Tất cả') {
        // Nếu chọn Tất cả -> Chỉ hiện những thằng nằm trong Top 10
        if (this.topMapLocationIds.includes(item.id)) {
          item.instance.addTo(this.map);
        }
      } else {
        // Nếu chọn danh mục cụ thể -> Hiện TẤT CẢ của danh mục đó
        if (item.category === categoryName) {
          item.instance.addTo(this.map); 
        }
      }
    });
  }
}