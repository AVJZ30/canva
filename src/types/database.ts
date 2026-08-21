export type UserRole = 'admin' | 'reseller';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type CreditTxType = 'credit_added' | 'credit_used' | 'credit_refunded' | 'manual_adjustment';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  credits: number;
  is_active: boolean;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvaRequest {
  id: string;
  reseller_id: string;
  email: string;
  status: RequestStatus;
  duration_months: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface CreditTransaction {
  id: string;
  reseller_id: string;
  amount: number;
  type: CreditTxType;
  description: string | null;
  related_request_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  description: string;
  created_at: string;
}
