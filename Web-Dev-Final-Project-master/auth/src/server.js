
require('dotenv').config();

const express = require('express');
const connectDB = require('./db');

const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const Admin = require('./models/admin');

const Settings = require('./models/settings');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

connectDB();

app.listen(PORT, () => {
    console.log(`Auth Server running on port ${PORT}`);
});

app.use(cors({origin:'http://localhost:3000'}));


function createAccessToken(admin) {
    return jwt.sign(
        {
            id_admin: admin._id.toString(),
            username: admin.username,
            role: admin.role
        },
        process.env.ACCESS_SECRET_TOKEN,
        {
            expiresIn:'15m'
        }
    )
}

function createRefreshToken(admin) {
    return jwt.sign({
        id_admin: admin._id.toString(),
        username: admin.username,
        role: admin.role
    },
    process.env.REFRESH_TOKEN_SECRET, 
    {
        expiresIn:'7d'
    }
    );
}

const refreshTokens = new Set();

function authAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({
            error:'Access token is required'
        });
    }

    const parts = authHeader.split(' ');

    if(parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error:'Invalid authorization format'
        });
    }

    const token = parts[1];

    try {

        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_TOKEN);
        req.admin = decoded;
        next();

    } // try block

    catch(error) {

        return res.status(401).json({
            error:'Access Token expired or invalid'
        });

    } // catch block
}

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if(!username || !password) {
            return res.status(400).json({
                error:'Username and password are required!'
            });
        }

        // Find the admin in MongoDB
        const admin = await Admin.findOne({
            username
        });

        if(!admin) {
            return res.status(401).json({
                error: 'Invalid admin credentials'
            });
        }

        const validPassword = await bcrypt.compare(password, admin.password_hash);

        if(!validPassword) {
            return res.status(401).json({
                error:'Invalid admin credentials'
            });
        }

        const accessToken = createAccessToken(admin);

        const refreshToken = createRefreshToken(admin);

        res.json({
            accessToken, refreshToken,
            admin: {
                id_admin: admin._id,
                username: admin.username,
                role: admin.role
            }
        });

    }
    catch(error) {
        console.error('Admin login failed:', error);
        res.status(500).json({error:'Admin login failed'});
    }
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if(!refreshTokens.has(refreshToken)) {
        return res.status(403).json({
            error:'Invalid refresh token'
        });
    }

    jwt.verify( refreshToken, process.env.REFRESH_TOKEN_SECRET,
        async(error, decoded) => {
            if(error) {
                refreshTokens.delete(refreshToken);
                return res.status(403).json({
                    error: 'Refresh token expired or invalid'
                });
            }

            try {
                const admin = await Admin.findById(decoded.id_admin);

                if(!admin) {
                    return res.status(403).json({
                        error: 'Admin no longer exists'
                    });
                }

                const accessToken = createAccessToken(admin);

                res.json({accessToken});

            }
            catch(error) {
                console.error('Token refresh failed:', error);
                res.status(500).json({error:'Failed to refresh token'});
            }

        }
    );
});

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;

    if(refreshToken) {
        refreshTokens.delete(refreshToken);
    }

    res.json({message: 'Logged out successfully'});
})

app.get('/api/auth/me', authAdmin, async(req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id_admin)
                            .select('username role createdAt');

        if(!admin) {
            return res.status(404).json({
                error:'Admin not found'
            });
        }

        res.json({admin: 
            {
                id_admin: admin._id,
                username: admin.username,
                role: admin.role,
                created_at: admin.createdAt
            }
        });
    }
    catch(error) {

        console.error('Failed to load admin:', error);
        res.status(500).json({
            error:' Failed to load admin info'
        });
    }
});

const PageContent = require('./models/pageContent');

app.get('/api/content/:page', async (req, res) => {
    try {
        const content = await PageContent.findOne({
            page: req.params.page
        });
        if(!content) {
            return res.status(404).json({
                error: 'Page content not found'
            });
        }

        res.json(content);
    }
    catch(error) {
        console.error('Failed to load page content:', error);
        res.status(500).json({
            error:'Failed to load page content'
        });
    }
});

app.put('/api/admin/content/:page', authAdmin, async (req, res) => {

    try {
        const content = await PageContent.findOneAndUpdate(
            {
                page: req.params.page
            },
            req.body, 
            {
                new: true,
                upsert: true,
                runValidators: true // for ensuring admin only
            }
        );

        res.json({
            message: 'Page content updated successfully', content
        });

    }
    catch (error) {

        console.error('Failed to update content:', error);
        res.status(500).json({
            error: 'Failed to update page content'
        });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({
             candidateRadiusKm: 5,
             arrivalThresholdMeters: 50,
             lowBatteryThreshold: 20 });
        }

        res.json(settings);

    } catch (error) {
        console.error('Failed to load settings:', error);

        res.status(500).json({
            error: 'Failed to load settings'
        });
    }
});


app.put('/api/admin/settings', authAdmin, async (req, res) => {
        try {
         const {
         candidateRadiusKm, arrivalThresholdMeters,
        lowBatteryThreshold } = req.body;

        const settings = await Settings.findOneAndUpdate(
            {},
            {
             candidateRadiusKm,
            arrivalThresholdMeters,
            lowBatteryThreshold
            },
             {
            new: true,
            upsert: true,
            runValidators: true
            });

        res.json({message:
            'Settings updated successfully', settings });

        } catch (error) {
            console.error( 'Failed to update settings:',error);

            res.status(500).json({
                error: 'Failed to update settings'});
        }
    }
);


