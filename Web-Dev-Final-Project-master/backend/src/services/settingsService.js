
const DEFAULT_SETTINGS = {
    candidateRadiusKm: 5,
    arrivalThresholdMeters: 50,
    lowBatteryThreshold: 20
}

async function getSystemSettings() {
    try {
        const response = await fetch(`
            http://localhost:3002/api/settings`);

        if(!response.ok) {
            throw new Error(`Settings server returned ${response.status}`);
        }

        const data = await response.json();

        return {
            candidateRadiusKm: Number(data.candidateRadiusKm) ||
            DEFAULT_SETTINGS.candidateRadiusKm,
            arrivalThresholdMeters: Number(data.arrivalThresholdMeters) 
            || DEFAULT_SETTINGS.arrivalThresholdMeters,
            lowBatteryThreshold: Number(data.lowBatteryThreshold) ||
            DEFAULT_SETTINGS.lowBatteryThreshold
        };

    }
    catch (error) {
        console.error('Failed to load settings, using defaults:', error);

        return DEFAULT_SETTINGS;

    }
}

module.exports = {getSystemSettings}; 