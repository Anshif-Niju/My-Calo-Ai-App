// src/types/index.ts

export type UserRole = 'user' | 'doctor' | 'subadmin' | 'admin';

export interface AuthUserPayload {
  userId: string;
  role: UserRole;
  email: string;
}
