/* ============================================================
   MASTER SCHEMA — Event Management System
   Fixes all ERD contradictions:
     - Event ↔ Organizer: M:N via event_organizer junction
     - Event ↔ Sponsor:   M:N via event_sponsor junction
     - Removed redundant "Organise for", "Has", duplicate result links
     - Removed direct event_id from participants (users)
     - Registration is single source of truth for participant↔event
   Dependency order: drop reverse, create forward
   ============================================================ */

USE EventManagement;
GO

/* ---- DROP existing tables (reverse dependency order) ---- */
IF OBJECT_ID('dbo.results',         'U') IS NOT NULL DROP TABLE dbo.results;
IF OBJECT_ID('dbo.registrations',   'U') IS NOT NULL DROP TABLE dbo.registrations;
IF OBJECT_ID('dbo.event_sponsor',   'U') IS NOT NULL DROP TABLE dbo.event_sponsor;
IF OBJECT_ID('dbo.event_organizer', 'U') IS NOT NULL DROP TABLE dbo.event_organizer;
IF OBJECT_ID('dbo.judge',           'U') IS NOT NULL DROP TABLE dbo.judge;
IF OBJECT_ID('dbo.sponsor',         'U') IS NOT NULL DROP TABLE dbo.sponsor;
IF OBJECT_ID('dbo.events',          'U') IS NOT NULL DROP TABLE dbo.events;
IF OBJECT_ID('dbo.organizer',       'U') IS NOT NULL DROP TABLE dbo.organizer;
IF OBJECT_ID('dbo.users',           'U') IS NOT NULL DROP TABLE dbo.users;
GO

/* ============================================================
   1. USERS (participants)
   ============================================================ */
CREATE TABLE users (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    fullname      NVARCHAR(100)  NOT NULL,
    email         NVARCHAR(100)  NOT NULL UNIQUE,
    password      NVARCHAR(255)  NOT NULL,
    phone         NVARCHAR(20),
    college_name  NVARCHAR(150),
    created_at    DATETIME       DEFAULT GETDATE()
);
GO

/* ============================================================
   2. ORGANIZER
   ============================================================ */
CREATE TABLE organizer (
    organizer_id  INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100)  NOT NULL,
    email         NVARCHAR(100)  NOT NULL UNIQUE,
    password      NVARCHAR(255)  NOT NULL,
    department    NVARCHAR(100),
    created_at    DATETIME       DEFAULT GETDATE()
);
GO

/* ============================================================
   3. EVENTS  (NO organizer_id — use junction table instead)
   ============================================================ */
CREATE TABLE events (
    event_id              INT IDENTITY(1,1) PRIMARY KEY,
    event_name            NVARCHAR(200)  NOT NULL,
    description           NVARCHAR(MAX),
    date                  DATE           NOT NULL,
    time                  NVARCHAR(20)   NOT NULL,
    location              NVARCHAR(200)  NOT NULL,
    event_scope           NVARCHAR(50)   CHECK (event_scope IN ('intra-college','inter-college','zonal')),
    capacity              INT,
    registration_deadline DATE,
    created_at            DATETIME       DEFAULT GETDATE()
);
GO

/* ============================================================
   4. SPONSOR  (standalone — no event_id embedded)
   ============================================================ */
CREATE TABLE sponsor (
    sponsor_id    INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(150)  NOT NULL,
    company       NVARCHAR(150),
    contact_email NVARCHAR(100),
    contact_phone NVARCHAR(20),
    amount        DECIMAL(12,2),
    created_at    DATETIME       DEFAULT GETDATE()
);
GO

/* ============================================================
   5. JUDGE  (organizer-only private directory)
   ============================================================ */
CREATE TABLE judge (
    judge_id       INT IDENTITY(1,1) PRIMARY KEY,
    name           NVARCHAR(100)  NOT NULL,
    expertise_area NVARCHAR(200),
    contact_no     NVARCHAR(20),
    email          NVARCHAR(100),
    created_at     DATETIME       DEFAULT GETDATE()
);
GO

/* ============================================================
   6. EVENT_ORGANIZER  (M:N junction — multiple organizers per event)
   ============================================================ */
CREATE TABLE event_organizer (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    event_id       INT NOT NULL,
    organizer_id   INT NOT NULL,
    role           NVARCHAR(50)  DEFAULT 'co-organizer',
    assigned_date  DATETIME      DEFAULT GETDATE(),
    CONSTRAINT FK_eo_event     FOREIGN KEY (event_id)     REFERENCES events(event_id)         ON DELETE CASCADE,
    CONSTRAINT FK_eo_organizer FOREIGN KEY (organizer_id) REFERENCES organizer(organizer_id)  ON DELETE CASCADE,
    CONSTRAINT UQ_event_organizer UNIQUE (event_id, organizer_id)
);
GO

/* ============================================================
   7. EVENT_SPONSOR  (M:N junction — sponsors ↔ events)
   ============================================================ */
CREATE TABLE event_sponsor (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    event_id      INT NOT NULL,
    sponsor_id    INT NOT NULL,
    contribution  NVARCHAR(200),
    CONSTRAINT FK_es_event   FOREIGN KEY (event_id)   REFERENCES events(event_id)      ON DELETE CASCADE,
    CONSTRAINT FK_es_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsor(sponsor_id)   ON DELETE CASCADE,
    CONSTRAINT UQ_event_sponsor UNIQUE (event_id, sponsor_id)
);
GO

/* ============================================================
   8. REGISTRATIONS  (single source of truth for participant↔event)
      - event_id FK replaces free-text event_name
      - UNIQUE(user_id, event_id) blocks duplicate registrations
   ============================================================ */
CREATE TABLE registrations (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT           NOT NULL,
    event_id      INT           NOT NULL,
    fullname      NVARCHAR(100) NOT NULL,
    email         NVARCHAR(100) NOT NULL,
    phone         NVARCHAR(20),
    college_name  NVARCHAR(150),
    created_at    DATETIME      DEFAULT GETDATE(),
    CONSTRAINT FK_reg_user  FOREIGN KEY (user_id)  REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT FK_reg_event FOREIGN KEY (event_id) REFERENCES events(event_id)  ON DELETE CASCADE,
    CONSTRAINT UQ_user_event UNIQUE (user_id, event_id)
);
GO

/* ============================================================
   9. RESULTS  (one row per participant per event)
      - Kept single link: Participate(1) → Result(N)
      - Dropped duplicate "Produces"/"Received" pair
   ============================================================ */
CREATE TABLE results (
    result_id     INT IDENTITY(1,1) PRIMARY KEY,
    event_id      INT            NOT NULL,
    user_id       INT            NOT NULL,
    position      INT,
    score         DECIMAL(8,2),
    remarks       NVARCHAR(500),
    created_at    DATETIME       DEFAULT GETDATE(),
    CONSTRAINT FK_res_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT FK_res_user  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT UQ_result_event_user UNIQUE (event_id, user_id)
);
GO

/* ---- Verification ---- */
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

SELECT 'All tables created successfully' AS Status;
GO
