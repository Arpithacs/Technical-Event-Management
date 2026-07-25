USE EventManagement;
GO

-- Insert admin organizer with bcrypt-hashed password (Admin@123, 10 rounds)
IF NOT EXISTS (SELECT 1 FROM organizer WHERE email = N'admin@techfest.org')
BEGIN
    INSERT INTO organizer (name, email, password, department)
    VALUES (
        N'TechFest Admin',
        N'admin@techfest.org',
        N'$2b$10$AaR2Rw7SkWCj/S4TiC.nyeMafQSBkQEZune98Re0wzWugw0YsV8DK',
        N'IT Department'
    );
    PRINT 'Organizer inserted successfully';
END
ELSE
BEGIN
    PRINT 'Organizer with this email already exists';
END
GO

SELECT organizer_id, name, email, department, created_at
FROM organizer;
GO
