import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../types';

// ─── Payload Interfaces ────────────────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Internal decoded type (jwt adds iat, exp automatically)
export interface DecodedAccessToken extends AccessTokenPayload, JwtPayload {}
export interface DecodedRefreshToken extends RefreshTokenPayload, JwtPayload {}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const JWT_ISSUER = 'calo-ai';
const JWT_AUDIENCE = 'calo-ai-client';


//  Token Generation

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in environment');

  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) throw new Error('REFRESH_SECRET is not defined in environment');

  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  return jwt.sign(payload, secret, options);
};

//  Token Verification

export const verifyAccessToken = (token: string): DecodedAccessToken => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in environment');


  return jwt.verify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as DecodedAccessToken;
};

export const verifyRefreshToken = (token: string): DecodedRefreshToken => {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) throw new Error('REFRESH_SECRET is not defined in environment');

  return jwt.verify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as DecodedRefreshToken;
};


export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

export const generateTempToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ userId, type: 'pre_2fa' }, secret, { expiresIn: '5m' });
};

export const verifyTempToken = (token: string): { userId: string; type: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.verify(token, secret) as { userId: string; type: string };
};
