# Internship & Candidate Application Management System

A simple full-stack recruitment management system for managing internship candidates, applications, and administrative workflows.

The project is built using **HTML, CSS, JavaScript, Node.js, Express.js, and MySQL**. It is designed as a DBMS mini-project and focuses on demonstrating database connectivity, CRUD operations, authentication, candidate management, internship management, and application tracking.

## 🚀 Features

### Candidate

- Candidate registration and login
- Candidate profile management
- Browse available internships
- Apply for internships
- View submitted applications
- Track application information
- Resume URL or file-reference storage

### Admin

- Admin login
- Admin dashboard
- Manage candidates
- Manage internships
- View applications
- Manage application records
- Track application status
- View candidate information

### Database

- MySQL 8+
- Relational database structure
- Primary and foreign-key relationships
- Sample data included
- Database health-check endpoint
- Candidate, internship, and application records

---

## 🛠️ Technologies Used

| Technology      | Purpose                   |
| --------------- | ------------------------- |
| HTML5           | Frontend structure        |
| CSS3            | Styling and layout        |
| JavaScript      | Client-side functionality |
| Node.js         | Backend runtime           |
| Express.js      | Backend/API framework     |
| MySQL 8+        | Database                  |
| MySQL Workbench | Database management       |

> **Note:** This project does not use React, Next.js, MongoDB, or other frontend frameworks.

---

## 📁 Project Structure

```text
Internship-Candidate-Application-Management-System/
│
├── .vscode/
│
├── node_modules/
│
├── public/
│   │
│   ├── admin/
│   │   ├── admin.html
│   │   ├── admin-login.html
│   │   ├── applications.html
│   │   ├── candidates.html
│   │   └── manage-internships.html
│   │
│   ├── candidate/
│   │   ├── applications.html
│   │   ├── apply.html
│   │   ├── index.html
│   │   ├── internships.html
│   │   ├── login.html
│   │   ├── profile.html
│   │   └── register.html
│   │
│   ├── app.js
│   └── styles.css
│
├── .env
├── .gitignore
├── database.sql
├── db.js
├── package-lock.json
├── package.json
├── README.md
└── server.js

```

## ⚙️ Requirements

Before running the project, make sure you have:

- **Node.js 18 or newer**
- **MySQL 8 or newer**
- **MySQL Workbench** (recommended)

---

## 📥 Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL

```

Navigate into the project:

```bash
cd Internship-Candidate-Application-Management-System

```

---

### 2. Set Up the Database

Open **MySQL Workbench** and connect to your local MySQL server.

Open:

```text
database.sql

```
Execute the complete SQL file using the **lightning-bolt Execute button**.

This will create:

```text
DBMS_PROJECT

```

along with the required tables and sample records.

---
### 3. Install Node.js Dependencies

Open a terminal in the project directory and run:

```bash
npm install

```

---

### 4. Configure Environment Variables

Open the existing `.env` file in the project root.

The project is configured for the supplied local MySQL connection.

Example:

```env
PORT=3002

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=DBMS_PROJECT
DB_PORT=3306

```

**Important:** Never commit your actual database password to GitHub.

Make sure `.env` is included in `.gitignore`.

---

### 5. Start the Application

Run:

```bash
npm start

```

The application will start on:

```text
http://localhost:3002

```

The project uses port **3002** because port 3000 is already occupied on the development machine.

---

## 🔍 Check Database Connection

After starting the server, open:

```text
http://localhost:3002/api/health/db

```

A successful database connection should return:

```json
{
  "database": "connected"
}

```

If the database connection fails, check your MySQL server status and `.env` configuration.

---

## 🔐 Demo Login Credentials

The database seed includes demo accounts for testing.

### Admin

```text
Email: admin@example.com
Password: 1234@

```

### Candidate

```text
Email: candidate@example.com
Password: password

```

> **Security Warning:** These credentials are for demonstration purposes only.

Passwords in this simplified version are stored as plain text as requested. Anyone with database access can therefore read them.

**Do not use this authentication setup for real users or reusable passwords.**

Older bcrypt password hashes are converted to plain text after the corresponding account successfully logs in.

---

## 👤 Candidate Registration

New candidates can register through the application.

Candidate registration creates a candidate account.

The candidate can then:

- Log in to the system
- Manage their profile
- Browse available internships
- Apply for internships
- View submitted applications

The candidate profile can store a resume as:

- Resume URL
- File reference

This version **does not upload or store actual resume files**.

---

## 🛡️ Admin Access

Admin accounts are created through the database seed in:

```text
database.sql

```

Public registration **cannot create administrator accounts**.

This prevents users from registering themselves as administrators.

The admin section is available inside:

```text
public/admin/

```

---

## 🗂️ Candidate Pages

The candidate pages are located inside:

```text
public/candidate/

```

### Available Pages

| File | Purpose |
| ---- | ------- |
| `index.html` | Candidate home page |
| `register.html` | Candidate registration |
| `login.html` | Candidate login |
| `profile.html` | Candidate profile |
| `internships.html` | View available internships |
| `apply.html` | Apply for an internship |
| `applications.html` | View submitted applications |

### Candidate Flow

```text
Register
   ↓
Login
   ↓
Profile
   ↓
Browse Internships
   ↓
Select Internship
   ↓
Apply
   ↓
View Applications

```

---

## 🗂️ Admin Pages

The admin pages are located inside:

```text
public/admin/

```

### Available Pages

| File | Purpose |
| ---- | ------- |
| `admin-login.html` | Admin login |
| `admin.html` | Admin dashboard |
| `candidates.html` | Manage candidates |
| `applications.html` | Manage applications |
| `manage-internships.html` | Manage internships |

### Admin Flow

```text
Admin Login
     ↓
Admin Dashboard
     ↓
 ┌───────────────┬────────────────┐
 ↓               ↓                ↓
Candidates   Applications    Internships

```

---

## 🗄️ Database

The application uses a MySQL database named:

```text
DBMS_PROJECT

```

The database setup is available in:

```text
database.sql

```

The database contains tables for managing:

- Users
- Candidates
- Internships
- Applications
- Application statuses
- Candidate information
- Recruitment-related information

The MySQL database connection is handled through:

```text
db.js

```

The main Express.js backend is handled through:

```text
server.js

```

---

## 🔄 Application Flow

```text
                ┌──────────────────┐
                │      User        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  HTML / CSS / JS │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │    Node.js       │
                │    Express.js    │
                │     REST API     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │      MySQL       │
                │  DBMS_PROJECT    │
                └──────────────────┘

```

---

## 📌 API Health Check

### Database Health

```http
GET /api/health/db

```

Successful response:

```json
{
  "database": "connected"
}

```

---

## 🔒 Security Notes

This project is intended for **educational and demonstration purposes**.

The current implementation intentionally uses simplified authentication.

For a production application, the following improvements should be implemented:

- Password hashing using bcrypt or Argon2
- Secure session/JWT authentication
- Input validation
- HTTPS
- Rate limiting
- Secure cookies
- CSRF protection
- Proper file upload handling
- Role-based authorization
- Environment-based secret management
- Database access restrictions
- Secure password policies

**Never use the demo passwords in a real application.**

---

## 🎓 Project Purpose

This project was developed as a **DBMS mini-project** to demonstrate how a web application can interact with a relational database.

It demonstrates concepts such as:

- Database design
- SQL queries
- Relational tables
- Primary and foreign keys
- CRUD operations
- Authentication
- REST APIs
- Backend–database connectivity
- Candidate management
- Internship management
- Application management

---

## 🧪 Quick Start

```bash
# Clone the repository
git clone YOUR_GITHUB_REPOSITORY_URL

# Enter the project
cd Internship-Candidate-Application-Management-System

# Install dependencies
npm install

# Start the server
npm start

```

Then open:

```text
http://localhost:3002

```

Check the database connection:

```text
http://localhost:3002/api/health/db

```

---

## 📌 Important Notes

- Make sure MySQL is running before starting the application.
- Make sure the `DBMS_PROJECT` database has been created.
- Make sure the database credentials in `.env` are correct.
- Do not commit `.env` to GitHub.
- Do not commit `node_modules` to GitHub.
- Resume files are not uploaded directly in this version.
- Resume information is stored as a URL or file reference.
- Admin accounts are seeded through `database.sql`.
- Public registration cannot create admin accounts.
- The application runs on port `3002`.
- The project is intended for educational purposes.

---
