# Technical Event Management

Technical Event Management is a college tech-fest portal for participants and organizers. Participants can discover and register for intra-college, inter-college, and zonal events. Organizers can manage events, registrations, judges, and event information.

## Tech stack

- Frontend: React 19, Vite, React Router, Axios
- Backend: Node.js, Express 5, `express-session`, CORS, `body-parser`
- Database: Microsoft SQL Server, accessed with `mssql`
- Authentication: bcrypt password hashing and server-side sessions
- UI and feedback: `react-hot-toast`, themed `react-datepicker`, `lucide-react`
- Tickets: `qrcode.react`
- Frontend tooling: ESLint, Tailwind CSS, PostCSS, Autoprefixer

The application does not use MySQL or `mysql2`.

## Prerequisites

- Node.js and npm. Node.js 20 LTS or newer is recommended.
- SQL Server Express or another SQL Server installation
- SQL Server Management Studio (SSMS)
- SQL Server mixed-mode authentication enabled, because the application uses SQL Server username/password authentication by default

## Database setup

1. Install SQL Server and SSMS.
2. In SQL Server Management Studio, open the server properties, choose **Security**, select **SQL Server and Windows Authentication mode**, save, and restart the SQL Server service.
3. Create the database:

   ```sql
   CREATE DATABASE EventManagement;
   GO
   ```

4. Create a SQL login and database user. Replace the password with a strong local secret:

   ```sql
   USE master;
   GO
   CREATE LOGIN appuser WITH PASSWORD = 'replace-with-a-strong-password';
   GO
   USE EventManagement;
   GO
   CREATE USER appuser FOR LOGIN appuser;
   ALTER ROLE db_owner ADD MEMBER appuser;
   GO
   ```

5. From SSMS, open and execute [`backend/schema.sql`](backend/schema.sql) while connected to `EventManagement`. The script is the current master schema and recreates the tables in dependency order.

The current schema includes:

- `users` for participants
- `organizer`
- `events` with `event_scope`, `capacity`, and `registration_deadline`
- `sponsor`
- `judge`
- `event_organizer` many-to-many junction table
- `event_sponsor` many-to-many junction table
- `registrations` with `college_name`, foreign keys to users/events, and `UNIQUE (user_id, event_id)` to prevent duplicate registrations
- `results`

`event_scope` accepts `intra-college`, `inter-college`, or `zonal`. Event registration counts are derived from `registrations`; they are not stored as a mutable counter.

## Environment configuration

### Backend

Create `Technical-Event-Management/.env` at the project root, next to `backend/` and `frontend/`, using [`backend/.env.example`](backend/.env.example):

```env
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_DATABASE=EventManagement
DB_USER=appuser
DB_PASSWORD=replace-with-a-secure-password
DB_TRUSTED=false
DB_PORT=1433
SESSION_SECRET=replace-with-a-long-random-secret
```

`backend/db.js` resolves this project-root `.env`. Do not commit the real `.env`; it contains credentials and the session secret.

### Frontend

Create `frontend/myapp/.env`:

```env
VITE_API_URL=http://localhost:5000
```

There is currently no committed frontend `.env.example` file; copy the variable above into the local frontend `.env`. Do not commit the local `.env`.

## Install and run

Run commands from the project root:

```bash
cd backend
npm install
npm start
```

Backend scripts:

- `npm start` runs `node server.js`
- `npm run dev` also runs `node server.js` (the current development script does not use nodemon)
- `npm test` is the package placeholder and intentionally exits with an error; no automated backend test suite is currently configured

In a second terminal:

```bash
cd frontend/myapp
npm install
npm run dev
```

Frontend scripts:

- `npm run dev` starts Vite
- `npm run build` creates a production build
- `npm run preview` previews the production build
- `npm run lint` runs ESLint

Open <http://localhost:5173>. The backend listens at <http://localhost:5000>.

If backend source changes while `npm start` is running, stop it with `Ctrl+C` and restart it; plain Node does not hot-reload backend files. Vite normally hot-reloads frontend changes. When multiple checkouts exist, start both servers from the same checkout to avoid serving an older frontend copy, and use `Ctrl+Shift+R` if the browser has cached an old bundle.

## Create the first organizer account

Organizer signup is intentionally not self-service. Create the organizer password hash locally, then insert the organizer through SSMS.

From `backend/`, generate a bcrypt hash without placing a plaintext password in the repository:

```bash
node -e "import bcrypt from 'bcrypt'; const password=process.argv[1]; console.log(await bcrypt.hash(password, 10));" "choose-a-strong-password"
```

Copy the generated 60-character hash into an SSMS insert:

```sql
USE EventManagement;
GO
INSERT INTO organizer (name, email, password, department)
VALUES (
  N'Your Organizer Name',
  N'you@example.edu',
  N'PASTE_BCRYPT_HASH_HERE',
  N'Your Department'
);
GO
```

Use the email and the original password you chose when signing in through the Organizer Portal. Never store the plaintext password or a real hash in documentation or source control.

## Key features

### Participant portal

- Role-gated landing page and participant authentication
- Browse Events search and scope filters for All, Intra-College, Inter-College, and Zonal
- Registered, Sold Out, and Register button states
- Registration with duplicate-registration and capacity handling
- Participant dashboard with registration statistics
- QR ticket/pass download containing the registration ID
- Cancel registration with ownership-scoped backend deletion and confirmation modal
- Empty-state guidance when no registrations exist

### Organizer portal

- Organizer authentication and dashboard analytics
- Event creation, editing, and deletion
- Event Overview and Events tables
- Participant search by name, email, college, or event
- Event search by name or location
- Ten-row pagination with range labels and Previous/Next controls
- CSV export of the currently filtered participant rows
- Judge assignment, editing, and removal
- Confirmation modals for event deletion and judge removal

### Shared UI

- Toast notifications for action success and failure
- Shared confirmation modal
- Shared page layout, page-header band, and footer
- Themed date/time pickers and inline form validation

Seat counts follow one convention: user-facing displays show `registered_count / capacity`; `seats_left` is retained for full-event detection and disabled registration behavior.

## Project structure

```text
Technical-Event-Management/
├── .env                         # local, ignored project-root backend environment
├── README.md
├── PROJECT_REPORT.md
├── backend/
│   ├── .env.example
│   ├── db.js
│   ├── package.json
│   ├── schema.sql
│   ├── server.js
│   ├── seed_organizer.sql
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── organizerAuth.js
│   └── routes/
│       ├── auth.js
│       ├── organizer.js
│       ├── participant.js
│       ├── register.js
│       └── signup.js
└── frontend/
    └── myapp/
        ├── .env                   # local, ignored Vite API URL
        ├── index.html
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── index.css
            ├── main.jsx
            ├── theme.css
            ├── components/
            │   ├── ConfirmModal.jsx
            │   ├── Footer.jsx
            │   ├── LoginForm.css
            │   ├── LoginForm.jsx
            │   ├── Navbar.css
            │   ├── Navbar.jsx
            │   ├── OrganizerNavbar.css
            │   ├── OrganizerNavbar.jsx
            │   ├── PageLayout.jsx
            │   ├── ParticipantNavbar.css
            │   ├── ParticipantNavbar.jsx
            │   ├── Sidebar.css
            │   ├── Sidebar.jsx
            │   ├── ThemedDatePicker.css
            │   ├── ThemedDatePicker.jsx
            │   ├── ToastProvider.jsx
            │   └── shared.css
            ├── context/
            │   └── AuthContext.jsx
            ├── pages/
            │   ├── Contact.css
            │   ├── Contact.jsx
            │   ├── Events.css
            │   ├── Events.jsx
            │   ├── Login.css
            │   ├── Login.jsx
            │   ├── OrganizerAuth.jsx
            │   ├── OrganizerDashboard.css
            │   ├── OrganizerDashboard.jsx
            │   ├── ParticipantAuth.css
            │   ├── ParticipantAuth.jsx
            │   ├── ParticipantDashboard.css
            │   ├── ParticipantDashboard.jsx
            │   ├── Pregister.jsx
            │   ├── Register.css
            │   ├── Register.jsx
            │   └── pregister.css
            └── utils/
                ├── api.js
                ├── toast.js
                └── useToast.js
```

`Pregister.jsx` is the canonical authenticated participant registration page used by Browse Events. `Register.jsx` and `Register.css` are still present as a legacy registration page; they are not the `Pregister.jsx` flow.

## Known limitations

- The backend `dev` script runs plain `node server.js`; it does not watch or restart automatically.
- Automated backend tests are not configured. `npm test` is still the default placeholder.
- Organizer creation is manual through bcrypt plus SSMS; there is no organizer signup UI.
- The local session cookie is configured for HTTP development (`secure: false`); production deployment requires HTTPS and production cookie/security configuration.
- Sponsor and result database tables exist in the schema, but complete sponsor/results management screens and APIs are not exposed as a finished end-user workflow.
- The application currently assumes a SQL Server database is reachable using the configured environment values.
