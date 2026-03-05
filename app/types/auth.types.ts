import { Database, UserRole } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser {
    id: string;
    email: string;
    profile: Profile;
}

export { UserRole };