USE EventManagement;
GO

-- =====================================================
-- Seed organizer account with bcrypt-hashed password
-- Credentials: admin@techfest.org / Admin@123
-- Hash generated with bcrypt.hash('Admin@123', 10) = 60 chars
-- =====================================================

-- First, remove any rows with plaintext passwords (len < 60)
DELETE FROM organizer WHERE LEN(password) < 60;
GO

IF NOT EXISTS (SELECT 1 FROM organizer WHERE email = N'admin@techfest.org')
BEGIN
    INSERT INTO organizer (name, email, password, department)
    VALUES (
        N'TechFest Admin',
        N'admin@techfest.org',
        N'$2b$10$GqLxHR/pKzo0ct1cw9m5ceHz2EfxfVHAH6eJ2Y.HGddZi8Vl5/Qhm',
        N'IT Department'
    );
    PRINT 'Organizer inserted successfully';
END
ELSE
BEGIN
    PRINT 'Organizer with this email already exists';
END
GO

SELECT organizer_id, name, email, department, LEN(password) AS pw_len
FROM organizer;
GO
