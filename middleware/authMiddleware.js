const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        next();
    });
}

function authorizeAdmin(req, res, next) {
    const { userrank, usergroup } = req.user;

    /** userGroup
     * 63495084-6A31-4FD2-AC7C-57DC70CBE789 = ดีไอวาย
     * 818D7B50-8AC6-4911-A4ED-AFC74636BEAA = โชว์รูม
     * FD31A4F3-41E7-4B9B-9403-9081F9982474 = คลังสินค้า
     * EC5C053E-D8E6-423B-ACEC-46954F15DDD2 = ผู้ดูแลระบบ
     * general = ทั่วไป
     * 
     * 
     * * userRank
     * 2E39BA91-7A81-441A-99B5-CB185E98459D = พนักงาน
     * 713CEA1C-1D3C-4156-93A1-0666792395C4 = ผู้ดูแลระบบ
     * 92264421-CF97-47B8-9F01-E3D080BA4A9F = รองผู้จัดการ
     * A89FE6A7-981F-480E-8EA8-F73900098618 = ผู้จัดการ
     * general = ทั่วไป
     */
    if (userrank !== '713CEA1C-1D3C-4156-93A1-0666792395C4' && userrank !== 'EC5C053E-D8E6-423B-ACEC-46954F15DDD2') {
        return res.status(403).json({ message: 'Access forbidden: Admins only' });
    }

    next();
}

module.exports = { authenticateToken, authorizeAdmin };
