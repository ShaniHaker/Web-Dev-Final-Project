const jwt = require('jsonwebtoken');

function authParticipant(req, res, next) {

    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Participant authentication required'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.PARTICIPANT_ACCESS_SECRET_TOKEN);

        if(payload.role !== 'participant') {
            return res.status(403).json({
                error:'Invalid participant token'
            });
        }

        req.participant = payload; 
        next();
    }

    catch(error) {
        console.error('failed to authenticate participant:', error);

        return res.status(401).json({error: 'Invalid or expired participant token'});
    }

}

module.exports = authParticipant; 