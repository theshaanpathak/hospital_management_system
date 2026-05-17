# 🏥 Hospital Management System (HMS)

A modern, full-stack Hospital Management System featuring an integrated **AI Assistant**, **Clinical Intake Flow**, and **Doctor Approval Dashboard**.

---

## 🛠️ Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **MySQL / XAMPP** (Database)

---

## 🚀 Quick Start Guide

### 1. Database Setup (SQL)
Start your MySQL server (via XAMPP/LAMPP or native) and run:
```sql
-- Create Database
CREATE DATABASE hms;
USE hms;

-- Create Required Tables
-- (Run the provided schema.sql or use the tables: users, patients, doctors, 
-- appointments, appointment_details, doctor_slots, bills)
```

### 2. AI Python Service
This service powers the Intelligent Assistant using Groq (Llama 3.1).
```bash
cd ai_python

# Install Libraries
pip install -r requirements.txt

# Run Service
python3 main.py
```
*AI runs on: http://localhost:8000*

### 3. Backend Server (Node.js)
The core engine connecting the database, AI, and frontend.
```bash
cd backend

# Install Libraries
npm install

# Run Server
npm start
```
*Server runs on: http://localhost:5000*

### 4. Frontend Application (React)
The premium user interface for Patients and Doctors.
```bash
cd frontend

# Install Libraries
npm install

# Run Application
npm start
```
*App runs on: http://localhost:3000*

---

## 🤖 AI Assistant Features
- **General Inquiries**: Ask anything from medical advice to general facts.
- **Hospital Knowledge**: Provides real-time info on OPD timings and specialists.
- **Responsive UI**: Fully adaptive floating widget (Full-screen on mobile).

## 🩺 Clinical Workflow
1. **Patient Booking**: Complete a medical intake form with symptoms and history.
2. **Doctor Approval**: Doctors review intake data in a split-view modal and generate prescriptions.
3. **Automated Billing**: marked-as-paid status updates instantly upon approval.

---

## 📂 Project Structure
- `/frontend`: React.js components and UI logic.
- `/backend`: Express.js API and MySQL integration.
- `/ai_python`: FastAPI-based Groq AI service.
