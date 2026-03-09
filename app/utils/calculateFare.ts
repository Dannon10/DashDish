import config from '../constants/config';

const calculateFare = (distanceInKm: number): number => {
    const fare = distanceInKm * config.farePerKm;
    return Math.max(fare, config.minimumFare);
};

export default calculateFare;