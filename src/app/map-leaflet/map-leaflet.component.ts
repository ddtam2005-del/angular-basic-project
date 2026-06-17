import { Component, AfterViewInit, PLATFORM_ID, Inject, signal, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './map-leaflet.component.html',
  styleUrls: ['./map-leaflet.component.css']
})
export class mapleafletcomponent implements OnInit, AfterViewInit {
  private map: any;
  private L: any;
  private markerInstances: any[] = []; 
  private searchMarkerInstance: any = null; 

  searchQuery: string = '';
  selectedCategory: string = 'All';

  // 🌟 GOM TOÀN BỘ VÀO MỘT MẢNG DUY NHẤT (Không chia Top 5 nữa)
  locations: any[] = [];
  categories = signal<any[]>([]);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router 
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadRealLocations();
  }

  removeAccents(str: string): string {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  async loadCategories() {
    try {
      const response = await fetch('http://localhost:8000/api/categories');
      if (response.ok) {
        this.categories.set(await response.json());
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }

  async loadRealLocations() {
    try {
      const response = await fetch('http://localhost:8000/api/locations');
      if (response.ok) {
        const rawData = await response.json();
        
        // Lấy tất cả địa điểm đang hiển thị (active/approved)
        const activeData = rawData.filter((loc: any) => loc.status === 'active' || loc.status === 'approved');

        const mappedData = activeData.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          lat: loc.latitude,
          lng: loc.longitude,
          category: loc.category,
          info: `Nằm tại ${loc.province} - ${loc.description ? loc.description.substring(0, 60) : 'Đang cập nhật'}...`,
          imageUrl: 'images/ha-long.jpg',
          views: loc.views || 0,
          path: `/detail/${loc.id}` 
        }));

        mappedData.sort((a: any, b: any) => b.views - a.views);

        // 🌟 ÉP TẤT CẢ DỮ LIỆU LÊN BẢN ĐỒ NGAY LẬP TỨC
        this.locations = mappedData;

        if (this.map) {
          this.applyCombinedFilter(false);
        }
      }
    } catch (error) {
      console.error("Lỗi tải địa điểm:", error);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('leaflet').then(leaflet => {
        this.L = leaflet;
        this.map = this.L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([16.0, 108.0], 5);

        this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

        if (this.locations.length > 0) {
          this.applyCombinedFilter(false);
        }
      });
    }
  }
  
  getBadgeColor(category: string): string {
    const cat = category?.toLowerCase() || '';
    
    // Ưu tiên 1: Các màu cố định cho các danh mục quen thuộc
    if (cat.includes('sinh thái') || cat.includes('thiên nhiên') || cat.includes('núi')) return '#32CD32'; // Xanh lá
    if (cat.includes('lịch sử') || cat.includes('di tích') || cat.includes('văn hóa')) return '#FFD700'; // Vàng
    if (cat.includes('biển') || cat.includes('đảo')) return '#1E90FF'; // Xanh dương
    if (cat.includes('vui chơi') || cat.includes('giải trí')) return '#FF4500'; // Cam đỏ
    if (cat.includes('nghỉ dưỡng') || cat.includes('resort')) return '#9370DB'; // Tím
    if (cat.includes('thành phố') || cat.includes('đô thị')) return '#607D8B'; // Xanh xám
    
    // Ưu tiên 2: Thuật toán tự động cấp màu ngẫu nhiên (nhưng cố định) cho danh mục mới
    // Đảm bảo không bao giờ có danh mục nào bị màu xám chán ngắt nữa!
    const colorPalette = ['#e84393', '#00cec9', '#6c5ce7', '#fdcb6e', '#e17055', '#00b894', '#16a085'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  }

  getIconForCategory(category: string) {
    const cat = category?.toLowerCase() || '';
    let iconUrl = 'images/marker-icon.png'; // Mặc định xanh dương (Biển đảo hoặc các mục khác)

    // Khớp icon bản đồ với nhóm từ khóa
    if (cat.includes('sinh thái') || cat.includes('thiên nhiên') || cat.includes('núi')) {
      iconUrl = 'images/marker-icon-green.png';
    } else if (cat.includes('lịch sử') || cat.includes('di tích') || cat.includes('văn hóa')) {
      iconUrl = 'images/marker-icon-gold.png';
    } else if (cat.includes('vui chơi') || cat.includes('giải trí')) {
      iconUrl = 'images/marker-icon-red.png';
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

  renderMarkers(filteredLocations: any[], shouldFly: boolean = false) {
    if (!this.map) return;

    this.markerInstances.forEach(marker => this.map.removeLayer(marker));
    this.markerInstances = [];

    filteredLocations.forEach(loc => {
      const marker = this.L.marker([loc.lat, loc.lng], { 
        icon: this.getIconForCategory(loc.category) 
      }).addTo(this.map);

      marker.bindTooltip(`
        <div class="my-tooltip-card">
          <img src="${loc.imageUrl}" alt="${loc.name}" class="my-tooltip-img" onerror="this.src='images/ha-long.jpg'" />
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

      this.markerInstances.push(marker);
    });

    if (filteredLocations.length === 1 && shouldFly) {
      this.map.flyTo([filteredLocations[0].lat, filteredLocations[0].lng], 15, {
        animate: true,
        duration: 1.5 
      });
      this.searchQuery = '';
    }
  }

  onSearchSubmit() {
    const currentSearch = this.removeAccents(this.searchQuery.trim().toLowerCase());
    if (currentSearch === '') return;
    
    // 🌟 Tìm kiếm trực tiếp trong mảng tổng
    const foundLoc = this.locations.find(loc => this.removeAccents((loc.name || '').toLowerCase()).includes(currentSearch));
    
    if (foundLoc) {
      this.searchQuery = ''; 
      this.selectedCategory = 'All'; 
      this.applyCombinedFilter(false); 
      this.displaySearchMarker(foundLoc);
    } else {
      alert('Không tìm thấy địa điểm du lịch này trong hệ thống!');
    }
  }

  displaySearchMarker(loc: any) {
    if (!this.map || !this.L) return;

    this.clearSearchMarker(); 

    this.searchMarkerInstance = this.L.marker([loc.lat, loc.lng], {
      icon: this.getIconForCategory(loc.category)
    }).addTo(this.map);

    this.searchMarkerInstance.bindTooltip(`
      <div class="my-tooltip-card">
        <img src="${loc.imageUrl}" alt="${loc.name}" class="my-tooltip-img" onerror="this.src='images/ha-long.jpg'" />
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

    this.searchMarkerInstance.on('click', () => {
      this.router.navigate([loc.path]);
    });

    this.map.flyTo([loc.lat, loc.lng], 15, {
      animate: true,
      duration: 1.5
    });
  }

  clearSearchMarker() {
    if (this.searchMarkerInstance && this.map) {
      this.map.removeLayer(this.searchMarkerInstance);
      this.searchMarkerInstance = null;
    }
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.searchQuery = ''; 
    this.clearSearchMarker(); 
    this.applyCombinedFilter(false);
    
    if (this.map) {
      this.map.setView([16.0, 108.0], 5, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25, 
        noMoveStart: true    
      });
    }
  }

  applyCombinedFilter(isSearching: boolean = false) {
    const currentSearch = this.removeAccents(this.searchQuery.trim().toLowerCase());
    
    // 🌟 Nguồn dữ liệu giờ luôn là toàn bộ địa điểm (this.locations)
    const filtered = this.locations.filter(loc => {
      const matchSearch = currentSearch === '' || this.removeAccents((loc.name || '').toLowerCase()).includes(currentSearch);
      const matchCategory = this.selectedCategory === 'All' || loc.category === this.selectedCategory;
      
      return matchSearch && matchCategory;
    });

    this.renderMarkers(filtered, isSearching);
  }

  scrollTabs(container: HTMLElement, amount: number) {
    container.scrollLeft += amount;
  }
}