## Web-Dev-Final-Project
Shani & Michal's final project for the Web Platforms Development course.

#### Project Overview
- **Defergency** is a web-based emergency response system designed to help locate nearby defibrillators and volunteers during cardiac emergencies.
- The system combines a public emergency reporting interface, participant and LoRa device simulators, an administrative dashboard, real-time geographic filtering, and bicycle-based navigation.

#### Workflow
Emergency created --> Backend saves emergency --> System loads current candidates radius --> Nearby eligible fleet members are notified --> Volunteer accepts or declines --> One responder is selected --> Bicycle route is generated --> (Optional) Navigation and movement simulation --> Responder arrival detected --> Emergency is resolved. 

#### System Components
1. **Backend server** - _Port 3001_

Main application server implemented with Express.js.

2. **Authentication server** - _Port 3002_

Express-based server responsible for administrative functionality and NoSQL-backed application configuration.

3. **Frontend** - _Port 3000_
 
Implemented using Next.js and TypeScript.

4. **SQL Database** - _MySQL_

Stores relational system data, including users, fleet, device information and locations.

5. **NoSQL Database** - _MongoDB_

Stores flexible administrative and configuration data, including: Administrator accounts and editable homepage content.

6. **External Services**
- _OpenStreetMap_ used for displaying maps.
- _OpenRouteService_ used for route generation & navigation geometry. 

#### Installation & Startup requirements 
1. Required before running:  Node.js, MySQL server, MongoDB server & [MongoDB CLI Tools](https://www.mongodb.com/try/download/database-tools) and API key for [OpenRouteService](https://openrouteservice.org/) (it's free!).
2. Database recreation: [located /databases]
```
mysql -u root -p -e "CREATE DATABASE defergency_db;"
mysql -u root -p defergency_db < defergency_db_full.sql
mongorestore --db defergency_auth databases/mongodb/defergency_auth
```
3. two .env files were used, the following cites their format for ease of start-up:

within /backend:
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=defergency_db
ORS_API_KEY=
ACCESS_SECRET_TOKEN=
REFRESH_TOKEN_SECRET=
PARTICIPANT_ACCESS_SECRET_TOKEN=
```
within /auth:
```
PORT=3002
MONGO_URI=mongodb://127.0.0.1:27017/defergency_auth
ACCESS_SECRET_TOKEN=
REFRESH_TOKEN_SECRET=
```
4. Running the backend server:
```
cd backend
npm install
npm install lucide-react
npm run dev
```
5. Running authentication & settings server:
```
cd auth
npm install
npm install mongoose
npm run dev
```
6.  Starting the frontend:
```
cd frontend
npm install
npm run dev
```
