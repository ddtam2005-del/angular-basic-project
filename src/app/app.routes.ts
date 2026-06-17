import { Routes } from '@angular/router';
import { Home } from './home/home'; // Nhớ kiểm tra tên class là Home hay HomeComponent nhé
import { Explore } from './explore/explore';
import { Detail1 } from './detail1/detail1';
// import {  LoginComponent } from './admin/login/login';
// import {  DashboardComponent } from './admin/dashboard/dashboard';
// import { PlacesComponent } from './admin/places/places';
// import { CommentsComponent } from './admin/comments/comments';
import { mapleafletcomponent } from './map-leaflet/map-leaflet.component';

export const routes: Routes = [
  { path: '', component: Home },           // Trang chủ (đường dẫn trống)
  { path: 'kham-pha', component: Explore }, // Trang khám phá
  { path: 'detail/:id', component: Detail1 },
  { path: 'map', component: mapleafletcomponent },
  // { path: 'login', component: LoginComponent },
  // { path: 'admin/dashboard', component: DashboardComponent },
  // { path: 'admin/places', component: PlacesComponent },
  // { path: 'admin/comments', component: CommentsComponent },

];