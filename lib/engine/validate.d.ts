export type AccountType = 'client' | 'freelancer' | 'both';
export const ACCOUNT_TYPES: AccountType[];

export function normalizeEmail(v: unknown): string;
export function validateEmail(v: unknown): string;
export function validateName(v: unknown): string;
export function validatePassword(v: unknown, ctx?: { email?: string; name?: string }): string;
export function passwordStrength(v: unknown): 0 | 1 | 2 | 3 | 4;

export interface RegisterInput { name?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown; accountType?: unknown; acceptedTerms?: unknown }
export interface RegisterResult { errors: Record<string, string>; values: { name: string; email: string; accountType: AccountType; password: string } }
export function validateRegister(input: RegisterInput): RegisterResult;

export interface LoginInput { email?: unknown; password?: unknown; role?: unknown }
export interface LoginResult { errors: Record<string, string>; values: { email: string; password: string; role: 'client' | 'freelancer' } }
export function validateLogin(input: LoginInput): LoginResult;
