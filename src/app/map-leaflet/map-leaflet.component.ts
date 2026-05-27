import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './map-leaflet.component.html',
  styleUrls: ['./map-leaflet.component.css']
})
export class mapleafletcomponent implements AfterViewInit {
  // Đưa hai biến này ra làm thuộc tính của Class để dùng chung giữa các hàm
  private map: any;
  private L: any;
  private markerInstances: any[] = []; 

  // Các biến liên kết với Giao diện (HTML)
  searchQuery: string = '';
  selectedCategory: string = 'All';

  // Danh sách dữ liệu gốc của bạn
  locations = [
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
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router 
  ) {}

  // Hàm tạo Icon theo màu sắc (giữ nguyên của bạn)
  getIconForCategory(category: string) {
    let iconUrl = 'assets/images/marker-icon.png';
    switch (category) {
      case 'Sinh thái': iconUrl = 'images/marker-icon-green.png'; break;
      case 'Di tích lịch sử': iconUrl = 'images/marker-icon-gold.png'; break;
      case 'Biển đảo': iconUrl = 'images/marker-icon.png'; break;
      case 'Khu vui chơi': iconUrl = 'images/marker-icon-red.png'; break;
    }

    return this.L.icon({ 
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
      this.L = await import('leaflet');
      await import('leaflet-fullscreen');
      (window as any).L = this.L; 

      this.map = this.L.map('map', {
        zoomControl: false,          
        fullscreenControl: false,    
        attributionControl: false
      } as any).setView([16.0, 108.0], 5);

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      // Vẽ toàn bộ địa điểm lên bản đồ khi vừa vào trang (Mặc định không tự động bay)
      this.renderMarkers(this.locations, false);
    }
  }

  // Phụ trách xóa ghim cũ và vẽ ghim mới khi tìm kiếm / lọc
  renderMarkers(filteredLocations: any[], shouldFly: boolean = false) {
    if (!this.map) return;

    // 1. Xóa sạch các ghim hiện tại trên bản đồ
    this.markerInstances.forEach(marker => this.map.removeLayer(marker));
    this.markerInstances = [];

    // 2. Duyệt qua danh sách đã lọc để vẽ lại ghim mới
    filteredLocations.forEach(loc => {
      const marker = this.L.marker([loc.lat, loc.lng], { 
        icon: this.getIconForCategory(loc.category) 
      }).addTo(this.map);

      marker.bindTooltip(`
        <div class="my-tooltip-card">
          <img src="${loc.imageUrl}" alt="${loc.name}" class="my-tooltip-img" />
          <div class="my-tooltip-text">
            <b>${loc.name}</b>
            <span>${loc.info}</span>
          </div>
        </div>
      `, {
        permanent: false,
        direction: 'right',
        offset: [15, 0],
        className: 'custom-tooltip-container' 
      }); 
      
      marker.on('click', () => {
        this.router.navigate([loc.path]);
      });

      // Lưu ghim vào mảng quản lý
      this.markerInstances.push(marker);
    });

    // LOGIC CAMERA: Chỉ tự động bay khi kết quả bằng 1 VÀ hành động đó đến từ việc tìm kiếm chủ động
    if (filteredLocations.length === 1 && shouldFly) {
      this.map.flyTo([filteredLocations[0].lat, filteredLocations[0].lng], 10, {
        animate: true,
        duration: 1.5 // Thời gian hiệu ứng bay (giây)
      });
      // TỰ ĐỘNG XÓA CHỮ TRONG Ô TÌM KIẾM SAU KHI ĐÃ BAY ĐẾN GHIM THÀNH CÔNG
      this.searchQuery = '';
    }
  }

  // Hàm chạy khi người dùng bấm tìm kiếm (Enter / Kính lúp)
  onSearchSubmit() {
    const currentSearch = this.searchQuery.trim().toLowerCase();
    
    // Nếu có gõ chữ tìm kiếm, tự động tìm danh mục của ghim đó để nhảy sáng Tab cho đồng bộ
    if (currentSearch !== '') {
      const foundLoc = this.locations.find(loc => loc.name.toLowerCase().includes(currentSearch));
      if (foundLoc) {
        this.selectedCategory = foundLoc.category;
      }
    }

    this.applyCombinedFilter(true); // Cho phép bay camera đến địa điểm tìm kiếm
  }

  // Hàm chạy khi người dùng bấm chọn các Tab danh mục nằm ngang
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyCombinedFilter(false);
    // ĐƯA CAMERA VỀ KHUNG RỘNG TOÀN CẢNH VIỆT NAM MƯỢT MÀ KHI ĐỔI TAB
    if (this.map) {
      this.map.setView([16.0, 108.0], 5, {
        animate: true,
        duration: 1.5 ,// Thời gian thu nhỏ và di chuyển camera (giây)
        easeLinearity: 0.25, // Kiểm soát tốc độ lướt mượt ở điểm đầu và điểm cuối
        noMoveStart: true    // Ngăn chặn việc ngắt hiệu ứng đột ngột giữa chừng của Leaflet
      });
    }
  }

  // Hàm cốt lõi gom cả Gõ chữ tìm kiếm + Bấm nút phân loại lại với nhau
  applyCombinedFilter(isSearching: boolean = false) {
    
    const currentSearch = this.searchQuery.trim().toLowerCase();
    
    const filtered = this.locations.filter(loc => {
      const matchSearch = loc.name.toLowerCase().includes(currentSearch);
      
      // Nếu đang chủ động gõ tìm kiếm chữ, bỏ qua bộ lọc danh mục để tìm thấy trên phạm vi toàn quốc
      // Còn nếu ô tìm kiếm trống, áp dụng bộ lọc danh mục như bình thường khi click Tab
      const matchCategory = currentSearch !== '' || this.selectedCategory === 'All' || loc.category === this.selectedCategory;
      
      return matchSearch && matchCategory;
    });

    // Vẽ lại và truyền trạng thái kiểm soát hiệu ứng di chuyển camera
    this.renderMarkers(filtered, isSearching);
  }
}