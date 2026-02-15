export interface HealthDataAdmins {
  service: string;
}

export interface HealthEnvelopeAdmins {
  status_code: number;
  success: boolean;
  message: string;
  data: HealthDataAdmins;
  size?: string;
}

export interface HealthStatusAdmins {
  module: 'admins';
  endpoint: '/admins/health';
  isHealthy: boolean;
  httpStatus: number | null;
  message: string;
  payload: HealthEnvelopeAdmins | null;
  error: string | null;
}

export interface AuthErrorAdmins {
  detail?: string;
  user_message?: string;
}

export interface AuthEnvelopeAdmins<TData> {
  status_code: number;
  success: boolean;
  message: string;
  data: TData;
  error?: AuthErrorAdmins;
  size?: string;
}

export interface AdminBuildingItemAdmins {
  id: number;
  admin_id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_towers: number;
  picture_url?: string | null;
  picture_public_id?: string | null;
  picture_folder?: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateBuildingRequestAdmins {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_towers?: number;
}

export interface UpdateBuildingRequestAdmins {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_towers?: number;
}

export interface DeleteBuildingDataAdmins {
  id: number;
  name: string;
}

export interface CreateTowerRequestAdmins {
  name: string;
  floors: number;
  total_flats?: number;
}

export interface UpdateTowerRequestAdmins {
  name?: string;
  floors?: number;
  total_flats?: number;
}

export interface AdminTowerItemAdmins {
  id: number;
  building_id: number;
  building_name?: string | null;
  name: string;
  floors: number;
  total_flats: number;
  picture_url?: string | null;
  picture_public_id?: string | null;
  picture_folder?: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface DeleteTowerDataAdmins {
  id: number;
}

export interface CreateFlatRequestAdmins {
  flat_number: string;
  floor_number: number;
  bhk_type: string;
  area_sqft: number;
  rent_amount: number;
  security_deposit: number;
  is_available?: boolean;
}

export interface UpdateFlatRequestAdmins {
  flat_number?: string;
  floor_number?: number;
  bhk_type?: string;
  area_sqft?: number;
  rent_amount?: number;
  security_deposit?: number;
  is_available?: boolean;
}

export interface AdminFlatItemAdmins {
  id: number;
  tower_id: number;
  flat_number: string;
  floor_number: number;
  bhk_type: string;
  area_sqft: number;
  rent_amount: string;
  security_deposit: string;
  is_available: boolean;
  picture_url?: string | null;
  picture_public_id?: string | null;
  picture_folder?: string | null;
  amenity_ids?: number[];
  created_at: string;
  [key: string]: unknown;
}

export interface CreateAmenityRequestAdmins {
  name: string;
  description?: string;
}

export interface UpdateAmenityRequestAdmins {
  name?: string;
  description?: string;
}

export interface SetFlatAmenitiesRequestAdmins {
  amenity_ids: number[];
}

export interface SetFlatAmenitiesDataAdmins {
  flat_id: number;
  amenity_ids: number[];
}

export interface AdminAmenityItemAdmins {
  id: number;
  building_id: number;
  name: string;
  description?: string | null;
  picture_url?: string | null;
  picture_public_id?: string | null;
  picture_folder?: string | null;
  created_at: string;
  [key: string]: unknown;
}

export type AdminBookingStatusAdmins = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface AdminBookingContextBuildingAdmins {
  id: number;
  name: string;
}

export interface AdminBookingContextTowerAdmins {
  id: number;
  name: string;
}

export interface AdminBookingContextFlatAdmins {
  id: number;
  flat_number: string;
}

export interface AdminBookingItemAdmins {
  id: number;
  user_id: number;
  flat_id: number;
  tower_id: number;
  building_id: number;
  status: AdminBookingStatusAdmins;
  security_deposit?: string | null;
  paid: boolean;
  building: AdminBookingContextBuildingAdmins;
  tower: AdminBookingContextTowerAdmins;
  flat: AdminBookingContextFlatAdmins;
  created_at: string;
  [key: string]: unknown;
}

export interface UpdateBookingStatusRequestAdmins {
  status: AdminBookingStatusAdmins;
}

export interface UpdateBookingStatusDataAdmins {
  id: number;
  status: AdminBookingStatusAdmins;
}

export type AdminBuildingsListResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBuildingItemAdmins[]>;
export type AdminBuildingDetailResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBuildingItemAdmins>;
export type AdminCreateBuildingResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBuildingItemAdmins>;
export type AdminUpdateBuildingResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBuildingItemAdmins>;
export type AdminDeleteBuildingResponseEnvelopeAdmins = AuthEnvelopeAdmins<DeleteBuildingDataAdmins>;
export type AdminCreateTowerResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminTowerItemAdmins>;
export type AdminBuildingTowersResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminTowerItemAdmins[]>;
export type AdminTowerDetailResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminTowerItemAdmins>;
export type AdminUpdateTowerResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminTowerItemAdmins>;
export type AdminDeleteTowerResponseEnvelopeAdmins = AuthEnvelopeAdmins<DeleteTowerDataAdmins>;
export type AdminCreateFlatResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminFlatItemAdmins>;
export type AdminTowerFlatsResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminFlatItemAdmins[]>;
export type AdminFlatDetailResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminFlatItemAdmins>;
export type AdminUpdateFlatResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminFlatItemAdmins>;
export type AdminDeleteFlatResponseEnvelopeAdmins = AuthEnvelopeAdmins<{ id: number }>;
export type AdminCreateAmenityResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminAmenityItemAdmins>;
export type AdminUpdateAmenityResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminAmenityItemAdmins>;
export type AdminBuildingAmenitiesResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminAmenityItemAdmins[]>;
export type AdminSetFlatAmenitiesResponseEnvelopeAdmins = AuthEnvelopeAdmins<SetFlatAmenitiesDataAdmins>;
export type AdminDeleteAmenityResponseEnvelopeAdmins = AuthEnvelopeAdmins<{ id: number; name: string }>;
export type AdminBookingsListResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBookingItemAdmins[]>;
export type AdminBookingDetailResponseEnvelopeAdmins = AuthEnvelopeAdmins<AdminBookingItemAdmins>;
export type AdminUpdateBookingStatusResponseEnvelopeAdmins = AuthEnvelopeAdmins<UpdateBookingStatusDataAdmins>;


