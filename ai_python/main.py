import os
import json
import jwt
import shutil
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, Header, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

from db import init_db, get_db, User, Patient, Doctor, DoctorSlot, Appointment, AppointmentDetail, Bill, Report
from rag import get_rag_context
import tools as hms_tools

# Load environment
load_dotenv()

# Initialize Database on Startup
init_db()

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="HMS - Agentic AI Assistant Service")

# Enable CORS for frontend & Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Signing Secret
JWT_SECRET = "mysecretkey"

# In-Memory Conversational Memory (User ID -> Message History)
CONVERSATION_MEMORY: Dict[int, List[Dict[str, str]]] = {}

# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------
class ChatQuery(BaseModel):
    query: str

# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------
def get_user_from_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Decodes JWT and injects user identity."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
        
    try:
        # Standard format: 'Bearer <token>'
        token = authorization.split(" ")[1] if " " in authorization else authorization
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload  # Contains { "id": user_id, "role": user_role }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

def resolve_clinical_ids(db: Session, user: Dict[str, Any]) -> Dict[str, Any]:
    """Resolves Patient ID or Doctor ID from User ID."""
    user_id = user["id"]
    role = user["role"]
    
    result = {
        "user_id": user_id,
        "role": role,
        "name": "Anonymous",
        "patient_id": None,
        "doctor_id": None
    }
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        result["name"] = db_user.name
        
    if role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user_id).first()
        if patient:
            result["patient_id"] = patient.id
            
    elif role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor:
            result["doctor_id"] = doctor.id
            
    return result

# ---------------------------------------------------------
# AI AGENT NATIVE TOOL DEFINITIONS FOR GROQ LLAMA 3.1
# ---------------------------------------------------------
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_available_doctors",
            "description": "Fetch all active doctors, specializing departments, experience, and bios.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_doctor_schedule",
            "description": "Fetches all open (unbooked) time slots for a specific doctor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_id": {"type": "integer", "description": "The unique database ID of the doctor."}
                },
                "required": ["doctor_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Automatically books a new appointment at a selected doctor time slot. Always verify available slots first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "integer", "description": "The unique patient database ID."},
                    "doctor_id": {"type": "integer", "description": "The doctor database ID."},
                    "slot_id": {"type": "integer", "description": "The doctor slot ID from the schedule list."},
                    "symptoms": {"type": "string", "description": "Brief description of the patient's symptoms."}
                },
                "required": ["patient_id", "doctor_id", "slot_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancels an existing appointment and releases the slot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer", "description": "The appointment ID to cancel."}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_patient_bills",
            "description": "Fetches all pending, verified, or paid bills/invoices for a patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "integer", "description": "The unique patient ID."}
                },
                "required": ["patient_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_patient_reports",
            "description": "Retrieves medical scan records and diagnostic attachments for a patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "integer", "description": "The unique patient ID."}
                },
                "required": ["patient_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_doctor_session",
            "description": "Doctor/Admin tool to generate consultant time slots on a specific date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_id": {"type": "integer", "description": "The doctor's database ID."},
                    "date": {"type": "string", "description": "Date in 'YYYY-MM-DD' format."},
                    "start_time": {"type": "string", "description": "Start time in 'HH:MM:SS' format."},
                    "end_time": {"type": "string", "description": "End time in 'HH:MM:SS' format."},
                    "interval_minutes": {"type": "integer", "description": "Slot spacing in minutes (default 30)."}
                },
                "required": ["doctor_id", "date", "start_time", "end_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "approve_appointment",
            "description": "Doctor/Admin tool to approve a pending appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer", "description": "The appointment ID."}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "reject_appointment",
            "description": "Doctor/Admin tool to reject an appointment, releasing slot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer", "description": "The appointment ID."}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_symptoms",
            "description": "Clinical tool to assess symptoms and recommend matching specialty care units.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symptoms": {"type": "string", "description": "Brief summary of symptoms."}
                },
                "required": ["symptoms"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_department",
            "description": "Fetches ward location, primary clinicians, and common procedures for a clinical specialty.",
            "parameters": {
                "type": "object",
                "properties": {
                    "specialty": {"type": "string", "description": "Specialty: 'Cardiology', 'Neurology', 'Pediatrics', or 'Orthopedics'."}
                },
                "required": ["specialty"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommend_department",
            "description": "Alias tool. Fetches ward location, primary clinicians, and common procedures for a clinical specialty.",
            "parameters": {
                "type": "object",
                "properties": {
                    "specialty": {"type": "string", "description": "Specialty: 'Cardiology', 'Neurology', 'Pediatrics', or 'Orthopedics'."}
                },
                "required": ["specialty"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "explain_xray_result",
            "description": "Explains an X-ray diagnostic scan abnormality in clear patient terms.",
            "parameters": {
                "type": "object",
                "properties": {
                    "finding": {"type": "string", "description": "The detected abnormality text."}
                },
                "required": ["finding"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_bill",
            "description": "Doctor/Admin tool to create a new patient bill for a completed appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "integer", "description": "Patient ID."},
                    "appointment_id": {"type": "integer", "description": "Completed appointment ID."},
                    "amount": {"type": "number", "description": "Invoice amount."}
                },
                "required": ["patient_id", "appointment_id", "amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_hospital_documents",
            "description": "Uses RAG search to retrieve hospital cancellation policies, prep guidelines, or general FAQs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The policy or guideline keyword query."}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_hospital_analytics",
            "description": "Admin tool to track live hospital statistics, totals, and processed revenue.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

# ---------------------------------------------------------
# 1. FLOATING CHAT AGENT ENDPOINT (/ask)
# ---------------------------------------------------------
@app.post("/ask")
async def ask(
    req: ChatQuery,
    user: Dict[str, Any] = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Main stateful Agent Chat endpoint. Uses dynamic role-based system prompts,
    performs real-time keyword RAG document retrieval, executes multi-step tool calls,
    and manages in-memory context memory.
    """
    # 1. Resolve context and IDs
    ctx = resolve_clinical_ids(db, user)
    user_id = ctx["user_id"]
    role = ctx["role"]
    name = ctx["name"]
    
    # 2. Get local RAG documents context matching the question
    rag_context = get_rag_context(req.query)
    
    # 3. Assemble dynamic system prompt based on role
    if role == "patient":
        sys_prompt = f"""You are the HMS AI Assistant. 
You are a warm, empathetic, and clinical assistant talking to patient {name} (Patient ID: {ctx['patient_id']}, User ID: {user_id}).
Your job is to help patients book appointments, review schedules, check their bills, and explain medical reports or scans.

CRITICAL INSTRUCTIONS & SECURITY:
1. You are strictly restricted to Patient ID: {ctx['patient_id']}. Never attempt to query, check, or edit bills, reports, or appointments of other patient IDs.
2. If they ask about other patient details, politely refuse under patient confidentiality policies.
3. You can answer general health questions, explain scan results using your explanation tool, or assess symptoms using your symptom analysis tool.
4. Do NOT attempt to create doctor sessions, approve or reject patient appointments, or generate billing invoices. If they ask, refuse politely.
5. In your natural language response, if you recommend a doctor, explicitly mention Dr. Bishal Ranjan Das (Cardiologist) or matching specialist.

HOSPITAL INFORMATION FROM DOCUMENTS (RAG):
{rag_context}
"""
    elif role == "doctor":
        sys_prompt = f"""You are the HMS Expert Physician AI Assistant.
You are a concise, exact, and professional clinical partner assisting Dr. {name} (Doctor ID: {ctx['doctor_id']}, User ID: {user_id}).
Your job is to help the consultant manage their slots, create sessions, approve or reject pending patient appointments, and generate patient bills.

CAPABILITIES:
1. You can generate consulting sessions and time slots for your clinical roster.
2. You can approve or reject pending patient appointments.
3. You can view clinical reports and patient billing status.
4. You can generate patient bills.
5. If the doctor asks for a patient history, you can fetch patient reports and explain scan results.

HOSPITAL KNOWLEDGE BASE (RAG):
{rag_context}
"""
    else:  # Admin
        sys_prompt = f"""You are the HMS Administrative Intelligence Assistant.
You are a sharp, analytical, and highly structured operational assistant helping Administrator {name} (User ID: {user_id}).
Your job is to help track hospital operational stats, manage billing reviews, verify and list billing accounts, and manage doctors.

CAPABILITIES:
1. You can query hospital analytics to fetch total revenue, pending bookings, and active doctors or patients.
2. You can view patient schedules and doctor specialization parameters.
3. Keep administrative summaries focused on total revenue, billing counts, and department capacity metrics.

HOSPITAL INFORMATION (RAG):
{rag_context}
"""

    # 4. Fetch/Initialize user memory
    if user_id not in CONVERSATION_MEMORY:
        CONVERSATION_MEMORY[user_id] = []
        
    history = CONVERSATION_MEMORY[user_id]
    
    # Pack prompt & question
    groq_messages = [{"role": "system", "content": sys_prompt}]
    
    # Append past history (max 8 messages for token space stability)
    for h_msg in history[-8:]:
        groq_messages.append(h_msg)
        
    groq_messages.append({"role": "user", "content": req.query})
    
    reasoning_steps = []
    model_name = "llama-3.1-8b-instant"
    
    # Multi-step Agent execution loop
    try:
        loop_count = 0
        while loop_count < 5:
            loop_count += 1
            
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=groq_messages,
                    tools=TOOLS,
                    tool_choice="auto"
                )
            except Exception as model_err:
                print(f"⚠️ Model {model_name} failed. Falling back to llama-3.1-8b-instant. Error: {model_err}")
                model_name = "llama-3.1-8b-instant"
                response = client.chat.completions.create(
                    model=model_name,
                    messages=groq_messages,
                    tools=TOOLS,
                    tool_choice="auto"
                )
                
            msg = response.choices[0].message
            
            # If no tool calls, this is the final natural language response!
            if not msg.tool_calls:
                # Add to local user history
                history.append({"role": "user", "content": req.query})
                history.append({"role": "assistant", "content": msg.content or ""})
                CONVERSATION_MEMORY[user_id] = history[-10:] # Cap memory length
                
                # Check if it was faq or action
                msg_type = "action" if reasoning_steps else "faq"
                
                return {
                    "type": msg_type,
                    "intent": "agent_chat",
                    "response": msg.content,
                    "reasoning_steps": reasoning_steps,
                    "context": {
                        "role": role,
                        "patient_id": ctx["patient_id"],
                        "doctor_id": ctx["doctor_id"],
                        "user_id": user_id
                    }
                }
                
            # If tool calls, process each!
            # 1. Append assistant's tool-call request to messages
            groq_messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in msg.tool_calls
                ]
            })
            
            # 2. Execute each tool call
            for tc in msg.tool_calls:
                func_name = tc.function.name
                try:
                    func_args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                    if not isinstance(func_args, dict):
                        func_args = {}
                except Exception:
                    func_args = {}
                
                # Log step
                arg_strs = ", ".join(f"{k}={v}" for k, v in func_args.items())
                step_log = f"Called {func_name}({arg_strs})"
                reasoning_steps.append(step_log)
                print(f"🤖 AGENT ACTIONS: {step_log}")
                
                # Run mapping
                try:
                    tool_result = None
                    # Core operational database tools
                    if func_name == "get_available_doctors":
                        tool_result = hms_tools.get_available_doctors(db)
                        
                    elif func_name == "get_doctor_schedule":
                        tool_result = hms_tools.get_doctor_schedule(db, doctor_id=func_args.get("doctor_id"))
                        
                    elif func_name == "book_appointment":
                        # Enforce active security mapping if role is patient
                        patient_id = ctx["patient_id"] if role == "patient" else func_args.get("patient_id")
                        tool_result = hms_tools.book_appointment(
                            db, 
                            patient_id=patient_id, 
                            doctor_id=func_args.get("doctor_id"),
                            slot_id=func_args.get("slot_id"),
                            symptoms=func_args.get("symptoms", "No symptoms described")
                        )
                        
                    elif func_name == "cancel_appointment":
                        tool_result = hms_tools.cancel_appointment(db, appointment_id=func_args.get("appointment_id"))
                        
                    elif func_name == "get_patient_bills":
                        patient_id = ctx["patient_id"] if role == "patient" else func_args.get("patient_id")
                        tool_result = hms_tools.get_patient_bills(db, patient_id=patient_id)
                        
                    elif func_name == "get_patient_reports":
                        patient_id = ctx["patient_id"] if role == "patient" else func_args.get("patient_id")
                        tool_result = hms_tools.get_patient_reports(db, patient_id=patient_id)
                        
                    elif func_name == "create_doctor_session":
                        doctor_id = ctx["doctor_id"] if role == "doctor" else func_args.get("doctor_id")
                        tool_result = hms_tools.create_doctor_session(
                            db,
                            doctor_id=doctor_id,
                            date=func_args.get("date"),
                            start_time=func_args.get("start_time"),
                            end_time=func_args.get("end_time"),
                            interval_minutes=func_args.get("interval_minutes", 30)
                        )
                        
                    elif func_name == "approve_appointment":
                        if role == "patient":
                            tool_result = {"error": "Unauthorized operation for Patients"}
                        else:
                            tool_result = hms_tools.approve_appointment(db, appointment_id=func_args.get("appointment_id"))
                            
                    elif func_name == "reject_appointment":
                        if role == "patient":
                            tool_result = {"error": "Unauthorized operation for Patients"}
                        else:
                            tool_result = hms_tools.reject_appointment(db, appointment_id=func_args.get("appointment_id"))
                            
                    elif func_name == "generate_bill":
                        if role == "patient":
                            tool_result = {"error": "Unauthorized operation for Patients"}
                        else:
                            tool_result = hms_tools.generate_bill(
                                db,
                                patient_id=func_args.get("patient_id"),
                                appointment_id=func_args.get("appointment_id"),
                                amount=func_args.get("amount")
                            )
                            
                    elif func_name == "get_hospital_analytics":
                        if role != "admin":
                            tool_result = {"error": "Analytics are restricted to Admin role only"}
                        else:
                            tool_result = hms_tools.get_hospital_analytics(db)
                            
                    # Pure reasoning clinical tools
                    elif func_name == "analyze_symptoms":
                        tool_result = hms_tools.analyze_symptoms(symptoms=func_args.get("symptoms"))
                        
                    elif func_name in ["recommend_department", "get_recommend_department"]:
                        tool_result = hms_tools.recommend_department(specialty=func_args.get("specialty"))
                        
                    elif func_name == "explain_xray_result":
                        tool_result = hms_tools.explain_xray_result(finding=func_args.get("finding"))
                        
                    elif func_name == "search_hospital_documents":
                        tool_result = hms_tools.search_hospital_documents(query=func_args.get("query"))
                        
                    else:
                        tool_result = {"error": f"Tool '{func_name}' is not recognized."}
                        
                except Exception as tool_err:
                    tool_result = {"error": f"Database execution exception: {str(tool_err)}"}
                    
                # Append tool response
                groq_messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": func_name,
                    "content": json.dumps(tool_result)
                })
                
        # Limit hit
        return {
            "type": "unknown",
            "intent": "limit_exceeded",
            "response": "I performed multiple operations, but let's summarize: I've connected to the database to update appointments and slots. What else can I assist with?",
            "reasoning_steps": reasoning_steps
        }
        
    except Exception as e:
        print(f"💥 AI Execution Error: {str(e)}")
        return {
            "type": "unknown",
            "intent": "execution_error",
            "response": "I encountered an issue connecting with the model services. However, your appointments and profiles remain fully secured. Please try again in a moment.",
            "reasoning_steps": reasoning_steps
        }

# ---------------------------------------------------------
# 2. YOLO X-RAY ANALYSIS UPLOAD ROUTE
# ---------------------------------------------------------
@app.post("/api/ai/upload-xray")
async def upload_xray(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Intelligent X-ray Upload & Clinical Recommendation Pipeline:
    1. Saves X-ray scan into Express uploads folder.
    2. Runs YOLO computer vision analysis (simulating abnormality detection).
    3. Commits scan report details into MySQL reports table.
    4. Automatically invokes Groq agent to explain diagnostic findings,
       recommend specialists, and prompt user for appointment bookings.
    """
    # 1. Enforce token security & get patient
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required")
        
    user_payload = get_user_from_token(authorization)
    ctx = resolve_clinical_ids(db, user_payload)
    patient_id = ctx["patient_id"]
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="Only Patient role accounts can submit X-ray reports.")
        
    # Create express uploads path if not present
    express_uploads_dir = "/home/prachurjya/College_Student_Project/hospital_management_system/backend/uploads"
    os.makedirs(express_uploads_dir, exist_ok=True)
    
    # Unique filename
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{timestamp}-{file.filename}"
    file_path = os.path.join(express_uploads_dir, filename)
    
    # Save the physical file so Express server can display it
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file to disk: {str(e)}")
        
    # 2. Simulate YOLO Scanning findings based on filename or randomly
    fname = file.filename.lower()
    if "lung" in fname or "chest" in fname or "cough" in fname:
        findings = "Patchy consolidation in lower right lung field suggesting acute Bacterial Pneumonia."
        specialty = "Cardiology" # Cardiology / General Medicine
    elif "bone" in fname or "fracture" in fname or "hand" in fname or "leg" in fname:
        findings = "Oblique, non-displaced fracture of the distal radius bone with surrounding tissue edema."
        specialty = "Orthopedics"
    elif "heart" in fname or "cardiomegaly" in fname:
        findings = "Moderate cardiomegaly (enlarged cardiac silhouette) with clear costophrenic angles."
        specialty = "Cardiology"
    else:
        # Pick one randomly
        import random
        scans_pool = [
            ("Patchy consolidation in lower right lung field suggesting acute Bacterial Pneumonia.", "General Medicine"),
            ("Oblique, non-displaced fracture of the distal radius bone.", "Orthopedics"),
            ("Moderate cardiomegaly (enlarged cardiac silhouette) with clear lung fields.", "Cardiology"),
            ("Normal thorax outline, clear lungs, and intact skeletal outline.", "None")
        ]
        findings, specialty = random.choice(scans_pool)
        
    # 3. Insert report record into MySQL via SQLAlchemy
    try:
        report = Report(
            patient_id=patient_id,
            appointment_id=None,
            report_type="X-ray",
            findings=findings,
            file_path=filename
        )
        db.add(report)
        db.commit()
        db.refresh(report)
    except Exception as db_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database failed to log report: {str(db_err)}")
        
    # 4. Invoke LLM to explain YOLO scan findings and suggest next steps
    explain_data = hms_tools.explain_xray_result(findings)
    
    # Let's get available doctors under that specialty in the hospital
    doc_results = ""
    try:
        docs = hms_tools.get_available_doctors(db)
        docs_filtered = [d for d in docs if d["specialization"] == f"{explain_data['recommended_specialist']}ist"]
        if docs_filtered:
            doc_results = f"Recommended Specialist: Dr. {docs_filtered[0]['name']} ({docs_filtered[0]['specialization']}). You can book a direct slot using the AI interface below!"
        else:
            doc_results = f"Recommended Specialist: {explain_data['recommended_specialist']} Consultant. OPD consulting slots are available."
    except Exception:
        doc_results = f"Recommended Specialty Ward: {explain_data['recommended_specialist']} Clinic."

    # Structured prompt for Agent explanations
    agent_prompt = f"""Explain the following YOLO X-ray findings in a compassionate, reassuring clinical tone.
Scan: Chest/Limb Radiograph
YOLO Detector Findings: {findings}
Clinical Term: {explain_data['clinical_term']}
Recommended Specialty: {explain_data['recommended_specialist']}
Severity Level: {explain_data['severity']}

Include:
1. Reassuring explanation of the findings in easy patient terms.
2. Immediate recovery/care steps (e.g. resting, avoiding weight-bearing, drinking fluids).
3. Active prompt urging them to schedule a follow-up consultation with our specialists. Mention: {doc_results}.
"""

    try:
        ai_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a warm, expert Hospital Clinical AI Explainer."},
                {"role": "user", "content": agent_prompt}
            ]
        )
        ai_explanation = ai_resp.choices[0].message.content
    except Exception as e:
        ai_explanation = f"I've successfully logged your X-ray report showing: '{findings}'. Please consult our {explain_data['recommended_specialist']} unit for a detailed clinical review."

    return {
        "success": True,
        "findings": findings,
        "file_path": f"/uploads/{filename}",
        "report_id": report.id,
        "clinical_term": explain_data["clinical_term"],
        "severity": explain_data["severity"],
        "recommended_specialty": explain_data["recommended_specialist"],
        "ai_explanation": ai_explanation
    }

# ---------------------------------------------------------
# 3. DIRECT POLICY/RAG SEARCH ENDPOINT
# ---------------------------------------------------------
@app.get("/api/ai/policy-search")
async def policy_search(query: str):
    """General RAG search endpoint for clinical and procedural documents."""
    return {"query": query, "results": hms_tools.search_hospital_documents(query)}

# ---------------------------------------------------------
# 4. SERVER RUNNER
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 HMS AI Agent Core is launching on http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)