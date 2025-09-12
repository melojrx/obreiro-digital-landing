export interface Member {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  membership_status: 'active' | 'inactive' | 'transferred' | 'deceased';
  membership_date?: string;
  ministerial_function?: 'member' | 'leader' | 'pastor' | 'elder' | 'deacon' | 'deaconess';
  photo?: string;
  church_id: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface MemberFilters {
  search?: string;
  church_id?: number;
  membership_status?: string;
  ministerial_function?: string;
  gender?: string;
  marital_status?: string;
}

export interface CreateMemberData {
  full_name: string;
  email: string;
  phone?: string;
  birth_date: string;
  gender?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  membership_status: 'active' | 'inactive' | 'transferred' | 'deceased';
  membership_date?: string;
  ministerial_function?: 'member' | 'leader' | 'pastor' | 'elder' | 'deacon' | 'deaconess';
  church_id: number;
}