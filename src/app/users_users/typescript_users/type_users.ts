export interface HealthDataUsers {
  service: string;
}

export interface HealthEnvelopeUsers {
  status_code: number;
  success: boolean;
  message: string;
  data: HealthDataUsers;
  size?: string;
}

export interface HealthStatusUsers {
  module: 'users';
  endpoint: '/users/health';
  isHealthy: boolean;
  httpStatus: number | null;
  message: string;
  payload: HealthEnvelopeUsers | null;
  error: string | null;
}

export interface AuthErrorUsers {
  detail?: string;
  user_message?: string;
}

export interface AuthEnvelopeUsers<TData> {
  status_code: number;
  success: boolean;
  message: string;
  data: TData;
  error?: AuthErrorUsers;
  size?: string;
}

export interface RegisterRequestUsers {
  email: string;
  password: string;
  is_admin?: boolean;
  is_master?: boolean;
}

export interface RegisterResponseDataUsers {
  id: number;
  email: string;
  role: string;
  token: string;
}

export interface LoginRequestUsers {
  email: string;
  password: string;
}

export interface LoginResponseDataUsers {
  email: string;
  role: string;
  token: string;
}

export interface UpdateMeRequestUsers {
  email?: string;
  password?: string;
}

export interface DeleteMeResponseDataUsers {
  email?: string;
  [key: string]: unknown;
}

export interface UserRolesUsers {
  admin?: boolean;
  master?: boolean;
  is_admin?: boolean;
  is_master?: boolean;
}

export interface UserMeResponseDataUsers {
  email: string;
  role: string;
  is_admin?: boolean;
  is_master?: boolean;
  roles?: UserRolesUsers;
  created_at?: string;
  [key: string]: unknown;
}

export interface UserProfileResponseDataUsers {
  username?: string | null;
  primary_email?: string;
  mobile_number?: string | null;
  profile_pic_url?: string | null;
  profile_pic_public_id?: string | null;
  profile_pic_folder?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BuildingAmenityUsers {
  name: string;
  description?: string | null;
  picture_url?: string | null;
  [key: string]: unknown;
}

export interface UsersBuildingAmenitiesDataUsers {
  building?: { name: string; [key: string]: unknown };
  amenities: BuildingAmenityUsers[];
  [key: string]: unknown;
}

export interface UsersBuildingAmenityDetailDataUsers {
  building: { name: string; [key: string]: unknown };
  amenity: BuildingAmenityUsers;
  [key: string]: unknown;
}

export interface UserBuildingListItemUsers {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  full_address?: string;
  total_towers?: number;
  picture_url?: string | null;
  towers_count?: number;
  flats_count?: number;
  available_flats_count?: number;
  amenities?: BuildingAmenityUsers[];
  [key: string]: unknown;
}

export interface UserTowerListItemUsers {
  id: number;
  name: string;
  floors: number;
  total_flats?: number;
  picture_url?: string | null;
  flats_count?: number;
  available_flats_count?: number;
  [key: string]: unknown;
}

export interface UserBuildingSummaryUsers {
  id: number;
  name: string;
  picture_url?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  full_address?: string;
  [key: string]: unknown;
}

export interface UserTowerDetailDataUsers {
  tower: UserTowerListItemUsers;
  building: UserBuildingSummaryUsers;
}

export interface UserFlatListItemUsers {
  id: number;
  flat_number: string;
  floor_number: number;
  bhk_type: string;
  area_sqft: number;
  rent_amount: string;
  security_deposit: string;
  is_available: boolean;
  picture_url?: string | null;
  [key: string]: unknown;
}

export interface UsersTowerFlatsDataUsers {
  building: UserBuildingSummaryUsers;
  tower: { id: number; name: string };
  items: UserFlatListItemUsers[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  [key: string]: unknown;
}

export interface UsersFlatDetailDataUsers {
  flat: UserFlatListItemUsers;
  tower: { id: number; name: string };
  building: UserBuildingSummaryUsers;
  pictures?: UserFlatPictureItemUsers[];
  amenities: BuildingAmenityUsers[];
  [key: string]: unknown;
}

export interface UserFlatPictureItemUsers {
  id: number;
  flat_id: number;
  room_name: string;
  picture_url: string;
  created_at: string;
  [key: string]: unknown;
}

export interface UsersFlatSearchItemUsers {
  flat: UserFlatListItemUsers;
  tower: { id: number; name: string; [key: string]: unknown };
  building: UserBuildingSummaryUsers;
  [key: string]: unknown;
}

export interface UsersFlatSearchDataUsers {
  items: UsersFlatSearchItemUsers[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  [key: string]: unknown;
}

export interface UsersBuildingSearchDataUsers {
  items: UserBuildingListItemUsers[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  [key: string]: unknown;
}

export interface UserBookingResponseDataUsers {
  id: number;
  flat_id: number;
  tower_id: number;
  building_id: number;
  status: string;
  security_deposit?: string;
  paid?: boolean;
  building_full_address?: string;
  user_name?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface UsersBookingListItemUsers extends UserBookingResponseDataUsers {
  building?: { name: string; [key: string]: unknown };
  tower?: { name: string; [key: string]: unknown };
  flat?: { flat_number: string; [key: string]: unknown };
  manager?: { name?: string | null; phone?: string | null; [key: string]: unknown };
}

export type RegisterResponseEnvelopeUsers = AuthEnvelopeUsers<RegisterResponseDataUsers>;
export type LoginResponseEnvelopeUsers = AuthEnvelopeUsers<LoginResponseDataUsers>;
export type LogoutResponseEnvelopeUsers = AuthEnvelopeUsers<null>;
export type UserMeResponseEnvelopeUsers = AuthEnvelopeUsers<UserMeResponseDataUsers>;
export type UserProfileResponseEnvelopeUsers = AuthEnvelopeUsers<UserProfileResponseDataUsers>;
export type DeleteMeResponseEnvelopeUsers = AuthEnvelopeUsers<DeleteMeResponseDataUsers | null>;
export type UsersBuildingsResponseEnvelopeUsers = AuthEnvelopeUsers<UserBuildingListItemUsers[]>;
export type UsersBuildingTowersResponseEnvelopeUsers = AuthEnvelopeUsers<UserTowerListItemUsers[]>;
export type UsersTowerDetailResponseEnvelopeUsers = AuthEnvelopeUsers<UserTowerDetailDataUsers>;
export type UsersTowerFlatsResponseEnvelopeUsers = AuthEnvelopeUsers<UsersTowerFlatsDataUsers>;
export type UsersFlatDetailResponseEnvelopeUsers = AuthEnvelopeUsers<UsersFlatDetailDataUsers>;
export type UsersFlatPicturesResponseEnvelopeUsers = AuthEnvelopeUsers<UserFlatPictureItemUsers[]>;
export type UsersFlatSearchResponseEnvelopeUsers = AuthEnvelopeUsers<UsersFlatSearchDataUsers>;
export type UsersBuildingSearchResponseEnvelopeUsers = AuthEnvelopeUsers<UsersBuildingSearchDataUsers>;
export type UsersCreateBookingResponseEnvelopeUsers = AuthEnvelopeUsers<UserBookingResponseDataUsers>;
export type UsersBookingsResponseEnvelopeUsers = AuthEnvelopeUsers<UsersBookingListItemUsers[]>;
export type UsersBookingDetailResponseEnvelopeUsers = AuthEnvelopeUsers<UsersBookingListItemUsers>;
export type UsersBuildingAmenitiesResponseEnvelopeUsers = AuthEnvelopeUsers<UsersBuildingAmenitiesDataUsers>;
export type UsersBuildingAmenityDetailResponseEnvelopeUsers = AuthEnvelopeUsers<UsersBuildingAmenityDetailDataUsers>;


