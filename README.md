Sweety – Blood Glucose Tracker
A full-stack assignment implementation using React, Node.js, Express and PostgreSQL.
Features
Registration and login with bcrypt password hashing and JWT authentication.
User-isolated glucose readings: create, list, edit and delete.
Four daily slots: `morning\\\_fasting`, `after\\\_breakfast`, `after\\\_lunch`, `after\\\_dinner`.
Validation: whole-number glucose values from 40 to 600 mg/dl, no future dates, one reading per slot per day, maximum four readings per day.
Daily, month-to-date and previous-calendar-month reports.
Seed script, API tests, and a simple responsive dashboard.
Requirements
Node.js 20+ (tested design target: Node 24)
PostgreSQL 14+
npm
1. Database setup
Create a PostgreSQL database named `sweety\\\_db`:
```sql
CREATE DATABASE sweety\\\_db;
```
The server runs `src/config/schema.sql` automatically at startup, creating the tables and constraints if they do not exist.
2. Configure the server
```bash
cd server
copy .env.example .env
```
On macOS/Linux use `cp .env.example .env`.
Edit `.env` and set your PostgreSQL password and a long random JWT secret.
Example:
```env
PORT=5000
CLIENT\\\_ORIGIN=http://localhost:5173
DATABASE\\\_URL=
DB\\\_HOST=localhost
DB\\\_PORT=5432
DB\\\_NAME=sweety\\\_db
DB\\\_USER=postgres
DB\\\_PASSWORD=your\\\_postgres\\\_password
JWT\\\_SECRET=replace\\\_with\\\_a\\\_long\\\_random\\\_secret\\\_at\\\_least\\\_32\\\_chars
JWT\\\_EXPIRES\\\_IN=1d
```
If `DATABASE\\\_URL` is set, it takes precedence over the individual `DB\\\_\\\*` values.
Install and start:
```bash
npm install
npm run dev
```
API health check: http://localhost:5000/api/health
3. Seed demo data
In another terminal:
```bash
cd server
npm run seed
```
Demo credentials:
Email: `demo@sweety.local`
Password: `SweetyDemo123!`
The seed script creates the demo account if absent and inserts sample readings only when it has no existing readings.
4. Start the React client
In another terminal:
```bash
cd client
copy .env.example .env
npm install
npm run dev
```
Open http://localhost:5173.
5. Tests
```bash
cd server
npm test
```
The included tests cover validation and date-range helpers without requiring a running database. For full endpoint verification, start PostgreSQL and the API, then use the app or an API client.
API overview
All protected routes require `Authorization: Bearer <token>`.
Method	Route	Purpose
POST	`/api/auth/register`	Create account
POST	`/api/auth/login`	Login
GET	`/api/auth/me`	Current account
GET	`/api/readings?date=YYYY-MM-DD`	List own readings
POST	`/api/readings`	Create reading
PUT	`/api/readings/:id`	Update own reading
DELETE	`/api/readings/:id`	Delete own reading
GET	`/api/reports/daily?date=YYYY-MM-DD`	Daily summary + entries
GET	`/api/reports/month-to-date?date=YYYY-MM-DD`	First of selected month through selected date
GET	`/api/reports/monthly?date=YYYY-MM-DD`	Whole previous calendar month
Reading payload
```json
{
  "readingDate": "2026-11-27",
  "timeSlot": "morning\\\_fasting",
  "glucoseValue": 105
}
```
The database unique constraint on `(user\\\_id, reading\\\_date, time\\\_slot)` is the final protection against duplicate slots. Server validation also enforces the daily maximum and user ownership.
Notes / assumptions
A date is interpreted as a calendar date in the patient's local context and stored as PostgreSQL `DATE`; no timezone conversion is applied to reading dates.
The four slot identifiers are stable API values; the frontend displays friendly labels.
Month-to-date ends on the selected date. The previous-month report always covers the entire previous calendar month, regardless of the selected day.
The app does not provide medical diagnosis or treatment advice; it only records and summarizes values.
Authentication tokens are stored in browser local storage for this small assignment demo. A production deployment should prefer secure, HTTP-only cookies, HTTPS, rate limiting, refresh-token strategy and stronger operational controls.
With more time: add pagination, React component tests, charting, Docker Compose, password reset, audit logging and deployment.
