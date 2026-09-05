
const db = require('../db');

async function findCandidates(emergencyId, radiusKm) {
    try {
            const [[emergency]] = await db.query(`
                SELECT latitude, longitude
                FROM emergencies
                WHERE id_emergency = ?`, [emergencyId]);

            if(emergency.length === 0) {
                throw new Error('Emergency not found!');
            }

            const [fleet] = await db.query(`
                SELECT 
                f.id_fleet,
                u.first_name,
                u.last_name,
                f.has_defi,
                f.has_lora,
                f.is_working_defi,
                l.latitude,
                l.longitude,
                l.time_of_transmit
                FROM fleet f
                JOIN users u
                    ON f.id_user = u.id_user
                LEFT JOIN (
                    SELECT
                        id_fleet,
                        latitude,
                        longitude,
                        time_of_transmit,
                        id_location,
                        ROW_NUMBER() OVER (
                            PARTITION BY id_fleet
                            ORDER BY time_of_transmit DESC, id_location DESC
                        ) AS rn
                    FROM locations
                ) l
                    ON f.id_fleet = l.id_fleet
                        AND l.rn = 1
                    WHERE has_defi = 1
                    AND is_working_defi = 1
                `)

                const candidates = fleet
                    .filter(item => 
                        item.latitude !== null &&
                        item.longitude !== null
                    )
                    .map(item => ({
                        ...item,
                        distanceKm: haversineDistance(
                            emergency.latitude,
                            emergency.longitude,
                            item.latitude,
                            item.longitude
                        )
                    }))
                    .filter(item => item.distanceKm <= radiusKm)
                    .sort((a,b) => 
                    a.distanceKm - b.distanceKm);
                return candidates;
        } // try block

        catch(error) {
            console.error(error);
        } // catch block
    return candidates;
}

// calculate distance in a sphere (radius ~3km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in KM

    // conversion to Radians 
    const toRad = (value) => value * Math.PI / 180;

    //deltas 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2- lon1);

    // haversine = sin(alpha/2) ** 2
    const a =
        Math.sin(dLat/2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

module.exports = { findCandidates, haversineDistance };