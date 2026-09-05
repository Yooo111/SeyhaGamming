export interface User {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  isDuplicate?: boolean;
  user?: User;
  error?: string;
}

export interface UsersResponse {
  success: boolean;
  users?: User[];
  message?: string;
  error?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    username: string;
  };
  error?: string;
}
