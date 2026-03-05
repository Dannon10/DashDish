import { Database } from './database.types';
import { Profile } from './auth.types';

export type DriverLocation = Database['public']['Tables']['driver_locations']['Row'];

export interface DriverWithLocation extends Profile {
    driver_locations: DriverLocation;
}