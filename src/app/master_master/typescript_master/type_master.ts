export interface HealthDataMaster {
  service: string;
}

export interface AuthErrorMaster {
  detail?: string;
  user_message?: string;
}

export interface MasterEnvelope<TData> {
  status_code: number;
  success: boolean;
  message: string;
  data: TData;
  error?: AuthErrorMaster;
  size?: string;
}

export interface HealthEnvelopeMaster {
  status_code: number;
  success: boolean;
  message: string;
  data: HealthDataMaster;
  size?: string;
}

export interface MasterAdminListItem {
  id: number;
  email: string;
  role: string;
  created_at?: string;
}

export interface MasterAdminsListData {
  items: MasterAdminListItem[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CreateAdminRequestMaster {
  email: string;
  password: string;
}

export interface CreateAdminDataMaster {
  id: number;
  email: string;
  role: string;
}

export interface MasterAdminDetailData {
  id: number;
  email: string;
  role: string;
  created_at?: string;
}

export interface HealthStatusMaster {
  module: 'master';
  endpoint: '/master/health';
  isHealthy: boolean;
  httpStatus: number | null;
  message: string;
  payload: HealthEnvelopeMaster | null;
  error: string | null;
}

export type MasterAdminsResponseEnvelope = MasterEnvelope<MasterAdminsListData>;
export type MasterCreateAdminResponseEnvelope = MasterEnvelope<CreateAdminDataMaster>;
export type MasterAdminDetailResponseEnvelope = MasterEnvelope<MasterAdminDetailData>;
