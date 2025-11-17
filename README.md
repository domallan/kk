# Kris Kringle Randomiser

A web application for managing Secret Santa (Kris Kringle) assignments with support for couples who shouldn't be assigned to each other.

## Features

- **User Management**: Add, edit, and delete users
- **Couple Support**: Mark users as partners so they won't be assigned to each other
- **Yearly Assignments**: Generate and view assignments for specific years
- **Smart Algorithm**: Automatically ensures valid assignments respecting couple constraints

## Setup

### Prerequisites

- Node.js (v12 or higher)
- Docker and Docker Compose (for containerized database) OR PostgreSQL database

### Installation with Docker (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start the PostgreSQL database container:
```bash
docker-compose up -d
```

3. Create database connection file:
   Copy the example file and use the default Docker credentials:
   ```bash
   cp dbconn.json.example dbconn.json
   ```
   
   The default `dbconn.json` will work with the Docker setup:
   ```json
   {
     "host": "localhost",
     "port": 5432,
     "user": "kk_user",
     "password": "kk_password",
     "database": "kk_db"
   }
   ```

4. Wait for the database to be ready (about 10-15 seconds), then start the server:
```bash
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

**To stop the database container:**
```bash
docker-compose down
```

**To stop and remove all data:**
```bash
docker-compose down -v
```

### Installation without Docker (Manual PostgreSQL Setup)

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
   - Create a PostgreSQL database
   - Run the schema file to create tables:
   ```bash
   psql -U your_username -d kk_db -f schema.sql
   ```

3. Create database connection file:
   Create a file `dbconn.json` in the root directory with your PostgreSQL credentials:
   ```json
   {
     "host": "localhost",
     "port": 5432,
     "user": "your_username",
     "password": "your_password",
     "database": "kk_db"
   }
   ```

4. Start the server:
```bash
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Add Users**: Enter a name and optionally select a partner from the dropdown
2. **Edit Users**: Click the "Edit" button on any user to modify their name or partner
3. **Generate Assignments**: Enter a year and click "Generate Assignments" to create Secret Santa pairings
4. **View Assignments**: Click "Load Assignments" to see the assignments for the specified year

## API Endpoints

### Users
- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /users/:user_id` - Get a specific user
- `PUT /users/:user_id` - Update a user
- `DELETE /users/:user_id` - Delete a user

### Assignments
- `POST /assignments/generate` - Generate assignments for a year
- `GET /assignments/:year` - Get all assignments for a year
- `GET /assignments/:year/user/:user_id` - Get assignment for a specific user
- `DELETE /assignments/:year` - Delete all assignments for a year

## Database Schema

- **users**: Stores user information including name and partner relationships
- **assignments**: Stores yearly Secret Santa assignments (giver → receiver)

## Docker Configuration

The `docker-compose.yml` file sets up a PostgreSQL 15 container with:
- Database: `kk_db`
- User: `kk_user`
- Password: `kk_password`
- Port: `5432` (mapped to host)

The database schema is automatically initialized when the container first starts. Data is persisted in a Docker volume named `postgres_data`.

## Twilio SMS Integration

The application can send SMS messages to users with their Kris Kringle assignments via Twilio.

### Setup

1. Get your Twilio credentials:
   - Sign up at https://www.twilio.com/
   - Get your Account SID and Auth Token from the Twilio Console
   - Get a Twilio phone number (or use a trial number)

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Add your Twilio credentials to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. Add phone numbers to users:
   - When creating or editing users, enter their phone number in E.164 format (e.g., +1234567890)
   - Phone numbers are optional but required to send SMS

5. Send SMS:
   - Generate assignments for a year
   - Click "📱 Send SMS to All" button to send messages to all users with phone numbers

### Phone Number Format

Phone numbers should be in E.164 format:
- Include country code (e.g., +1 for US, +44 for UK)
- Example: `+1234567890` (US), `+447911123456` (UK)

## Database Migration

If you have an existing database, you may need to run migrations.

### Using npm script (Recommended)

**Add phone number column:**
```bash
npm run migrate:phone
```

**Add SMS tracking:**
```bash
npm run migrate:sms
```

Or run a custom migration file:
```bash
npm run migrate path/to/your/migration.sql
```

### Using psql directly

```bash
psql -U your_username -d kk_db -f migration_add_phone.sql
psql -U your_username -d kk_db -f migration_add_sms_tracking.sql
```

### Manual SQL

**Phone number:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) NULL;
```

**SMS tracking:**
```sql
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP NULL;
```

## Notes

- Partners are bidirectional - if User A is partnered with User B, User B is automatically partnered with User A
- The assignment algorithm ensures no one gets themselves or their partner
- Assignments are stored per year, so you can generate new assignments each Christmas
- The database connection file (`dbconn.json`) is gitignored for security - use `dbconn.json.example` as a template
- The `.env` file is gitignored for security - use `.env.example` as a template
