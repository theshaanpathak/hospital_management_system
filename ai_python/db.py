import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, Numeric, ForeignKey, Enum, Boolean, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Load environment
load_dotenv()

# MySQL Connection URI
# Fallback to local default if not specified in env
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/hms")

# Initialize Engine and Session
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------------------------------------------------------
# MODELS
# ---------------------------------------------------------

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True, unique=True)
    password = Column(String(255), nullable=True)
    role = Column(Enum('admin', 'doctor', 'patient'), nullable=True)

    patient = relationship("Patient", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)


class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)

    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="patient", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="patient", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = 'doctors'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    specialization = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    experience = Column(Integer, nullable=True)
    qualification = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="doctor")
    slots = relationship("DoctorSlot", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")


class DoctorSlot(Base):
    __tablename__ = 'doctor_slots'
    id = Column(Integer, primary_key=True, autoincrement=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    slot_time = Column(DateTime, nullable=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="slots")


class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=True)
    date = Column(DateTime, nullable=True)
    status = Column(Enum('pending', 'pending_verification', 'approved', 'rejected', 'cancelled'), default='pending')
    slot_id = Column(Integer, nullable=True)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    details = relationship("AppointmentDetail", back_populates="appointment", cascade="all, delete-orphan", uselist=False)
    bill = relationship("Bill", back_populates="appointment", cascade="all, delete-orphan", uselist=False)


class AppointmentDetail(Base):
    __tablename__ = 'appointment_details'
    id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id', ondelete='CASCADE'))
    notes = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    attachment = Column(String(255), nullable=True)
    duration = Column(String(255), nullable=True)
    medical_history = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="details")


class Bill(Base):
    __tablename__ = 'bills'
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum('pending', 'verified', 'paid'), default='pending')
    payment_method = Column(Enum('cash', 'card', 'upi'), nullable=True)
    created_by_doctor_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="bills")
    appointment = relationship("Appointment", back_populates="bill")


class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True)
    report_type = Column(String(100), default='X-ray')  # 'X-ray', 'Blood Test', 'MRI', etc.
    findings = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")


# ---------------------------------------------------------
# DATABASE INITIALIZATION helper
# ---------------------------------------------------------
def init_db():
    """Create the reports table if it doesn't already exist."""
    print("⏳ Synchronizing Database Models...")
    try:
        # Create all tables (will skip existing and create the new 'reports' table)
        Base.metadata.create_all(bind=engine)
        print("✅ Database synchronization complete.")
    except Exception as e:
        print(f"⚠️ Database sync warning (maybe tables already exist): {e}")

def get_db():
    dbSession = SessionLocal()
    try:
        yield dbSession
    finally:
        dbSession.close()
