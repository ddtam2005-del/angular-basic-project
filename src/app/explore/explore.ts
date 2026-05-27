import { Component } from '@angular/core';
import { Router } from '@angular/router'; // 1. Đảm bảo đã import Router

@Component({
  selector: 'app-explore',
  imports: [],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore {
  constructor(private router: Router) {}
  goToDetail1() {
    this.router.navigate(['/vinh-ha-long']);
  }
}
