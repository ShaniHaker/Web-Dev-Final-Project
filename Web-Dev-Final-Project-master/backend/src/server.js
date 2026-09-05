require('dotenv').config();

const express = require('express')
const cors = require('cors')
const db = require('./db');
const jwt = require('jsonwebtoken');

const { findCandidates, haversineDistance } = require('./services/candidateService');
const { Eraser } = require('lucide-react');

const authAdmin = require('./middleware/authAdmin');
const authParticipant = require('./middleware/authParticipant');

const { getSystemSettings } = require('./services/settingsService');

const app = express();

// enable frontend to access numerous back ports
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'Backend is running'});
});

app.get('/api/fleet', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
            users.id_user,
            users.first_name,
            users.last_name,
            users.phone,
            fleet.id_fleet,
            fleet.has_defi,
            fleet.has_lora,
            fleet.dev_EUI,
            fleet.med_training,
            fleet.lora_battery,
            fleet.is_working_defi
            FROM users
            JOIN fleet
                ON users.id_user = fleet.id_fleet
            `);

        
        res.json(rows);
    } catch(error) {
        console.error(error);
        res.status(500).json({
            error: 'Database query failed'
        });
    }
    });

app.get('/api/fleet/latest-locations', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
            u.id_user,
            u.first_name,
            u.last_name,
            u.phone,
            f.id_fleet,
            f.has_defi,
            f.has_lora,
            f.dev_EUI,
            f.med_training,
            f.lora_battery,
            f.is_working_defi,
            l.latitude, 
            l.longitude,
            l.time_of_transmit
            FROM users u
            JOIN fleet f
                ON u.id_user = f.id_user
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
            `);
        
        res.json(rows);
    }
        catch (error) {
            console.error(error);

            res.status(500).json( {
                error: 'Database query failed'
            });
        }
    
    });

    app.post('/api/fleet/:id/location', async(req, res) => {
        try {
            const fleetId = Number(req.params.id);
            const {
                latitude,
                longitude
            } = req.body;

            if(
                latitude === undefined ||
                longitude === undefined
            ) {
                return res.status(400).json({
                    error:'latitude and longitude are required'
                });
            }

            const [result] = await db.query(`
                INSERT INTO locations (
                id_fleet,
                latitude,
                longitude,
                time_of_transmit
                )
                VALUES(?, ?, ?, NOW())
                `, [fleetId, latitude, longitude]);

            res.status(201).json({
                id_location: result.insertId,
                id_fleet: fleetId,
                latitude,
                longitude
            });
        } // try block

        catch (error) {
            console.error(error);
            res.status(500).json({
                error:'Failed to update fleet location'
            });
        } // catch block
    });

    app.post('/api/emergencies', async (req, res) => {
        try {
            const {latitude, longitude} = req.body;

            if(latitude == null || longitude == null) {
                return res.status(400).json({
                    error:'latitude and longitude required',
                });
            }

            // create emergency 

            const[result] = await db.query(`
                INSERT INTO emergencies
                (latitude, longitude, status)
                VALUES(?, ?, 'OPEN') 
                `, [latitude, longitude]);

            // load dynamic settings

            const settings = await getSystemSettings();

            const radiusKm = Number(settings.candidateRadiusKm);
            const emergencyId = result.insertId;

            // notify + find candidates

            const notificationResult = await notifyCandidates(emergencyId);

            res.status(201).json({
                id_emergency: result.insertId,
                latitude, 
                longitude,
                status:'OPEN',
                notified: notificationResult
            });

        } // try block

        catch (error) {
            console.error(error);

            res.status(500).json({
                error:'Failed to create emergency'
            });

        } // catch block

    });

    app.get('/api/emergencies', async (req, res) => {
        try {

            const[rows] = await db.query(`
                SELECT 
                id_emergency, 
                latitude,
                longitude,
                created_at,
                status
                FROM emergencies
                ORDER BY created_at DESC
                `);

                res.json(rows);
        }

        catch(error) {
            console.error(error);

            res.status(500).json({
                error:'Failed to fetch emergencies'
            });
        }
    });

    app.get('/api/emergencies/:id/candidates', async(req, res) => {

        try {
            const settings = await getSystemSettings();

            const radiusKm = settings.candidateRadiusKm;

            const candidates = await findCandidates(
            req.params.id,
            radiusKm
        );

        res.json(candidates);
        }

        catch (error){
            console.error(error);
            res.status(500).json({
                error:'Failed to fetch relevant candidates'
            });
        }
    });

app.get('/api/emergencies/active', async (req, res) => {

    try {
        const [rows] = await db.query(`
            SELECT
            id_emergency, 
            latitude, 
            longitude,
            created_at, 
            status
            FROM emergencies
            WHERE STATUS IN(
            'OPEN',
            'SEARCHING',
            'RESPONDER_FOUND',
            'EN_ROUTE')
            ORDER BY created_at DESC
            `)

            res.json(rows);
    } // try block

    catch(error) {

        console.error(error);
        res.status(500).json({
            error:'Failed to fetch active emergencies'
        });
    } //catch block
});

app.post('/api/emergencies/:id/notify', async (req, res) => {
    try{
        const emergencyId = Number(req.params.id);
       
        if(!Number.isInteger(emergencyId) || emergencyId <= 0) {
            return res.status(400).json({
                error:'Invalid emergency Id'
            });
        }

        const result = await notifyCandidates(emergencyId);

        return res.json(result);

    } // try block
    catch(error) {

        console.error('Notify failed:', error);
        res.status(500).json({
            error:'Failed to notify candidates'
        });

    } // catch block
});

app.get('/api/fleet/:id/notifications', async (req, res) => {
    try {
        const fleetId = Number(req.params.id);

        const[rows] = await db.query(`
            SELECT 
                ec.id_candidate,
                ec.id_emergency,
                ec.id_fleet,
                ec.distance_km,
                ec.notification_status,
                ec.response_status,
                ec.notified_at,
                e.latitude,
                e.longitude,
                e.created_at,
                e.status AS emergency_status
             FROM emergency_candidates ec
             JOIN emergencies e
                ON ec.id_emergency = e.id_emergency
            WHERE ec.id_fleet = ? 
              AND ec.response_status = 'WAITING'
              AND e.status IN ('OPEN', 'SEARCHING')
              ORDER BY ec.notified_at DESC
            `, [fleetId]);

            res.json(rows);
    }

    catch(error) {
        console.error(error);
        res.status(500).json({
            error:'Failed to load notifications'
        });
    }
}); 

app.post('/api/emergencies/:emergencyId/respond', async (req, res) => {
    const connection = await db.getConnection();
    try {
        // avoid conflicts of two responders to the same emergency
        await connection.beginTransaction();

        const emergencyId = Number(req.params.emergencyId);
        const fleetId = Number(req.body.id_fleet);
        const response = req.body.response;

        if (!['ACCEPTED', 'DECLINED'].includes(response)) {
            await connection.rollback();

            return res.status(400).json({
                error:'Response must be accepted or declined'
            });
        }

        if (response === 'ACCEPTED') {
            const [emergencyResult] = await connection.query(`
                UPDATE emergencies
                SET status = 'RESPONDER_FOUND'
                WHERE id_emergency = ?
                AND STATUS IN ('OPEN', 'SEARCHING')
                `, [emergencyId])

            if (emergencyResult.affectedRows === 0) {
                await connection.rollback();

                return res.status(409).json({
                    error: 'Emergency already has a responder'
                });
            }

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'ACCEPTED',
                    responded_at = NOW()
                    WHERE id_emergency = ?
                    AND id_fleet = ?
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId])

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'CANCELLED'
                    WHERE id_emergency = ?
                    AND id_fleet <> ? 
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId])
        } else {

            await connection.query(`
                UPDATE emergency_candidates
                SET
                    response_status = 'DECLINED',
                    responded_at = NOW()
                    WHERE id_emergency = ? 
                    AND id_fleet = ? 
                    AND response_status = 'WAITING'
                `, [emergencyId, fleetId]);
        }

        await connection.commit();

        res.json({
            id_emergency: emergencyId,
            id_fleet: fleetId,
            response
        });

    } // try block
    catch(error) {
        console.error(error);
        res.status(500).json({
            'error': "Failed to save response"
        });
    }
    finally {
        connection.release();
    }

});


app.get('/api/fleet/:id/active-response', async (req,res) => {
    try{
        const fleetId = Number(req.params.id);

        const [rows] = await db.query(`
            SELECT 
            ec.id_candidate,
            ec.id_emergency,
            ec.id_fleet,
            ec.distance_km,
            ec.responded_at,
            e.latitude,
            e.longitude,
            e.created_at,
            e.status
            FROM emergency_candidates ec
            JOIN emergencies e
                ON e.id_emergency = ec.id_emergency
            WHERE ec.id_fleet = ?
                AND ec.response_status = 'ACCEPTED'
                AND e.status IN ('RESPONDER_FOUND', 'EN_ROUTE')
                ORDER BY ec.responded_at DESC
                LIMIT 1
            `, [fleetId])

        if (rows.length === 0) {
            return res.json(null);
        }

        res.json(rows[0]);
    } // try block
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to load active response'
        });
    } // catch block
});

app.get('/api/fleet/:id/active-response', async(res,req) => {
    try {
        const fleetId = Number(req.params.id);
        const [rows] = await db.query(`
            SELECT 
            ec.id_candidate,
            ec.id_emergency,
            ec.id_fleet,
            ec.distance_km,
            e.latitude,
            e.longitude,
            e.created_at,
            e.status
            FROM emergency_candidates ec
            JOIN emergencies e
                ON e.id_emergency = ec.id_emergency
            WHERE ec.id_fleet = ?
                AND ec.response_status = 'ACCEPTED'
                AND e.status IN ('RESPONDER_FOUND', 'EN_ROUTE')
            ORDER BY ec.responded_at DESC
            LIMIT 1
            `, [fleetId]);

            if(rows.length === 0) {
                return res.json(null);
            }

            res.json(rows[0]);
    } // try block
    catch(error) {
        console.error(error);

        res.status(500).json({
            error:'Failed to load active response'
        });
    }
});

app.get('/api/emergencies/:id/route', async (req,res) => {
    try {
        const emergencyId = Number(req.params.id);
        const fleetId = Number(req.query.fleetId);

        if(!fleetId) {
            return res.status(400).json({
                error: 'fleetId is required'
            });
        }

        const [emergencyRows] = await db.query(`
            SELECT latitude, longitude
            FROM emergencies
            WHERE id_emergency = ?
            `, [emergencyId]);

        if (emergencyRows === 0) {
            return res.status(404).json({
                error: 'Emergency not found'
            });
        
        }

        const [locationRows] = await db.query(`
            SELECT latitude, longitude
            FROM locations
            WHERE id_fleet = ? 
            ORDER BY time_of_transmit DESC, id_location DESC
            `, [fleetId]);

        if(locationRows === 0) {
            return res.status(404).json({
                error:'Fleet location not found'
            });
        }

        const emergency = emergencyRows[0];
        const fleetLocation = locationRows[0];

        // ORS expects longitude first, latitude second

        const body = {
            coordinates: [
                [
                    Number(fleetLocation.longitude),
                    Number(fleetLocation.latitude)
                ],
                [
                    Number(emergency.longitude),
                    Number(emergency.latitude)
                ]
            ]
        };

        const orsResponse = await fetch(
            'http://api.openrouteservice.org/v2/directions/cycling-regular/geojson',
            {
                method: 'POST',
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );

        if(!orsResponse.ok) {
            const errorText = await orsResponse.text();

            console.error('ORS error:', errorText);
            return res.status(502).json({
                error:'Routing service failed'
            });
        }

        const routeData = await orsResponse.json();
        const feature = routeData.features[0];
        const instructions = routeData.features?.[0]
        ?.properties
        ?.segments?.[0]
        ?.steps
        ?.map((step) => ({instruction:step.instruction,
            distanceMeters: Number(step.distance),
            durationSeconds:Number(step.duration),
            wayPoints:step.way_points
        })) ?? [];

        res.json({
            distanceKm:feature.properties.summary.distance / 1000,
            durationMinutes: feature.properties.summary.duration / 60,
            geometry: feature.geometry.coordinates,
            instructions
        });

    } // try block
    catch(error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to calculate route'
        });
    }
});

app.post('/api/emergencies/:id/start-navigation', async (req, res) => {
    
    try {
        const emergencyId = Number(req.params.id);
        const [result] = await db.query(`
            UPDATE emergencies
            SET status = 'EN_ROUTE'
            WHERE id_emergency = ?
            AND status = 'RESPONDER_FOUND'
            `, [emergencyId]);

            if(result.affectedRows === 0) {
                return res.status(409).json({
                    error:'Emergency not ready for navigation'
                });
            }

            res.json({
                id_emergency: emergencyId,
                status: 'EN_ROUTE'
            });

    } // try block
    catch (error) {
        console.error(error);
        res.status(500).json({
            error:'Failed to start navigation'
        });
    } // catch block
});


app.get('/api/fleet/:id/device-info', async (req, res) => {
        try {
            const fleetId = Number(req.params.id);

            if (!fleetId) {
                return res.status(400).json({
                    error: 'Invalid fleet ID'});
            }
            const [rows] = await db.query(
                    `
                    SELECT
                        f.id_fleet,

                        u.first_name,
                        u.last_name,
                        u.phone,

                        f.has_defi,
                        f.has_lora,
                        f.dev_EUI,
                        f.med_training,
                        f.lora_battery,
                        f.is_working_defi,

                        l.latitude,
                        l.longitude,
                        l.time_of_transmit

                    FROM fleet f

                    JOIN users u
                        ON u.id_user = f.id_user

                    LEFT JOIN locations l
                        ON l.id_location = (
                            SELECT l2.id_location
                            FROM locations l2
                            WHERE l2.id_fleet = f.id_fleet
                            ORDER BY
                                l2.time_of_transmit DESC,
                                l2.id_location DESC
                            LIMIT 1
                        )

                    WHERE f.id_fleet = ?
                    `,[fleetId]);


            if (rows.length === 0) {
                return res.status(404).json({
                    error: 'Fleet member not found'});
            }
            res.json(rows[0]);

        } catch (error) {

            console.error('Failed to fetch device info:',error);

            res.status(500).json({
                error: 'Failed to fetch device information' });
        }}
);

app.get('/api/emergencies/:id/arrival-check', async (req, res) => {
    try {
        const emergencyId = Number(req.params.id);
        const fleetId = Number(req.query.fleetId);

        if(!fleetId) {
            return res.status(400).json({
                error:'fleetId is required'
            });
        }

        const [emergencyRows] = await db.query(`
            SELECT latitude, longitude, status
            FROM emergencies 
            WHERE id_emergency = ?`, [emergencyId]);

            if(emergencyRows.length === 0) {
                return res.status(404).json({
                    error:'Emergency not found'
                });
            }

            const [locationRows] = await db.query(`
                SELECT latitude, longitude
                FROM locations
                WHERE id_fleet = ?
                ORDER BY time_of_transmit DESC, id_location DESC
                LIMIT 1
                `, [fleetId]);

            if(locationRows.length === 0) {
                return res.status(404).json({
                    error: 'Responder location not found'
                });
            }

            const emergency = emergencyRows[0];
            const responder = locationRows[0];

            const distanceKm = haversineDistance(
                Number(responder.latitude),
                Number(responder.longitude),
                Number(emergency.latitude),
                Number(emergency.longitude));

            const distanceMeters = distanceKm * 1000;

            const settings = await getSystemSettings();

            arrivalThreshold = settings.arrivalThresholdMeters;

            const arrived = distanceMeters <= arrivalThreshold;

            res.json({
                arrived,
                distanceMeters,
                arrivalThreshold
            });

    } // try block
    catch(error) {
        console.error(error);
        res.status(500).json({
            error:'Failed to check arrival'
        });
    } // catch block
});

app.post('/api/emergencies/:id/resolve', async(req, res) => {
    try {   

        const emergencyId = Number(req.params.id);
        const fleetId = Number(req.body.id_fleet);

        const [emergencyRows] = await db.query(`
            SELECT  latitude, longitude, status
            FROM emergencies
            WHERE id_emergency = ?
            `, [emergencyId]);

        if(emergencyRows.length === 0) {
            return res.status(404).json({
                error:'Emergency not found'
            });
        }

        const [locationRows] = await db.query(`
            SELECT latitude, longitude
            FROM locations
            WHERE id_fleet = ?
            ORDER BY time_of_transmit DESC, id_location DESC
            `, [fleetId]);

        if(locationRows.length === 0) {
            return res.status(404).json({
                error:'Responder location not found'
            });
        }

        const emergency = emergencyRows[0];
        const responder = locationRows[0];

        const distanceMeters = haversineDistance(
            Number(responder.latitude),
            Number(responder.longitude),
            Number(emergency.latitude),
            Number(emergency.longitude)
        ) * 1000;

        const settings = await getSystemSettings();

        const arrival = settings.arrivalThresholdMeters;

        if(distanceMeters > arrival) {
            return res.status(409).json({
                error:'Responder has not arrived yet'
            });
        }

        const [result] = await db.query(`
            UPDATE emergencies 
            SET status = 'RESOLVED'
            WHERE id_emergency = ?
                AND status IN ('EN_ROUTE', 'RESPONDER_FOUND', 'ARRIVED')
            `, [emergencyId]);

        if(result.affectedRows === 0) {
            return res.status(409).json({
                error:'Emergency cannot be resolved'
            });
        }

        res.json({
            id_emergency: emergencyId,
            status: 'RESOLVED'
        });
    } // try block
    catch(error) {
        console.error(error);

        res.status(500).json({
            error:'Failed to resolve emergency'
        });
    }
});

app.post('/api/register', async (req,res) => {
    const connection = await db.getConnection();

    try {
        const {
            first_name,
            last_name,
            phone,
            has_defi,
            has_lora,
            dev_EUI, 
            med_training,
        } = req.body;

        // required fields
        if(!first_name || !phone) {
            return res.status(400).json({
                error:'First name and phone are required!'
            });
        }

        // participant must have a defi or a lora
        if(!has_defi && !has_lora) {
            return res.status(400).json({
                error: 'Participant must have a defibrillator or LoRa device'
            });
        }

        // a LoRa participant must submit it's DEV_EUI
        if(has_lora && !dev_EUI) {
            return res.status(400).json({
                error:'Dev EUI is required for LoRa participant'
            });
        }

        await connection.beginTransaction();

        // 1. create user
        const [userResult] = await connection.query(`
            INSERT INTO users (first_name, last_name, phone)
            VALUES (?, ?, ?)`, [first_name, last_name || '', phone]);

        const userId = userResult.insertId;

        const [fleetResult] = await connection.query(`
            INSERT INTO fleet 
            (id_user,
            has_defi,
            has_lora,
            dev_EUI,
            med_training,
            lora_battery,
            is_working_defi)
            VALUES(?, ?, ?, ?, ?, ?, ?)  
        `, [userId, has_defi ? 1 : 0, has_lora ? 1 : 0, 
                  dev_EUI || null, med_training || null, null,
                  has_defi ? 1 : 0]);

        await connection.commit();

        res.status(201).json({
            message:'Registration completed successfully',
            id_user: userId,
            id_fleet: fleetResult.insertId,
        });

    }
    catch(error) {

        await connection.rollback();
        console.error('Registration failed', error);

        if(error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error:'Phone number or LoRa DEV EUI already in use'
            });
        }

        res.status(500).json({
            error:'Failed to register participant'
        });
    }
    finally {
        connection.release();
    }
});

app.post('/api/participant-login', async (req, res) => {
    try {
        const { first_name, phone } = req.body;

        if (!first_name || !phone) {
            return res.status(400).json({
                error: 'First name and phone are required'
            });
        }

        const [rows] = await db.query(`
            SELECT 
                u.id_user,
                u.first_name,
                u.last_name,
                u.phone,
                f.id_fleet,
                f.has_defi,
                f.has_lora,
                f.dev_EUI
            FROM users u
            JOIN fleet f
                ON f.id_user = u.id_user
            WHERE u.first_name = ?
              AND u.phone = ?
            LIMIT 1
        `, [first_name, phone]);

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'פרטי ההתחברות אינם נכונים'
            });
        }

        const participant = rows[0];

        const accessToken = jwt.sign(
            {
                id_user: participant.id_user,
                id_fleet: participant.id_fleet,
                role: 'participant'
            },
            process.env.PARTICIPANT_ACCESS_SECRET_TOKEN,
            {
                expiresIn: '7d'
            }
        );

        res.json({
            accessToken,
            participant: {
                id_user: participant.id_user,
                id_fleet: participant.id_fleet,
                first_name: participant.first_name,
                last_name: participant.last_name,
                phone: participant.phone,
                has_defi: participant.has_defi,
                has_lora: participant.has_lora
            }
        });

    } catch (error) {
        console.error(
            'Participant login failed',
            error
        );

        res.status(500).json({
            error: 'Failed to identify participant'
        });
    }
});

app.get('/api/participant/me', authParticipant, async (req, res) => {
    try {
        const fleetId = req.participant.id_fleet;

        const [rows] = await db.query(`
            SELECT 
                u.id_user,
                u.first_name,
                u.last_name,
                u.phone,
                
                f.id_fleet,
                f.has_defi,
                f.has_lora,
                f.dev_EUI,
                f.med_training,
                f.lora_battery,
                f.is_working_defi,
                
                l.latitude,
                l.longitude,
                l.time_of_transmit
            FROM fleet f
            JOIN users u
                ON u.id_user = f.id_user
            LEFT JOIN locations l
                ON l.id_location = ( 
                    SELECT l2.id_location
                    FROM locations l2
                    WHERE l2.id_fleet = f.id_fleet
                    ORDER BY l2.time_of_transmit DESC,
                    l2.id_location DESC

                    LIMIT 1
                )
                WHERE  f.id_fleet = ?
                `, [fleetId]);
            
            if(rows.length === 0) {
                return res.status(404).json({
                    error:'Participant not found'
                });
            }


            res.json(rows[0]);


    } // try block
    catch (error) {
        console.error('Failed to load participant:', error);
        res.status(500).json({
            error:'Failed to load participant'
        });
    }
});

app.post('/api/fleet/:id/heartbeat', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const fleetId = Number(req.params.id);
        const { battery, latitude, longitude } = req.body;

        const settings = await getSystemSettings();

        const lowBatteryThreshold = settings.lowBatteryThreshold;

        if(!fleetId) {
            return res.status(400).json({
                error: 'Invalid fleet ID'
            });
        }

        if(battery === undefined || battery === null) {
            return res.status(400).json({
                error: 'Battery level is required'
            });
        }

        if(latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error:'Latitude and longitude are required'
            });
        }

        if(Number(battery) < 0 || Number(battery) > 100) {
            return res.status(400).json({
                error:'Battery level must be between 0 to 100'
            });
        }

        await connection.beginTransaction();

        const [fleetRows] = await connection.query(`
            SELECT 
                id_fleet,
                has_lora
            FROM fleet
            WHERE id_fleet = ?`, [fleetId]);

        if(fleetRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error:'Fleet member not found'
            });
        }

        if(!fleetRows[0].has_lora) {
            await connection.rollback();

            return res.status(404).json({
                error:'This fleet member does not have a LoRa device'
            });
        }

        await connection.query(`
            UPDATE fleet
            SET lora_battery = ?
            WHERE id_fleet = ?
            `, [Number(battery), fleetId]);

        const [locationResult] = await connection.query(`
            INSERT INTO locations
            (id_fleet, 
            latitude,
            longitude,
            time_of_transmit)
            VALUES(?, ?, ?, NOW())`, [fleetId, Number(latitude), Number(longitude)]);

        await connection.commit();

        const needsMaintenance = Number(battery) <= lowBatteryThreshold;

        res.status(200).json({
            message:'LoRa heartbeat received',
            id_fleet: fleetId,
            battery: Number(battery),
            latitude: Number(latitude),
            longitude: Number(longitude),
            id_location: locationResult.insertId,
            needsMaintenance
        });

    }
    catch (error) {

        await connection.rollback();
        console.error('Heartbeat failed:', error);

        res.status(500).json({
            error: 'Failed to process LoRa heartbeat'
        });
    }
    finally {
        connection.release();
    }
});

app.get('/api/admin/stats', authAdmin, async (req, res) => {
    try {
        const [[fleetRows], [defiRows], [loraRows], [emergencyRows]
        ] = await Promise.all([
            db.query(`
                SELECT COUNT(*) AS count
                FROM fleet
            `),

            db.query(`
                SELECT COUNT(*) AS count
                FROM fleet
                WHERE has_defi = 1
                  AND is_working_defi = 1
            `),

            db.query(`
                SELECT COUNT(*) AS count
                FROM fleet
                WHERE has_lora = 1
            `),

            db.query(`
                SELECT COUNT(*) AS count
                FROM emergencies
                WHERE status != 'RESOLVED'
            `)
        ]);

        res.json({
            totalFleet: fleetRows[0].count,
            activeDefibrillators: defiRows[0].count,
            loraDevices: loraRows[0].count,
            activeEmergencies: emergencyRows[0].count
        });

    } catch (error) {
        console.error('Failed to load admin stats:', error);

        res.status(500).json({
            error: 'Failed to load admin statistics'
        });
    }
});

app.get('/api/admin/fleet', authAdmin, async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT 
            u.id_user,
            u.first_name,
            u.last_name,
            u.phone,
            
            f.id_fleet,
            f.has_defi,
            f.has_lora,
            f.lora_battery,
            f.dev_EUI,
            f.med_training,
            f.is_working_defi,
            
            l.latitude,
            l.longitude,
            l.time_of_transmit
            
            FROM fleet f
            JOIN users u
            ON u.id_user = f.id_user
            
            LEFT JOIN(
            SELECT 
            id_fleet,
            latitude,
            longitude,
            time_of_transmit,
            ROW_NUMBER() OVER (
            PARTITION BY id_fleet
                ORDER BY time_of_transmit DESC,
                        id_location DESC
            ) AS rn 
            FROM locations ) l
            ON l.id_fleet = f.id_fleet
            AND l.rn = 1
            ORDER BY u.first_name, u.last_name `);

            res.json(rows);

    } // try block
    catch (error) {

        console.error('Failed to load admin fleet:', error);
        res.status(500).json({
            error:'Failed to load fleet'
        });

    } // catch block
});

app.delete('/api/admin/users/:userId', authAdmin, async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        //console.log('Delete requested for userId:', userId);

        const [result] = await db.query(
            `
            DELETE FROM users
            WHERE id_user = ?
            `,
            [userId]
        );

        //console.log('Delete result:', result);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            message: 'User removed successfully'
        });

    } catch (error) {
        console.error(
            'Failed to remove user:',
            error
        );

        res.status(500).json({
            error: 'Failed to remove user'
        });
    }
});

app.put('/api/admin/fleet/:fleetId', authAdmin, async (req, res) => {
        
    const connection = await db.getConnection();

        try {
            const fleetId = Number(req.params.fleetId);

        const { first_name, last_name, phone,
            med_training, has_defi, has_lora, dev_EUI, lora_battery,
                is_working_defi } = req.body;

            await connection.beginTransaction();

            const [rows] = await connection.query(
                    `
                    SELECT id_user
                    FROM fleet
                    WHERE id_fleet = ?
                    `,
                    [fleetId]);

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    error: 'Fleet member not found'
                });
            }

            const userId = rows[0].id_user;

            await connection.query(
                `
                UPDATE users
                SET
                    first_name = ?,
                    last_name = ?,
                    phone = ?
                WHERE id_user = ?
                `,
                [
                    first_name, last_name || null,
                    phone, userId
                ]
            );

            await connection.query(
                `
                UPDATE fleet
                SET
                    med_training = ?,
                    has_defi = ?,
                    has_lora = ?,
                    dev_EUI = ?,
                    lora_battery = ?,
                    is_working_defi = ?
                WHERE id_fleet = ?
                `,
                [
                    med_training || null,
                    has_defi ? 1 : 0,
                    has_lora ? 1 : 0,
                    has_lora
                        ? dev_EUI || null
                        : null,
                    has_lora
                        ? lora_battery
                        : null,
                    has_defi
                        ? (is_working_defi ? 1 : 0)
                        : 0,
                    fleetId
                ]
            );

            await connection.commit();

            res.json({message: 'Fleet member updated successfully' });

        } catch (error) {
            await connection.rollback();

            console.error('Failed to update fleet member:', error);

            res.status(500).json({
                error: 'Failed to update fleet member'
            });

        } finally {
            connection.release();
        }
    }
);

app.get('/api/stationary-defibrillators', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        location_name,
        location_description,
        latitude,
        longitude,
        city,
        street,
        street_num,
        floor,
        location_hours,
        contact_phone
      FROM stationary_defibrillators
    `);

    res.json(rows);
  } catch (error) {
    console.error('Failed to load stationary defibrillators:', error);

    res.status(500).json({
      error: 'Failed to load stationary defibrillators'
    });
  }
});

// PARTICIPANT SETTINGS ROUTES

app.put('/api/participant/profile', authParticipant, async (req, res) => {
        try { 
            const userId = req.participant.id_user;

            const fleetId = req.participant.id_fleet;

            const {first_name, last_name, phone, med_training} = req.body;

            if (!first_name || !phone) {
                return res.status(400).json({
                    error:'First name and phone are required'});
            }

            const connection = await db.getConnection();

            try {

                await connection.beginTransaction();
                await connection.query(
                    `
                    UPDATE users
                    SET
                        first_name = ?,
                        last_name = ?,
                        phone = ?
                    WHERE id_user = ?
                    `,
                    [first_name, last_name || null, phone, userId]
                );

                await connection.query(
                    `
                    UPDATE fleet
                    SET med_training = ?
                    WHERE id_fleet = ?
                    `,
                    [med_training || null, fleetId]
                );

                await connection.commit();

                res.json({ message: 'Profile updated successfully'});

            } catch (error) {
                await connection.rollback();
                throw error;

            } finally {
                connection.release();
            }

        } catch (error) {

            console.error('Participant profile update failed:',error);

            res.status(500).json({
                error:'Failed to update profile'});
        }
    }
);

app.put('/api/participant/lora', authParticipant, async (req, res) => {

        try {
            const fleetId =req.participant.id_fleet;

            const {has_lora, dev_EUI} = req.body;
            if (has_lora && !dev_EUI) {
                return res.status(400).json({error:
                        'DevEUI is required when LoRa is enabled'
                });
            }
            await db.query(
                `
                UPDATE fleet
                SET
                    has_lora = ?,
                    dev_EUI = ?
                WHERE id_fleet = ?
                `,
                [ has_lora ? 1 : 0,
                    has_lora
                        ? dev_EUI
                        : null,
                    fleetId]
            );
            res.json({message: 'LoRa settings updated'});

        } catch (error) {

            console.error('LoRa update failed:',error);

            res.status(500).json({error:'Failed to update LoRa settings'});
        }
    }
);

app.put('/api/participant/defibrillator', authParticipant, async (req, res) => {

        try {

            const fleetId = req.participant.id_fleet;
            const {has_defi, is_working_defi} = req.body;

            await db.query(
                `
                UPDATE fleet
                SET
                    has_defi = ?,
                    is_working_defi = ?
                WHERE id_fleet = ?
                `,
                [has_defi ? 1 : 0,
                    has_defi ? ( is_working_defi ? 1 : 0): 0,
                    fleetId
                ]
            );

            res.json({message:'Defibrillator settings updated'});

        } catch (error) {

            console.error('Defibrillator update failed:', error);

            res.status(500).json({error:'Failed to update defibrillator'});
        }
    }
);

const PORT = process.env.PORT || 3001;

// init express server
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});


async function notifyCandidates(emergencyId) {
    const settings = await getSystemSettings();

    const radiusKm = Number(settings.candidateRadiusKm);

    const candidates = await findCandidates(emergencyId, radiusKm);

      for(const candidate of candidates) {
            await db.query(`
                INSERT INTO emergency_candidates (
                id_emergency,
                id_fleet,
                distance_km,
                notification_status,
                response_status,
                notified_at
            )
                VALUES(?, ?, ?, 'SENT', 'WAITING', NOW())
            ON DUPLICATE KEY UPDATE
                distance_km = VALUES(distance_km),
                notification_status = 'SENT',
                notified_at = NOW()
                `, [
                    emergencyId,
                    candidate.id_fleet,
                    candidate.distanceKm
                ]);
        }

        return { candidatesFound: candidates.length };
    }
    