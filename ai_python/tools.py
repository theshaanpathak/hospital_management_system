import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import select, and_, update, delete
from sqlalchemy.orm import Session
from db import User, Patient, Doctor, DoctorSlot, Appointment, AppointmentDetail, Bill, Report
from rag import search_documents

# ---------------------------------------------------------
# 1. get_available_doctors
# ---------------------------------------------------------
def get_available_doctors(db: Session) -> List[Dict[str, Any]]:
    """Fetches list of active doctors with specialization, phone, experience, qualification, and bio."""
    try:
        query = db.query(Doctor, User).join(User, Doctor.user_id == User.id).all()
        results = []
        for doctor, user in query:
            results.append({
                "doctor_id": doctor.id,
                "name": user.name,
                "email": user.email,
                "specialization": doctor.specialization,
                "phone": doctor.phone,
                "experience_years": doctor.experience,
                "qualification": doctor.qualification,
                "bio": doctor.bio
            })
        return results
    except Exception as e:
        return {"error": f"Failed to get available doctors: {str(e)}"}

# ---------------------------------------------------------
# 2. get_doctor_schedule
# ---------------------------------------------------------
def get_doctor_schedule(db: Session, doctor_id: int) -> List[Dict[str, Any]]:
    """Fetches all open, unbooked slots for a specific doctor in the future."""
    try:
        now = datetime.utcnow()
        slots = db.query(DoctorSlot).filter(
            and_(
                DoctorSlot.doctor_id == doctor_id,
                DoctorSlot.is_booked == False,
                DoctorSlot.slot_time > now
            )
        ).order_by(DoctorSlot.slot_time.asc()).all()
        
        results = []
        for slot in slots:
            results.append({
                "slot_id": slot.id,
                "slot_time": slot.slot_time.strftime("%Y-%m-%d %H:%M:%S")
            })
        return results
    except Exception as e:
        return {"error": f"Failed to retrieve doctor schedule: {str(e)}"}

# ---------------------------------------------------------
# 3. book_appointment
# ---------------------------------------------------------
def book_appointment(db: Session, patient_id: int, doctor_id: int, slot_id: int, symptoms: str = "No symptoms described") -> Dict[str, Any]:
    """
    Transaction-safe appointment booking. 
    1. Selects slot FOR UPDATE to lock row.
    2. Verifies availability.
    3. Updates slot to booked.
    4. Creates appointment (pending status).
    5. Inserts intake details.
    """
    try:
        # Select slot with FOR UPDATE lock to prevent race conditions
        slot = db.query(DoctorSlot).filter(DoctorSlot.id == slot_id).with_for_update().first()
        
        if not slot:
            return {"success": False, "message": "Time slot not found."}
        
        if slot.is_booked:
            return {"success": False, "message": "This slot has already been booked by another patient."}
            
        if slot.slot_time <= datetime.now():
            return {"success": False, "message": "Cannot book a time slot in the past."}
            
        # Lock slot
        slot.is_booked = True
        
        # Create appointment
        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            date=slot.slot_time,
            status='pending',
            slot_id=slot_id
        )
        db.add(appointment)
        db.flush() # Flush to retrieve the appointment ID
        
        # Create appointment details (intake notes)
        details = AppointmentDetail(
            appointment_id=appointment.id,
            notes=symptoms,
            medical_history="Not provided via chat assistant",
            medications="Not provided via chat assistant"
        )
        db.add(details)
        
        db.commit()
        return {
            "success": True,
            "message": "Appointment booked successfully!",
            "appointment_id": appointment.id,
            "date": slot.slot_time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "pending_verification_or_approval"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Booking database error: {str(e)}"}

# ---------------------------------------------------------
# 4. cancel_appointment
# ---------------------------------------------------------
def cancel_appointment(db: Session, appointment_id: int) -> Dict[str, Any]:
    """
    Cancels an appointment and releases its doctor slot.
    """
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
        
        if not appointment:
            return {"success": False, "message": "Appointment not found."}
            
        if appointment.status == 'cancelled':
            return {"success": False, "message": "Appointment is already cancelled."}
            
        appointment.status = 'cancelled'
        
        # Release the doctor slot if it is in the future
        if appointment.slot_id:
            slot = db.query(DoctorSlot).filter(DoctorSlot.id == appointment.slot_id).first()
            if slot and slot.slot_time > datetime.now():
                slot.is_booked = False
                
        db.commit()
        return {
            "success": True,
            "message": "Appointment successfully cancelled and doctor slot has been released."
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Cancellation error: {str(e)}"}

# ---------------------------------------------------------
# 5. get_patient_bills
# ---------------------------------------------------------
def get_patient_bills(db: Session, patient_id: int) -> List[Dict[str, Any]]:
    """Retrieves all bills (pending, verified, paid) for a patient."""
    try:
        bills = db.query(Bill).filter(Bill.patient_id == patient_id).order_by(Bill.created_at.desc()).all()
        results = []
        for bill in bills:
            results.append({
                "bill_id": bill.id,
                "appointment_id": bill.appointment_id,
                "amount": float(bill.amount),
                "status": bill.status,
                "payment_method": bill.payment_method,
                "date": bill.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return results
    except Exception as e:
        return {"error": f"Failed to retrieve bills: {str(e)}"}

# ---------------------------------------------------------
# 6. get_patient_reports
# ---------------------------------------------------------
def get_patient_reports(db: Session, patient_id: int) -> List[Dict[str, Any]]:
    """Retrieves patient clinical reports, scans, and attachments from the reports table and session details."""
    try:
        # 1. Fetch from custom reports table
        reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.created_at.desc()).all()
        results = []
        for r in reports:
            results.append({
                "report_id": r.id,
                "report_type": r.report_type,
                "findings": r.findings,
                "file_path": f"/uploads/{r.file_path}" if r.file_path else None,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "source": "Diagnostic Lab"
            })
            
        # 2. Fetch from appointment session attachments
        sessions = db.query(AppointmentDetail, Appointment).join(
            Appointment, AppointmentDetail.appointment_id == Appointment.id
        ).filter(Appointment.patient_id == patient_id).all()
        
        for detail, appt in sessions:
            if detail.attachment:
                results.append({
                    "report_id": f"scan-{detail.id}",
                    "report_type": "Appointment Attachment / Scan",
                    "findings": detail.notes or "No clinical analysis recorded yet.",
                    "file_path": f"/uploads/{detail.attachment}",
                    "date": detail.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "source": f"Consultation Session (Appt #{appt.id})"
                })
        return results
    except Exception as e:
        return {"error": f"Failed to retrieve reports: {str(e)}"}

# ---------------------------------------------------------
# 7. create_doctor_session (Generates consultant slots)
# ---------------------------------------------------------
def create_doctor_session(
    db: Session, doctor_id: int, date: str, start_time: str, end_time: str, interval_minutes: int = 30
) -> Dict[str, Any]:
    """
    Generates slot times for a doctor on a specific date at given intervals.
    Formats: date = 'YYYY-MM-DD', start_time = 'HH:MM:SS', end_time = 'HH:MM:SS'
    """
    try:
        start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M:%S")
        now = datetime.now()
        
        if start_dt <= now:
            return {"success": False, "message": "Cannot generate slots in the past."}
            
        if start_dt >= end_dt:
            return {"success": False, "message": "Start time must be before end time."}
            
        slots_to_create = []
        current = start_dt
        while current < end_dt:
            # Check overlap
            exists = db.query(DoctorSlot).filter(
                and_(
                    DoctorSlot.doctor_id == doctor_id,
                    DoctorSlot.slot_time == current
                )
            ).first()
            
            if not exists:
                slots_to_create.append(DoctorSlot(doctor_id=doctor_id, slot_time=current, is_booked=False))
            current += timedelta(minutes=interval_minutes)
            
        if not slots_to_create:
            return {"success": False, "message": "Slots already exist or overlap with existing ones."}
            
        db.add_all(slots_to_create)
        db.commit()
        return {
            "success": True,
            "message": f"Successfully generated {len(slots_to_create)} new consulting slots.",
            "date": date,
            "generated_count": len(slots_to_create)
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Session generation failed: {str(e)}"}

# ---------------------------------------------------------
# 8. approve_appointment
# ---------------------------------------------------------
def approve_appointment(db: Session, appointment_id: int) -> Dict[str, Any]:
    """
    Approves a pending appointment.
    Per node backend, approved slots are permanently consumed (deleted) from active slots.
    """
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
        if not appointment:
            return {"success": False, "message": "Appointment not found."}
            
        appointment.status = 'approved'
        
        # In node: slot is permanently consumed/deleted upon approval
        if appointment.slot_id:
            db.query(DoctorSlot).filter(DoctorSlot.id == appointment.slot_id).delete()
            
        db.commit()
        return {"success": True, "message": f"Appointment #{appointment_id} has been approved."}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Approval error: {str(e)}"}

# ---------------------------------------------------------
# 9. reject_appointment
# ---------------------------------------------------------
def reject_appointment(db: Session, appointment_id: int) -> Dict[str, Any]:
    """
    Rejects a pending appointment, freeing up the slot.
    """
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
        if not appointment:
            return {"success": False, "message": "Appointment not found."}
            
        appointment.status = 'rejected'
        
        # Release slot
        if appointment.slot_id:
            slot = db.query(DoctorSlot).filter(DoctorSlot.id == appointment.slot_id).first()
            if slot and slot.slot_time > datetime.now():
                slot.is_booked = False
                
        db.commit()
        return {"success": True, "message": f"Appointment #{appointment_id} has been rejected."}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Rejection error: {str(e)}"}

# ---------------------------------------------------------
# 10. analyze_symptoms
# ---------------------------------------------------------
def analyze_symptoms(symptoms: str) -> Dict[str, Any]:
    """
    AI Clinical triage assistant analyzing symptoms and suggesting department + care steps.
    """
    sym = symptoms.lower()
    analysis = {
        "symptoms_analyzed": symptoms,
        "urgency": "Routine",
        "recommended_specialty": "General Medicine",
        "guidance": "Please consult a primary care physician. Get rest and drink plenty of fluids."
    }
    
    if "chest" in sym or "heart" in sym or "cardiac" in sym or "breathless" in sym:
        analysis["urgency"] = "HIGH / URGENT"
        analysis["recommended_specialty"] = "Cardiology"
        analysis["guidance"] = "Chest pains or breathlessness can indicate coronary or heart issues. Avoid strenuous physical activity and consult a Cardiologist immediately. If severe, visit the 24/7 Casualty ward."
        
    elif "headache" in sym or "seizure" in sym or "dizzy" in sym or "numbness" in sym or "paralysis" in sym:
        analysis["urgency"] = "Urgent / Medium"
        analysis["recommended_specialty"] = "Neurology"
        analysis["guidance"] = "Neurological symptoms such as dizzy spells, localized numbness, or severe recurring migraines require brain and nerve mapping. Book an appointment with our Neurology specialist."
        
    elif "fracture" in sym or "bone" in sym or "joint" in sym or "sprain" in sym or "back pain" in sym:
        analysis["urgency"] = "Routine / Medium"
        analysis["recommended_specialty"] = "Orthopedics"
        analysis["guidance"] = "Skeletal discomfort, bone sprains, fractures, or joint stiffness require diagnostic X-rays and orthopedic consult. Apply ice to swellings and limit joint movement."
        
    elif "child" in sym or "baby" in sym or "pediatric" in sym or "infant" in sym or "fever" in sym and ("son" in sym or "daughter" in sym or "kid" in sym):
        analysis["urgency"] = "Medium"
        analysis["recommended_specialty"] = "Pediatrics"
        analysis["guidance"] = "Pediatric health concerns require specialists in growth and early disease management. Ensure the child remains hydrated and consult a pediatrician."
        
    return analysis

# ---------------------------------------------------------
# 11. recommend_department
# ---------------------------------------------------------
def recommend_department(specialty: str) -> Dict[str, Any]:
    """Recommends specific clinical departments based on a medical specialty field."""
    dept_map = {
        "Cardiology": {
            "name": "Cardiology Department (Heart Care)",
            "floor": "Wing C, First Floor",
            "chief_doctor": "Dr. Bishal Ranjan Das",
            "procedures": ["ECG", "Echocardiogram", "TMT Test", "Angiography"]
        },
        "Neurology": {
            "name": "Neurology and Brain Care Unit",
            "floor": "Wing B, Second Floor",
            "chief_doctor": "Neurology Consultant Team",
            "procedures": ["EEG", "NCV Test", "Brain MRI", "CT Scan"]
        },
        "Pediatrics": {
            "name": "Pediatrics (Child Health)",
            "floor": "Wing D, Ground Floor",
            "chief_doctor": "Pediatric Care Team",
            "procedures": ["Immunizations", "Growth Monitoring", "Pediatric Consults"]
        },
        "Orthopedics": {
            "name": "Orthopedics & Joint Care",
            "floor": "Wing C, Ground Floor",
            "chief_doctor": "Orthopedic Surgeon Team",
            "procedures": ["Fracture Casting", "Physiotherapy", "Joint Replacement", "X-ray"]
        }
    }
    
    spec = specialty.capitalize()
    return dept_map.get(spec, {
        "name": "General Medicine Clinic",
        "floor": "Wing A, Ground Floor",
        "chief_doctor": "Primary Care Physicians",
        "procedures": ["Blood Sugar Check", "Blood Pressure Monitoring", "Routine Consults"]
    })

# ---------------------------------------------------------
# 12. explain_xray_result
# ---------------------------------------------------------
def explain_xray_result(finding: str) -> Dict[str, Any]:
    """Explains a chest or limb scan finding in reassuring, simple language."""
    find = finding.lower()
    explanation = {
        "original_finding": finding,
        "clinical_term": "Unspecified Abnormality",
        "explanation": "An unusual shadow or signature was noticed on the scan that requires direct clinical correlation with a physician.",
        "recommended_specialist": "General Medicine",
        "severity": "Mild / Follow-up Required"
    }
    
    if "pneumonia" in find or "consolidation" in find or "fluid in lung" in find:
        explanation["clinical_term"] = "Pneumonitis / Consolidation"
        explanation["explanation"] = "The X-ray highlights a cloudy area (consolidation) in the lungs, typically indicating a localized infection (like Pneumonia). This causes fluids to gather in the lung's air sacs, leading to cough or mild shortness of breath."
        explanation["recommended_specialist"] = "General Medicine"
        explanation["severity"] = "Moderate"
        
    elif "fracture" in find or "crack" in find or "broken" in find:
        explanation["clinical_term"] = "Skeletal Fracture"
        explanation["explanation"] = "The X-ray shows a structural disruption (crack or break) in the bone shaft. This requires physical immobilization (plaster cast or splint) to promote natural bone union and repair."
        explanation["recommended_specialist"] = "Orthopedics"
        explanation["severity"] = "Moderate / High"
        
    elif "cardiomegaly" in find or "enlarged heart" in find:
        explanation["clinical_term"] = "Cardiomegaly"
        explanation["explanation"] = "The silhouette of the heart is slightly larger than standard reference ranges on this scan. This can occur due to high blood pressure, valve strain, or muscle thickening, and requires specialized cardiology review."
        explanation["recommended_specialist"] = "Cardiology"
        explanation["severity"] = "Moderate / Follow-up Recommended"
        
    elif "normal" in find or "no abnormality" in find:
        explanation["clinical_term"] = "Clear Chest Radiograph"
        explanation["explanation"] = "Great news! The lung fields, pleural spaces, cardiac outline, and bony rib cage appear perfectly clear. No acute abnormalities or infective shadows were detected."
        explanation["recommended_specialist"] = "None"
        explanation["severity"] = "None (Normal)"
        
    return explanation

# ---------------------------------------------------------
# 13. generate_bill
# ---------------------------------------------------------
def generate_bill(db: Session, patient_id: int, appointment_id: int, amount: float) -> Dict[str, Any]:
    """Generates a new pending bill for a clinical consultation session."""
    try:
        # Check duplicate
        exists = db.query(Bill).filter(Bill.appointment_id == appointment_id).first()
        if exists:
            return {"success": False, "message": "A bill already exists for this appointment."}
            
        bill = Bill(
            patient_id=patient_id,
            appointment_id=appointment_id,
            amount=amount,
            status='pending'
        )
        db.add(bill)
        db.commit()
        return {
            "success": True,
            "bill_id": bill.id,
            "amount": amount,
            "status": "pending_admin_verification"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Billing error: {str(e)}"}

# ---------------------------------------------------------
# 14. search_hospital_documents
# ---------------------------------------------------------
def search_hospital_documents(query: str) -> List[Dict[str, Any]]:
    """Invokes our local vector/TF-IDF RAG search engine to return relevant hospital policy snippets."""
    return search_documents(query, top_k=2)

# ---------------------------------------------------------
# 15. get_hospital_analytics
# ---------------------------------------------------------
def get_hospital_analytics(db: Session) -> Dict[str, Any]:
    """Retrieves operational insights and statistics for the hospital admin."""
    try:
        paid_bills = db.query(Bill).filter(Bill.status == 'paid').all()
        total_revenue = sum(float(b.amount) for b in paid_bills)
        
        active_doctors = db.query(Doctor).count()
        total_patients = db.query(Patient).count()
        total_appointments = db.query(Appointment).count()
        pending_appointments = db.query(Appointment).filter(Appointment.status == 'pending').count()
        
        verified_bills = db.query(Bill).filter(Bill.status == 'verified').count()
        pending_bills = db.query(Bill).filter(Bill.status == 'pending').count()
        
        return {
            "total_revenue_inr": float(total_revenue),
            "active_doctors_count": active_doctors,
            "total_registered_patients": total_patients,
            "total_appointments_all_time": total_appointments,
            "pending_appointments_count": pending_appointments,
            "billing_stats": {
                "paid_bills": len(paid_bills),
                "verified_bills_unpaid": verified_bills,
                "pending_verification": pending_bills
            }
        }
    except Exception as e:
        return {"error": f"Failed to calculate analytics: {str(e)}"}

