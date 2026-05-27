import { Component, AfterViewInit, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css' 
})
export class Home implements AfterViewInit { // Bổ sung implements AfterViewInit cho đúng chuẩn Angular
  selectedCategory: string = 'all'; // Mặc định chọn "Tất cả"
  private map: any; // Lưu đối tượng map
  private L: any;   // Lưu đối tượng thư viện Leaflet
  private markerLayers: { instance: any; category: string }[] = []; // Lưu danh sách marker để ẩn/hiển thị
  // 1. Gộp tất cả công cụ vào chung MỘT constructor duy nhất
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone
  ) {}

  // 2. Hàm xử lý nút Tìm kiếm
  handleSearch() {
    this.router.navigate(['/kham-pha']);
  }

  // 3. Hàm xử lý nút Xem tất cả
  goToExplore() {
    this.router.navigate(['/kham-pha']);
  }
  goToDetail1() {
    this.router.navigate(['/vinh-ha-long']);
  }

  // Hàm tạo Icon theo màu
  getIconForCategory(category: string) {
    let iconUrl = 'images/marker-icon.png'; // mặc định

    // Chuẩn hóa chữ thường để tránh lỗi viết hoa viết thường (ví dụ: Biển đảo vs Biển Đảo)
    switch (category.toLowerCase()) {
      case 'sinh thái': iconUrl = 'images/marker-icon-green.png'; break;
      case 'di tích lịch sử': iconUrl = 'images/marker-icon-gold.png'; break;
      case 'biển đảo': iconUrl = 'images/marker-icon.png'; break;
      case 'khu vui chơi': iconUrl = 'images/marker-icon-red.png'; break;
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

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      await import('leaflet-fullscreen');
      this.L = L; // Lưu vào thuộc tính class
      (window as any).L = L; 

      this.map = L.map('map', {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' },
        attributionControl: false
      } as any).setView([16.0, 108.0], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      // Danh sách địa điểm (Đã sửa chữ 'Biển Đảo' cuối cùng thành 'Biển đảo' cho đồng bộ)
      const locations = [
        { name: 'Vịnh Hạ Long', lat: 20.9101, lng: 107.1839, path: '/vinh-ha-long', category: 'Biển đảo', info: 'Nằm tại QUẢNG NINH - Di sản thiên nhiên thế giới với hàng ngàn đảo đá vôi kỳ vĩ trên mặt nước xanh biếc.', imageUrl: 'images/ha-long-bay.jpg'},
        { name: 'Ruộng bậc thang', lat: 22.356464, lng: 103.873802, path: '/sapa', category: 'Sinh thái', info: 'Nằm tại SAPA - Tuyệt tác ruộng bậc thang uốn lượn bên sườn núi, mang vẻ đẹp thơ mộng vùng cao.', imageUrl: 'images/ruong-bac-thang.jpg' },
        { name: 'Hội An', lat: 15.8801, lng: 108.3380, path: '/hoi-an', category: 'Di tích lịch sử', info: 'Nằm tại QUẢNG NAM - Thương cảng cổ kính với những ngôi nhà tường vàng, đèn lồng rực rỡ và nét hoài cổ.', imageUrl: 'images/hoi-an.jpg' },
        { name: 'Cầu Vàng', lat: 15.996167, lng: 107.988083, path: '/cau-vang', category: 'Khu vui chơi', info:'Nằm tại ĐÀ NẴNG - Nổi tiếng với đôi bàn tay khổng lồ nâng đỡ cây cầu.', imageUrl: 'images/cau-ban-tay.jpg' },
        { name: 'Đảo Ngọc', lat: 10.224090, lng: 103.971560, path: '/dao-ngoc', category: 'Biển đảo', info: 'Nằm tại PHÚ QUỐC - Thiên đường nghỉ dưỡng với những bãi biển cát trắng mịn và làn nước trong vắt.', imageUrl: 'images/phu-quoc.jpg' },
        { name: 'Tràng An', lat: 20.254109, lng: 105.918458, path: '/trang-an', category: 'Sinh thái', info: 'Nằm tại NINH BÌNH - Là điểm nhấn của cố đô Hoa Lư, khu du lịch này đã được UNESCO công nhận là di sản thiên nhiên thế giới', imageUrl: 'images/trang-an.jpg' },
        { name: 'Hoàng thành Thăng Long', lat: 21.0333, lng: 105.8500, path: 'hoang-thanh-thang-long', category: 'Di tích lịch sử', info: 'Nằm tại Hà Nội - Nơi đây hiện lưu giữ vô số hiện vật, các công trình kiến trúc đã phản ánh kỹ thuật xây dựng đỉnh cao và mang đậm những giá trị lịch sử, văn hóa và nghệ thuật truyền thống. ', imageUrl: 'images/hoang-thanh-thang-long.jpg' },
        { name: 'Thác Datanla', lat: 11.90116, lng: 108.44903, path: '/Thac-atanla', category: 'Khu vui chơi', info:'Nằm tại ĐÀ LẠT - Khu du lịch Thác Datanla được mệnh danh là "thiên đường cảm giác mạnh" lớn nhất Đà Lạt', imageUrl: 'images/thac-datanla.jpg' },
        { name: 'Quần thể Cố đô Huế', lat: 16.468889, lng: 107.575556, path: '/co-do-hue', category: 'Di tích lịch sử', info:'Nằm tại Huế - là Di sản văn hóa thế giới được UNESCO công nhận vào năm 1993, tọa lạc dọc hai bờ sông Hương thuộc thành phố Huế và các vùng phụ cận. Đây từng là kinh đô của Việt Nam dưới triều đại nhà Nguyễn từ năm 1802 đến năm 1945.', imageUrl: 'images/hue.jpg' },
        { name: 'Mũi Né', lat: 10.9344, lng: 108.2766, path: '/mui-ne', category: 'Biển đảo', info:'Nằm tại Phan Thiết - Nơi đây được mệnh danh là "kinh đô resort" của Việt Nam nhờ sở hữu đường bờ biển dài thơ mộng và những đồi cát mịn hoang sơ.', imageUrl: 'images/mui-ne.jpg' },
      ]

      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], { 
          icon: this.getIconForCategory(loc.category) 
        }).addTo(this.map);

        marker.bindTooltip(`
          <div class="my-tooltip-card">
            <img src="${loc.imageUrl}" alt="${loc.name}" class="my-tooltip-img" />
            <div class="my-tooltip-text">
              <b>${loc.name}</b>
              <span>${loc.info}</span>
            </div>
          </div>`, {
          permanent: false,
          direction: 'right',
          offset: [15, 0],
          className: 'custom-popup'
        }).openPopup();
        
        marker.on('click', () => {
          this.router.navigate([loc.path]);
        });

        // --- LƯU MARKER VÀO MẢNG ĐỂ PHỤC VỤ LỌC ---
        this.markerLayers.push({
          instance: marker,
          category: loc.category
        });
      });
    }
  }

  // --- HÀM XỬ LÝ LỌC DANH MỤC KHI ẤN TRÊN GIAO DIỆN ---
  selectCategory(categoryKey: string) {
    this.selectedCategory = categoryKey;

    if (!this.map || !this.L) return;

    // Chuyển đổi từ key bên HTML sang text category tương ứng trong dữ liệu
    const categoryMapping: { [key: string]: string } = {
      'eco': 'Sinh thái',
      'history': 'Di tích lịch sử',
      'beach': 'Biển đảo',
      'park': 'Khu vui chơi'
    };

    const targetCategory = categoryMapping[categoryKey];

    this.markerLayers.forEach(item => {
      if (categoryKey === 'all' || item.category === targetCategory) {
        // Nếu chọn tất cả hoặc trùng danh mục -> Hiển thị trên map
        item.instance.addTo(this.map);
      } else {
        // Ngược lại -> Xóa khỏi map (ẩn đi)
        this.map.removeLayer(item.instance);
      }
    });
  }
}
      

