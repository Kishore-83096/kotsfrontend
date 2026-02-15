import { Routes } from '@angular/router';
import { PageAdminsComponent } from './admins_admins/pages_admins/page_admins';
import { PageAdminsBuildingDetailComponent } from './admins_admins/pages_admins_building_detail/page_admins_building_detail';
import { PageAdminsTowerDetailComponent } from './admins_admins/pages_admins_tower_detail/page_admins_tower_detail';
import { PageAllHealthCheckComponent } from './all_health_check/pages_all_health_check/page_all_health_check';
import { PageMasterComponent } from './master_master/pages_master/page_master';
import { PageUsersLandingComponent } from './users_users/pages_users_landing/page_users_landing';
import { PageUsersLoginComponent } from './users_users/pages_users_login/page_users_login';
import { PageUsersRegisterComponent } from './users_users/pages_users_register/page_users_register';
import { PageUsersWelcomeComponent } from './users_users/pages_users_welcome/page_users_welcome';
import { PageUsersComponent } from './users_users/pages_users/page_users';
import { PageUsersBuildingTowersComponent } from './users_users/pages_users_building_towers/page_users_building_towers';
import { PageUsersTowerDetailComponent } from './users_users/pages_users_tower_detail/page_users_tower_detail';
import { PageUsersFlatDetailComponent } from './users_users/pages_users_flat_detail/page_users_flat_detail';
import { PageUsersBookingsComponent } from './users_users/pages_users_bookings/page_users_bookings';
import { PageUsersFlatSearchComponent } from './users_users/pages_users_flat_search/page_users_flat_search';
import {
  adminsBuildingDetailPrefetchResolver,
  adminsHomePrefetchResolver,
  adminsTowerDetailPrefetchResolver,
  masterHomePrefetchResolver,
  usersBookingsPrefetchResolver,
  usersBuildingTowersPrefetchResolver,
  usersFlatDetailPrefetchResolver,
  usersHomePrefetchResolver,
  usersSearchPrefetchResolver,
  usersTowerDetailPrefetchResolver,
} from './route_prefetch_resolvers';

export const routes: Routes = [
  { path: '', component: PageUsersLandingComponent },
  { path: 'home', component: PageUsersWelcomeComponent, resolve: { prefetch: usersHomePrefetchResolver } },
  { path: 'users/bookings', component: PageUsersBookingsComponent, resolve: { prefetch: usersBookingsPrefetchResolver } },
  { path: 'users/flats/search', component: PageUsersFlatSearchComponent, resolve: { prefetch: usersSearchPrefetchResolver } },
  { path: 'users/buildings/:buildingId/towers', component: PageUsersBuildingTowersComponent, resolve: { prefetch: usersBuildingTowersPrefetchResolver } },
  { path: 'users/buildings/:buildingId/towers/:towerId', component: PageUsersTowerDetailComponent, resolve: { prefetch: usersTowerDetailPrefetchResolver } },
  { path: 'users/buildings/:buildingId/towers/:towerId/flats/:flatId', component: PageUsersFlatDetailComponent, resolve: { prefetch: usersFlatDetailPrefetchResolver } },
  { path: 'users/login', component: PageUsersLoginComponent },
  { path: 'users/register', component: PageUsersRegisterComponent },
  { path: 'all-health-check', component: PageAllHealthCheckComponent },
  { path: 'users', component: PageUsersComponent },
  { path: 'admins', component: PageAdminsComponent, resolve: { prefetch: adminsHomePrefetchResolver } },
  { path: 'admins/buildings/:buildingId', component: PageAdminsBuildingDetailComponent, resolve: { prefetch: adminsBuildingDetailPrefetchResolver } },
  { path: 'admins/buildings/:buildingId/towers/:towerId', component: PageAdminsTowerDetailComponent, resolve: { prefetch: adminsTowerDetailPrefetchResolver } },
  { path: 'master', component: PageMasterComponent, resolve: { prefetch: masterHomePrefetchResolver } },
  { path: '**', redirectTo: '' },
];


