import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; // Để dùng ngModel

// 🌟 BỘ TỪ ĐIỂN QUY ĐỔI VÙNG MIỀN -> TỈNH THÀNH
export const REGION_MAPPING: { [key: string]: string[] } = {
  'mien-bac': [
    'Hà Nội', 'Quảng Ninh', 'Ninh Bình', 'Lào Cai', 'Hải Phòng', 'Hà Giang', 
    'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang', 'Lạng Sơn', 'Yên Bái', 'Thái Nguyên', 
    'Phú Thọ', 'Bắc Giang', 'Bắc Ninh', 'Hòa Bình', 'Sơn La', 'Điện Biên', 'Lai Châu'
  ],
  'mien-trung': [
    'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế',
    'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 
    'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
  ],
  'mien-nam': [
    'Hồ Chí Minh', 'TP.HCM', 'Bình Phước', 'Bình Dương', 'Đồng Nai', 'Tây Ninh', 
    'Bà Rịa - Vũng Tàu', 'Long An', 'Đồng Tháp', 'Tiền Giang', 'An Giang', 'Bến Tre', 
    'Vĩnh Long', 'Trà Vinh', 'Hậu Giang', 'Kiên Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau', 'Cần Thơ'
  ]
};

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore implements OnInit {
  allLocations: any[] = [];
  filteredLocations = signal<any[]>([]);
  categories = signal<any[]>([]);
  // Các biến hứng giá trị bộ lọc
  searchKeyword: string = '';
  searchRegion: string = 'tat-ca';
  searchCategory: string = 'tat-ca';
  selectedCategory: string = 'tat-ca';

  
  constructor(private router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    // 1. Đọc tham số từ URL do trang chủ gửi sang
    this.route.queryParams.subscribe(async params => {
    // Luôn gán giá trị, nếu URL không có thì lấy giá trị mặc định (sau dấu ||)
    this.searchKeyword = params['keyword'] || '';
    this.searchRegion = params['region'] || 'tat-ca';
    
    
    this.selectedCategory = params['category'] || 'tat-ca';

    // 2. Kéo dữ liệu từ Backend
    await this.loadAllLocations();
    this.loadCategories();
    
    // 3. Tiến hành lọc tự động
    this.applyFilters();
    });
  }

  async loadCategories() {
      try {
        const response = await fetch('http://localhost:8000/api/categories');
        if (response.ok) {
          const data = await response.json();
          this.categories.set(data);
        }
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    }


  async loadAllLocations() {
    try {
      const response = await fetch('http://localhost:8000/api/locations');
      if (response.ok) {
        const rawData = await response.json();
        
        //  Chạy ngầm API chi tiết để rút số sao chuẩn xác
        const formattedData = await Promise.all(rawData.map(async (p: any) => {
          let provName = 'Chưa xác định';
          if (p.province) provName = typeof p.province === 'object' ? (p.province.name || 'Chưa xác định') : p.province;
          
          let catName = 'Khác';
          if (p.category) catName = typeof p.category === 'object' ? (p.category.name || 'Khác') : p.category;

          let avg = '0.0';
          let imgUrl = 'images/ha-long.jpg'; // Mặc định nếu không có ảnh

          try {
             const detailId = p.locationId || p.location_id || p.id;
             const detailRes = await fetch(`http://localhost:8000/api/locations/${detailId}`);
             if (detailRes.ok) {
                const detailData = await detailRes.json();
                
                // 📸 LẤY ẢNH ĐẦU TIÊN
                if (detailData.images && detailData.images.length > 0) {
                    const firstImg = detailData.images[0];
                    imgUrl = typeof firstImg === 'string' ? firstImg : firstImg.imageUrl;
                    // Nếu link ảnh không có http thì ghép thêm đường dẫn localhost
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
          } catch(e) { } 

          return {
            id: p.locationId || p.location_id || p.id, 
            name: p.name || 'Chưa có tên',
            province: provName, 
            category: catName,  
            status: p.status || 'active',
            description: p.description || '',
            views: p.views || p.viewCount || p.view_count || 0,
            averageRating: avg, 
            imageUrl: imgUrl // 🌟 Gắn link ảnh vào dữ liệu
          };
        }));

        // LỌC BỎ CÁC ĐỊA ĐIỂM BẢO TRÌ/ẨN TRƯỚC KHI HIỂN THỊ
        this.allLocations = formattedData.filter((loc: any) => 
            loc.status === 'active' || loc.status === 'approved'
        );
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu Explore:", error);
    }
  }

  removeAccents(str: string): string {
    if (!str) return '';
    // Lệnh này giúp chuyển đổi các ký tự có dấu thành không dấu và đổi chữ Đ/đ
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  //  HÀM XỬ LÝ LỌC KẾT QUẢ CHÍNH
 applyFilters() {
    let temp = [...this.allLocations];

    // Lọc theo TỪ KHÓA 
    if (this.searchKeyword && this.searchKeyword.trim() !== '') {
      // Ép từ khóa tìm kiếm về chữ thường và không dấu
      const kw = this.removeAccents(this.searchKeyword.toLowerCase().trim());
      
      temp = temp.filter(loc => {
        // Ép dữ liệu name và province từ Database về chữ thường và không dấu để so sánh
        const locName = this.removeAccents((loc.name || '').toLowerCase());
        const locProv = this.removeAccents((loc.province || '').toLowerCase());
        
        return locName.includes(kw) || locProv.includes(kw);
      });
    }

    // Lọc theo VÙNG MIỀN 
    if (this.searchRegion !== 'tat-ca') {
      const allowedProvinces = REGION_MAPPING[this.searchRegion] || [];
      temp = temp.filter(loc => allowedProvinces.includes(loc.province));
    }

    // Lọc theo DANH MỤC 
    if (this.selectedCategory !== 'tat-ca') {
      temp = temp.filter(loc => loc.category === this.selectedCategory);
    }

    this.filteredLocations.set(temp);
  }

  // Lấy màu sắc cho badge thẻ bài
  getBadgeColor(category: string): string {
    switch (category?.toLowerCase()) {
      case 'sinh thái': return '#32CD32';
      case 'di tích lịch sử': return '#FFD700';
      case 'biển đảo': return '#1E90FF';
      case 'khu vui chơi': return '#FF4500';
      default: return '#555555';
    }
  }

  goToDetail(id: string) {
    this.router.navigate(['/detail', id]);
  }
}