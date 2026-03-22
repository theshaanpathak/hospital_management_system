# Hospital Management System (HMS)

This project consists of three main parts:

* **Backend (Node.js)**
* **Frontend**
* **Database (MySQL)**

Follow the instructions below to set up and run the project locally.

---

## 📁 Project Structure

```
project-root/
│
├── backend/     → Node.js backend server
├── frontend/    → Frontend application
└── database/    → Database file (hms.sql)
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

* Node.js (v14 or higher recommended)
* npm (comes with Node.js)
* MySQL Server
* Git (optional)

---

## 🚀 Backend Setup

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (if applicable):

Create a `.env` file in the backend folder and add necessary variables like:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hms
```

4. Start the backend server:

```bash
npm start
```

---

## 💻 Frontend Setup

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend application:

```bash
npm start
```

The frontend should now be running (typically on http://localhost:3000).

---

## 🗄️ Database Setup (MySQL)

1. Open MySQL (via CLI or tools like MySQL Workbench / phpMyAdmin).

2. Create a new database:

```sql
CREATE DATABASE hms;
```

3. Select the database:

```sql
USE hms;
```

4. Import the `hms.sql` file:

### Option 1: Using MySQL CLI

```bash
mysql -u root -p hms < path/to/hms.sql
```

### Option 2: Using phpMyAdmin / MySQL Workbench

* Open your database tool
* Select the `hms` database
* Click **Import**
* Upload the `hms.sql` file
* Execute the import

---

## ▶️ Running the Full Project

1. Start MySQL server
2. Run backend:

```bash
cd backend
npm start
```

3. Run frontend:

```bash
cd frontend
npm start
```

---

## 🛠️ Notes

* Ensure backend is running before frontend to avoid API errors.
* Check API base URL in frontend (if configurable).
* Update database credentials in backend config if needed.

---

## 📌 Troubleshooting

* If dependencies fail: delete `node_modules` and run `npm install` again.
* If port is in use: change PORT in `.env`.
* Ensure MySQL service is running.

---

## 📄 License

This project is for educational purposes.

---
