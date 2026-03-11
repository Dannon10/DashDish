const mapbox = {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
    darkStyleUrl: 'mapbox://styles/mapbox/dark-v11',
    defaultCamera: {
        centerCoordinate: [3.3792, 6.5244],
        zoomLevel: 12,
        animationDuration: 1000,
    },
} as const;

export default mapbox;