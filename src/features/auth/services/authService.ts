import { apiClient } from '../../../services/apiClient';
import type {
  AdminCreateUserRequest,
  AuthResult,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  IdentityOperationResult,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  RoleSummaryDto,
  UpdateProfileRequest,
  UserProfileDto,
} from '../types/auth.types';

export const authService = {
  async login(request: LoginRequest): Promise<AuthResult> {
    const response = await apiClient.post<AuthResult>('/auth/login', request);
    return response.data;
  },

  async register(request: RegisterRequest): Promise<AuthResult> {
    const response = await apiClient.post<AuthResult>('/auth/register', request);
    return response.data;
  },

  async getCurrentUser(): Promise<AuthResult> {
    const response = await apiClient.get<AuthResult>('/auth/me');
    return response.data;
  },

  async getProfile(): Promise<UserProfileDto> {
    const response = await apiClient.get<UserProfileDto>('/auth/profile');
    return response.data;
  },

  async updateProfile(request: UpdateProfileRequest): Promise<IdentityOperationResult> {
    const response = await apiClient.put<IdentityOperationResult>('/auth/profile', request);
    return response.data;
  },

  async changePassword(request: ChangePasswordRequest): Promise<IdentityOperationResult> {
    const response = await apiClient.post<IdentityOperationResult>('/auth/change-password', request);
    return response.data;
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<IdentityOperationResult> {
    const response = await apiClient.post<IdentityOperationResult>('/auth/forgot-password', request);
    return response.data;
  },

  async resetPassword(request: ResetPasswordRequest): Promise<IdentityOperationResult> {
    const response = await apiClient.post<IdentityOperationResult>('/auth/reset-password', request);
    return response.data;
  },

  // Admin Users & Roles Management
  async getAllUsers(): Promise<UserProfileDto[]> {
    const response = await apiClient.get<UserProfileDto[]>('/users');
    return response.data;
  },

  async getAllRoles(): Promise<RoleSummaryDto[]> {
    const response = await apiClient.get<RoleSummaryDto[]>('/users/roles');
    return response.data;
  },

  async createUser(request: AdminCreateUserRequest): Promise<IdentityOperationResult> {
    const response = await apiClient.post<IdentityOperationResult>('/users', request);
    return response.data;
  },

  async updateUserRole(userId: string, role: string): Promise<IdentityOperationResult> {
    const response = await apiClient.put<IdentityOperationResult>(`/users/${userId}/role`, { role });
    return response.data;
  },

  async setUserLockout(userId: string, lockAccount: boolean): Promise<IdentityOperationResult> {
    const response = await apiClient.put<IdentityOperationResult>(`/users/${userId}/lockout`, { lockAccount });
    return response.data;
  },

  async adminResetPassword(userId: string, newPassword: string): Promise<IdentityOperationResult> {
    const response = await apiClient.post<IdentityOperationResult>(`/users/${userId}/reset-password`, { newPassword });
    return response.data;
  },

  async deleteUser(userId: string): Promise<IdentityOperationResult> {
    const response = await apiClient.delete<IdentityOperationResult>(`/users/${userId}`);
    return response.data;
  },
};
