## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/jadesadaphon/ID-HomeWebAppBackend.git
```
```
cd ID-HomeWebAppBackend
```
### 2. ติดตั้ง Dependencies
```
npm install
```
### 3. สร้างไฟล์ .env
สร้างไฟล์ .env ที่ root ของโปรเจค แล้วใส่ข้อมูลประมาณนี้
```
PORT=5000

DB_USER= database user
DB_PASSWORD= database password
DB_SERVER= server ip address
DB_DATABASE= database name

ACCESS_TOKEN_SECRET= your secret
REFRESH_TOKEN_SECRET= your refresh secret
SESSION_SECRET= your session secret
```
### 4. รันโปรเจค
```
npm run dev
```

### โครงสร้างไฟล์
```
├── app.js                  # Entry point
├── db.js                   # การเชื่อมต่อฐานข้อมูล
├── IDHOMESITE_DB.bak       # ไฟล์ Backup ฐานข้อมูล สำหรับ SqlServer
├── routes/
│   ├── auth.js             # Routes สำหรับ login/register
│   └── protected.js        # Routes ที่ต้องใช้ auth
├── middleware/
│   └── authMiddleware.js   # JWT Auth Middleware
├── .env 
└── package.json

```
