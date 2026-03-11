const config = {
    appName: 'DashDish',
    appVersion: '1.0.0',

    // Lagos Demo Center coordinates
    defaultLat: 6.5244,
    defaultLng: 3.3792,
    defaultZoom: 12,

    // Delivery fare calculation
    farePerKm: 150,       
    minimumFare: 300,      

    // Simulation
    driverAcceptDelay: 4000,     
    locationUpdateInterval: 1500,

    // Paystack
    paystackCurrency: 'NGN',

    // Order status auto-progression delays
    confirmedDelay: 3000,  
    preparingDelay: 8000,  
    pickedUpDelay: 15000,   

} as const;

export default config;