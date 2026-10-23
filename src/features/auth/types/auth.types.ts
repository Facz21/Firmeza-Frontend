export interface AuthResult {
  succeeded: boolean;
  token: string;
  expiration?: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  errors: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  token: string;
}

export type UserRole = 'Administrator' | 'Auditor' | 'StandardUser';

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnabled: boolean;
  isLockedOut: boolean;
  lockoutEnd?: string | null;
  accessFailedCount: number;
  createdAt: string;
  roles: string[];
}

export interface RoleSummaryDto {
  id: string;
  name: string;
  userCount: number;
}

export interface IdentityOperationResult {
  succeeded: boolean;
  message?: string | null;
  resetToken?: string | null;
  errors: string[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
  role: string;
}
