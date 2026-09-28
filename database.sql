-- Project database banao aur use select karo.
CREATE DATABASE IF NOT EXISTS DBMS_PROJECT;
USE DBMS_PROJECT;

-- Candidate aur admin ke login details. id har user ki unique key hai.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('candidate', 'admin') NOT NULL DEFAULT 'candidate',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Candidate ki profile; user_id users table ke account se link karta hai.
CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(40),
  education VARCHAR(255),
  skills TEXT,
  resume VARCHAR(500),
  CONSTRAINT fk_candidates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin yahan internships add karta hai; candidates inhe browse kar sakte hain.
CREATE TABLE IF NOT EXISTS internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  location VARCHAR(180),
  description TEXT,
  skills TEXT,
  stipend VARCHAR(100),
  duration VARCHAR(100),
  deadline DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Application candidate aur internship ko link karti hai; status yahin store hota hai.
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  internship_id INT NOT NULL,
  status ENUM('Applied', 'Shortlisted', 'Rejected', 'Selected') NOT NULL DEFAULT 'Applied',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_internship (candidate_id, internship_id),
  CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_internship FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

-- Demo login accounts. Password plain text me hai, isliye real password use mat karo.
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'System Admin', 'admin@example.com', '1234@', 'admin'),
(2, 'Sample Candidate', 'candidate@example.com', 'password', 'candidate');

-- Sample candidate ki profile details.
INSERT IGNORE INTO candidates (id, user_id, phone, education, skills, resume) VALUES
(1, 2, '555-0100', 'BSc Computer Science', 'JavaScript, SQL, HTML, CSS', 'https://example.com/resume.pdf');

-- Do sample internships add karo, agar pehle se nahi hain.
INSERT INTO internships (title, company, location, description, skills, stipend, duration, deadline)
SELECT 'Web Development Intern', 'Northstar Labs', 'Hybrid', 'Help build and test customer-facing web features.', 'HTML, CSS, JavaScript', '$1,200 / month', '12 weeks', '2027-02-15'
WHERE NOT EXISTS (SELECT 1 FROM internships WHERE title = 'Web Development Intern' AND company = 'Northstar Labs');

INSERT INTO internships (title, company, location, description, skills, stipend, duration, deadline)
SELECT 'Data Analyst Intern', 'Greenfield Analytics', 'Remote', 'Prepare reports and explore business datasets.', 'SQL, Excel, Data Analysis', '$1,000 / month', '10 weeks', '2027-03-01'
WHERE NOT EXISTS (SELECT 1 FROM internships WHERE title = 'Data Analyst Intern' AND company = 'Greenfield Analytics');

-- Sample candidate ko web internship ke liye apply karwao; duplicate application nahi banegi.
INSERT INTO applications (candidate_id, internship_id, status)
SELECT c.id, i.id, 'Applied' FROM candidates c JOIN users u ON u.id = c.user_id
JOIN internships i ON i.title = 'Web Development Intern' AND i.company = 'Northstar Labs'
WHERE u.email = 'candidate@example.com'
AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.candidate_id = c.id AND a.internship_id = i.id);