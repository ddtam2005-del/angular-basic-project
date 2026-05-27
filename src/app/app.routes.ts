import { Routes } from '@angular/router';
import { Home } from './home/home'; // Nhớ kiểm tra tên class là Home hay HomeComponent nhé
import { Explore } from './explore/explore';
import { Detail1 } from './detail1/detail1';
import { mapleafletcomponent } from './map-leaflet/map-leaflet.component';

export const routes: Routes = [
  { path: '', component: Home },           // Trang chủ (đường dẫn trống)
  { path: 'kham-pha', component: Explore }, // Trang khám phá
  { path: 'vinh-ha-long', component: Detail1 },
  { path: 'map', component: mapleafletcomponent }

];