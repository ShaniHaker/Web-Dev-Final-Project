

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env')
});

const db = require('./db');


console.log({
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD_LOADED: Boolean(process.env.DB_PASSWORD),
    DB_NAME: process.env.DB_NAME
});

const filePath = path.join(
    __dirname,
    'data',
    'Defis_2-9-2026_mysql_ready.csv'
);

async function importDefibrillators() {
    const rows = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', async () => {
            console.log(
                `Loaded ${rows.length} rows from CSV`
            );

            try {
                for (const row of rows) {
                    await db.query(
                        `
                       INSERT INTO stationary_defibrillators(
                       location_name,
                       location_description,
                       latitude,
                       longitude,
                       city,
                       street,
                       street_num,
                       floor,
                       location_hours,
                       contact_name,
                       contact_phone,
                       updated_at,
                       origin
                       )
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            row.location_name || null,
                            row.location_description || null,
                            Number(row.latitude),
                            Number(row.longitude),
                            row.city || null,
                            row.street || null,
                            row.street_num || null,
                            row.floor || null,
                            row.location_hours || null,
                            row.contact_name || null,
                            row.contact_phone || null,
                            row.updated_at || null,
                            row.origin || null
                        ]
                    );
                }

                console.log(
                    'Stationary defibrillators imported successfully!'
                );

                process.exit(0);

            } catch (error) {
                console.error(
                    'Import failed:',
                    error
                );

                process.exit(1);
            }
        });
}

importDefibrillators();