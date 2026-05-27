import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 1. Thêm công cụ chuyển trang

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // 2. Bỏ vào danh sách cấp phép
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header { }