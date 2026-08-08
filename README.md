# Technical Event Management System

## Project Overview

The Technical Event Management System is a full-stack web application developed to simplify the organization and management of technical events such as Hackathons, Coding Competitions, AI/ML Challenges, Robotics Competitions, UI/UX Contests, and Gaming Events. The system provides separate interfaces for Participants and Organizers, enabling efficient event management, registration, and tracking.

The application follows a decoupled architecture with a React frontend, Node.js and Express.js backend, and a MySQL relational database. It offers secure authentication, role-based access control, event management, and participant registration through an intuitive and responsive user interface.

---

## Key Features

### Participant Features

- Secure user registration and login with session-based authentication.
- Browse technical events categorized into Development, Coding, AI & Machine Learning, Robotics, UI/UX, and Gaming.
- Register for technical events through a simple registration process.
- Personalized dashboard to view registered events, registration details, registration ID, and registration history.
- Automatic association of registered users with selected events using session management.

### Organizer Features

- Secure organizer login with role-based access.
- Interactive dashboard displaying event analytics and registration statistics.
- Complete Event Management (CRUD) including creating, viewing, updating, and deleting technical events.
- View event statistics such as Total Events, Total Participants, Upcoming Events, and Completed Events.
- Monitor participant registrations with complete participant information including name, email, contact number, and registered event.

### System Features

- Full-stack architecture using React, Node.js, Express.js, and MySQL.
- Role-based authentication and authorization using Express Session and secure HTTP cookies.
- RESTful API communication between frontend and backend.
- Responsive and modular user interface for improved user experience.
- Organized dashboard layouts for Participants and Organizers.
- MySQL relational database for efficient storage and management of users, organizers, events, and registrations.
- Modular project structure for easy maintenance and scalability.

## Technology Stack

### Frontend (Client-Side)

- **Library:** React 19
- **Build Tool:** Vite 7
- **Routing:** React Router DOM v7
- **Styling:** HTML5, CSS3, Tailwind CSS v4
- **Icons:** Lucide React
- **HTTP Client:** Axios and Fetch API

### Backend (Server-Side)

- **Runtime Environment:** Node.js
- **Framework:** Express.js v5
- **Session Management:** Express Session
- **Cross-Origin Resource Sharing:** CORS Middleware
- **Architecture:** RESTful APIs

### Database

- **Database Management System:** MySQL
- **Database Driver:** mysql2
- **Database Name:** `myprojectdb`

---

## Installation and Setup

### Prerequisites

Before running the project, ensure the following software is installed on your system:

- Node.js
- npm
- MySQL Server
- MySQL Workbench (Recommended)
- Git

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Arpithacs/Technical-Event-Management.git
cd Technical-Event-Management
```

---

### Step 2: Database Setup

Start the MySQL Server and create the project database.

```sql
CREATE DATABASE myprojectdb;
USE myprojectdb;
```

Create the required database tables.

#### Users Table

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL
);
```

#### Organizer Table

```sql
CREATE TABLE organizer (
    organizer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL
);
```

#### Events Table

```sql
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    organizer_id INT,
    FOREIGN KEY (organizer_id)
        REFERENCES organizer(organizer_id)
        ON DELETE CASCADE
);
```

#### Registrations Table

```sql
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

Insert the default organizer account.

```sql
INSERT INTO organizer (name, email, password, department)
VALUES (
    'CSE Admin',
    'admin@techfest.com',
    'admin123',
    'Computer Science'
);
```

---

### Step 3: Configure the Database Connection

Open the following file:

```text
backend/db.js
```

Update the MySQL credentials according to your local database configuration.

```javascript
const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "myprojectdb",
});
```

---

### Step 4: Install and Run the Backend Server

Run these commands from the `Technical-Event-Management` project root (the same checkout that contains both `backend` and `frontend`).

Navigate to the backend directory.

```bash
cd backend
```

Install the required dependencies.

```bash
npm install
```

Create `Technical-Event-Management/.env` at the project root with the database settings and a long random `SESSION_SECRET`. Do not commit this file; use `backend/.env.example` as a template.

Start the Express server.

```bash
npm start
```

For development, run:

```bash
npm run dev
```

The backend server will start at:

```text
http://localhost:5000
```

Keep this terminal running while using the frontend. If the backend source changes while
the server is running with `npm start`, stop it with `Ctrl+C` and start it again; plain
Node does not hot-reload backend files.

---

### Step 5: Install and Run the Frontend

Open a new terminal and navigate to the frontend directory.

```bash
cd frontend/myapp
```

Create `Technical-Event-Management/frontend/myapp/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

Install the required dependencies.

```bash
npm install
```

Start the React development server.

```bash
npm run dev
```

The frontend application will be available at:

```text
http://localhost:5173
```

When working with multiple checkouts, start Vite from the `frontend/myapp` directory
inside the same `Technical-Event-Management` checkout as the backend. Otherwise, port
5173 may serve an older copy of the application. Vite hot-reloads source changes, but
use a hard refresh (`Ctrl+Shift+R`) if the browser shows stale content.

### Seat Count Convention

Event APIs return both seat values:

- `registered_count`: the number of registrations, shown to users as
  `registered_count / capacity` (for example, `5 / 20 seats`).
- `seats_left`: remaining capacity, used internally to determine when an event is full
  and registration must be disabled.

The participant Browse Events page loads events from
`GET /api/organizer/events`. After a successful registration, `registered_count`
increases by one and `seats_left` decreases by one.

---

## Project Structure

```text
DBMS_PROJECT/
├── backend/
│   ├── db.js                     # MySQL connection configuration
│   ├── server.js                 # Express server initialization and API routing
│   ├── package.json              # Backend dependencies and scripts
│   ├── package-lock.json         # Dependency lock file
│   ├── middleware/
│   │   ├── authMiddleware.js     # Participant authentication middleware
│   │   └── organizerAuth.js      # Organizer authentication middleware
│   └── routes/
│       ├── auth.js               # Participant login APIs
│       ├── signup.js             # User registration APIs
│       ├── register.js           # Event registration APIs
│       ├── organizer.js          # Organizer dashboard, analytics, and event management APIs
│       └── participant.js        # Participant dashboard and registered events APIs
│
├── frontend/
│   └── myapp/
│       ├── index.html            # Entry HTML file
│       ├── vite.config.js        # Vite configuration
│       ├── package.json          # Frontend dependencies and scripts
│       ├── package-lock.json     # Dependency lock file
│       ├── public/
│       │   └── images/           # Application images and assets
│       └── src/
│           ├── main.jsx          # React application entry point
│           ├── App.jsx           # Application routing and signup page
│           ├── index.css         # Global styles
│           ├── components/
│           │   ├── LoginForm.jsx
│           │   ├── LoginForm.css
│           │   ├── Navbar.jsx
│           │   ├── Navbar.css
│           │   ├── ParticipantNavbar.jsx
│           │   ├── ParticipantNavbar.css
│           │   ├── OrganizerNavbar.jsx
│           │   ├── OrganizerNavbar.css
│           │   ├── Sidebar.jsx
│           │   └── Sidebar.css
│           └── pages/
│               ├── Login.jsx
│               ├── Login.css
│               ├── Events.jsx
│               ├── Events.css
│               ├── Register.jsx
│               ├── Register.css
│               ├── Pregister.jsx
│               ├── pregister.css
│               ├── ParticipantDashboard.jsx
│               ├── ParticipantDashboard.css
│               ├── OrganizerDashboard.jsx
│               ├── OrganizerDashboard.css
│               ├── Contact.jsx
│               └── Contact.css
│
├── PROJECT_REPORT.md             # Project documentation
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

## Usage

Once the frontend and backend servers are running, access the application by opening the following URL in your browser:

```text
http://localhost:5173
```

---

### Participant Workflow

#### 1. Create an Account

- Open the application in your browser.
- On the **Sign Up** page, enter:
  - Full Name
  - Email Address
  - Password
  - Phone Number
- Click **Sign Up** to create a participant account.

#### 2. Login

- Navigate to the **Login** page.
- Select **Login as Participant**.
- Enter your registered email address and password.
- Click **Login** to access your account.

#### 3. Browse Events

- Open the **Events** page.
- Browse the available technical events across different categories.
- Select any event to view its details.

#### 4. Register for an Event

- Click **Register Now** for the desired event.
- Complete the registration form.
- If you are logged in, the registration will automatically be associated with your participant account.

#### 5. Participant Dashboard

Navigate to the Participant Dashboard to:

- View all registered events.
- View registration details.
- View registration IDs.
- Track your event registration history.

---

### Organizer Workflow

#### 1. Login

Navigate to the **Login** page and select **Login as Organizer**.

Use the default organizer credentials:

| Field | Value |
|--------|-------|
| Email | admin@techfest.com |
| Password | admin123 |

#### 2. Organizer Dashboard

After successful authentication, the Organizer Dashboard provides access to the following modules.

##### Dashboard

- View total events.
- View total registered participants.
- View upcoming events.
- View completed events.
- Monitor overall event statistics.

##### Event Management

Organizers can perform complete CRUD operations.

- Create new events.
- View all events.
- Update existing event details.
- Delete events.

Each event includes:

- Event Name
- Description
- Date
- Time
- Venue

##### Participant Management

View registrations submitted by participants, including:

- Registration ID
- Participant Name
- Email Address
- Contact Number
- Registered Event
- Registration Date and Time

---

## Application Flow

1. Create a participant account.
2. Login as a Participant or Organizer.
3. Browse available technical events.
4. Register for preferred events.
5. Participants can monitor their registrations through the Participant Dashboard.
6. Organizers can manage events and registrations through the Organizer Dashboard.
