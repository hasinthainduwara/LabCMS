DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS grants;
DROP TABLE IF EXISTS chemicals;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS excel_uploads;
DROP TABLE IF EXISTS audit_logs;

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    avatar TEXT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL
);

-- Departments table
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    technical_officer VARCHAR(255) NULL,
    head_of_department VARCHAR(255) NULL
);

-- Grants table
CREATE TABLE grants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    funding_org VARCHAR(255) NOT NULL,
    pi_name VARCHAR(255) NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    used DECIMAL(15, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Chemicals table
CREATE TABLE chemicals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    formula VARCHAR(255) NOT NULL,
    cas VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    department VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    grant_ref VARCHAR(50) NULL,
    hazards VARCHAR(255) DEFAULT '', -- Comma-separated list
    expiry VARCHAR(50) NOT NULL
);

-- Requests table
CREATE TABLE requests (
    id VARCHAR(50) PRIMARY KEY,
    chemical_id VARCHAR(50) NOT NULL,
    chemical_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    submission_date DATE NOT NULL,
    needed_by DATE NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    grant_id VARCHAR(50) NULL,
    approved_by VARCHAR(255) DEFAULT '',
    rejection_reason TEXT NULL
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp VARCHAR(50) NOT NULL
);

-- Excel Uploads Queue table
CREATE TABLE excel_uploads (
    id VARCHAR(50) PRIMARY KEY,
    uploaded_by VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    chemicals_data JSON NOT NULL
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp VARCHAR(50) NOT NULL,
    user VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- Seed Data (Bcrypt hash of 'password' is '$2a$10$OZNi4OPBV7Xamk7U8RNRXOWYdjkV5oltPh8vxxvyL01bZR2xlOxPK')
INSERT INTO users (id, name, email, password, role, department, status, avatar) VALUES
('USR-01', 'System Administrator', 'admin@university.edu', '$2a$10$OZNi4OPBV7Xamk7U8RNRXOWYdjkV5oltPh8vxxvyL01bZR2xlOxPK', 'superadmin', 'System Wide', 'Active', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQkWnpNjwXsbgz-c10i20NwDj-7A9FCPchgUjxcRl4zdjGDWXGBzXZ1TaTzjT19AUQyNd4yCDlkrbApi0C_5Nd3LTuMzio3JvHF3_vPHpAK2VCThmqM0ZaoqPnnkfY3pg4gfjG3By7Su50TjPL2uZdfBHyR5RTqHyPmktlFpLk2VgLfpNY2tVyoXGULB1EdxXUcLcpF7WfkugYYe5E_Z_IAk0bLIIRWJtcgtQ8AwVfSGyL5Aq7FbSplwJ79iZVIhVFGc41Hvi5i9k');
