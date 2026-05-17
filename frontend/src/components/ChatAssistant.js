import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, X, Bot, User, Minimize2, Maximize2, 
  Paperclip, Cpu, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Activity
} from 'lucide-react';
import AppIcon from './AppIcon';
import axios from 'axios';
import './ChatAssistant.css';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  // Decoded identity from local token
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('patient');
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Decode token to establish user context and dynamic banners
  const decodeToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
        setUserRole(payload.role || 'patient');
        return payload;
      }
    } catch (e) {
      console.warn("🔒 Non-token login or decoding warning:", e);
    }
    return null;
  };

  // Decode identity on mount and whenever open state changes
  useEffect(() => {
    decodeToken();
  }, [isOpen]);

  // Listen to open-ai-chat window event to open/maximize chat widget
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  // Set default initial greeting based on dynamic role
  useEffect(() => {
    if (messages.length === 0) {
      let welcomeText = "Hello! I am your HMS AI Assistant. How can I help you today?";
      const tokenPayload = decodeToken();
      
      if (tokenPayload) {
        if (tokenPayload.role === 'doctor') {
          welcomeText = "Welcome Dr. Consultant! I am your Clinical partner. I can help manage your sessions, create time slots, approve appointments, and write patient prescriptions.";
        } else if (tokenPayload.role === 'admin') {
          welcomeText = "Operations Assistant Online. Administrator, I can check live database occupancy, compute total hospital revenue, verify bills, and list doctor profiles.";
        } else {
          welcomeText = "Hello! I am your Clinical Assistant. I can help book your doctor sessions, query your bills, explain your X-rays, or assess symptoms. What can I do for you today?";
        }
      }
      
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: welcomeText,
          timestamp: new Date()
        }
      ]);
    }
  }, [messages, userRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isUploading]);

  // 2. Chat messaging query handler
  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: "Please log in to your patient, doctor, or admin dashboard to chat with the AI assistant.",
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      // Direct call to FastAPI backend on port 8000
      const res = await axios.post(
        'http://localhost:8000/ask',
        { query: textToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: res.data.response,
        timestamp: new Date(),
        reasoning_steps: res.data.reasoning_steps || [],
        intent: res.data.intent
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("❌ AI Query Error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "I experienced a connection lag with the AI services. However, your records remain completely safe. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 3. X-ray uploader scanning pipeline
  const handleXraySelect = () => {
    fileInputRef.current?.click();
  };

  const handleXrayUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to upload scan reports.");
      return;
    }

    // Append X-ray preview image into the chat history immediately
    const tempUrl = URL.createObjectURL(file);
    const userImageMessage = {
      id: Date.now(),
      type: 'user',
      text: `Uploading X-ray: ${file.name}`,
      file_path: tempUrl,
      isXrayUpload: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userImageMessage]);
    setIsUploading(true);
    setUploadProgress("Pulsing neural scanning array...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // POST direct to FastAPI port 8000 uploader
      const res = await axios.post(
        'http://localhost:8000/api/ai/upload-xray',
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
          }
        }
      );

      const botXrayMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: res.data.ai_explanation,
        findings: res.data.findings,
        clinical_term: res.data.clinical_term,
        recommended_specialty: res.data.recommended_specialty,
        severity: res.data.severity,
        file_path: `http://localhost:5000${res.data.file_path}`, // Points to express backend upload path
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botXrayMessage]);
    } catch (err) {
      console.error("❌ X-ray Upload Error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "The YOLO computer vision engine failed to parse this image. Ensure it is a valid chest or skeletal radiograph.",
        timestamp: new Date()
      }]);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 4. Quick book follow-up button handler
  const triggerFollowupBooking = (specialty) => {
    const promptText = `I want to book an appointment with a specialist in ${specialty} for my X-ray results.`;
    handleSend(null, promptText);
  };

  // 5. Advanced Clinical Response Formatter (Strips raw JSON/XML, presents beautiful lists)
  const formatMessageText = (text) => {
    if (!text) return '';

    // 1. Strip XML function/tool call tags like <function=...>...</function>
    let cleaned = text.replace(/<function[^>]*>([\s\S]*?)<\/function>/g, '');
    cleaned = cleaned.replace(/<tool_call[^>]*>([\s\S]*?)<\/tool_call>/g, '');
    cleaned = cleaned.replace(/<[^>]+>/g, ''); // Remove general XML tags

    // 2. Parse and format Markdown JSON Code Blocks
    const codeBlockRegex = /```(?:json)?([\s\S]*?)```/g;
    let match;
    let textSegments = [];
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(cleaned)) !== null) {
      if (match.index > lastIndex) {
        textSegments.push({
          type: 'text',
          content: cleaned.substring(lastIndex, match.index)
        });
      }

      const codeContent = match[1].trim();
      try {
        const parsed = JSON.parse(codeContent);
        textSegments.push({
          type: 'parsed-data',
          content: parsed
        });
      } catch (e) {
        if (!codeContent.includes("Traceback") && !codeContent.includes("Error")) {
          textSegments.push({
            type: 'text',
            content: codeContent
          });
        }
      }
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < cleaned.length) {
      textSegments.push({
        type: 'text',
        content: cleaned.substring(lastIndex)
      });
    }

    if (textSegments.length === 0) {
      return <div style={{ whiteSpace: 'pre-line' }}>{cleaned}</div>;
    }

    return (
      <div className="formatted-message-content">
        {textSegments.map((seg, idx) => {
          if (seg.type === 'text') {
            return <div key={idx} style={{ whiteSpace: 'pre-line', margin: '4px 0' }}>{seg.content}</div>;
          }

          const data = seg.content;
          if (Array.isArray(data)) {
            if (data.length === 0) {
              return <div key={idx} className="text-muted small my-2">No active records found.</div>;
            }

            // Doctors List
            if (data[0].hasOwnProperty('specialization') || data[0].hasOwnProperty('specialty') || data[0].hasOwnProperty('doctor_id')) {
              return (
                <div key={idx} className="my-2 p-3 rounded bg-light border border-light-subtle shadow-sm" style={{ color: '#334155' }}>
                  <div className="fw-bold small text-primary mb-2">👨‍⚕️ Available Specialists:</div>
                  <ul className="list-unstyled mb-0 ps-1" style={{ fontSize: '13px' }}>
                    {data.map((doc, dIdx) => (
                      <li key={dIdx} className="mb-2">
                        <strong>{doc.name || `Dr. #${doc.doctor_id}`}</strong> {doc.specialization || doc.specialty ? `- ${doc.specialization || doc.specialty}` : ''}
                        {doc.status && <span className="badge bg-success ms-2">{doc.status}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            // Schedule/Slots List
            if (data[0].hasOwnProperty('slot_time') || data[0].hasOwnProperty('time') || data[0].hasOwnProperty('slot_id')) {
              return (
                <div key={idx} className="my-2 p-3 rounded bg-light border border-light-subtle shadow-sm" style={{ color: '#334155' }}>
                  <div className="fw-bold small text-primary mb-2">📅 Available Slots:</div>
                  <div className="d-flex flex-wrap gap-2" style={{ fontSize: '12px' }}>
                    {data.map((slot, sIdx) => (
                      <span key={sIdx} className="badge bg-primary p-2">
                        ⏰ {slot.slot_time || slot.time || `Slot #${slot.slot_id}`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            // Bills List
            if (data[0].hasOwnProperty('amount') || data[0].hasOwnProperty('billing_date') || data[0].hasOwnProperty('bill_id')) {
              return (
                <div key={idx} className="my-2 p-3 rounded bg-light border border-light-subtle shadow-sm" style={{ color: '#334155' }}>
                  <div className="fw-bold small text-primary mb-2">💳 Invoice Records:</div>
                  <ul className="list-unstyled mb-0 ps-1" style={{ fontSize: '13px' }}>
                    {data.map((bill, bIdx) => (
                      <li key={bIdx} className="mb-2 border-bottom border-light pb-1">
                        <strong>Invoice #{bill.id || bill.bill_id || bIdx}</strong>: ₹{bill.amount} 
                        <span className={`badge ${bill.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'} ms-2`}>
                          {bill.status ? bill.status.toUpperCase() : 'PENDING'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            // General List
            return (
              <ul key={idx} className="my-2 ps-3" style={{ fontSize: '13px', color: '#334155' }}>
                {data.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    {typeof item === 'object' ? JSON.stringify(item) : item}
                  </li>
                ))}
              </ul>
            );
          }

          if (typeof data === 'object' && data !== null) {
            if (data.hasOwnProperty('message') || data.hasOwnProperty('status')) {
              return <div key={idx} className="fw-bold small text-success my-2">✓ {data.message || data.status}</div>;
            }
            return (
              <div key={idx} className="my-2 p-3 rounded bg-light border border-light-subtle shadow-sm" style={{ fontSize: '13px', color: '#334155' }}>
                {Object.entries(data).map(([key, val]) => (
                  <div key={key} className="mb-1">
                    <span className="text-muted text-capitalize">{key.replace('_', ' ')}:</span> <strong>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</strong>
                  </div>
                ))}
              </div>
            );
          }

          return <div key={idx} style={{ whiteSpace: 'pre-line' }}>{String(data)}</div>;
        })}
      </div>
    );
  };

  // Dynamically set class names and headers based on user dashboard role
  const getRoleHeaderDetails = () => {
    switch (userRole) {
      case 'doctor':
        return {
          title: "HMS AI - Doctor Desk",
          sub: "Active Medical Partner",
          class: "doctor",
          icon: ShieldCheck
        };
      case 'admin':
        return {
          title: "HMS AI - Operations Desk",
          sub: "System Intelligence",
          class: "admin",
          icon: Cpu
        };
      default:
        return {
          title: "HMS AI Assistant",
          sub: "Clinical Assistant",
          class: "patient",
          icon: Bot
        };
    }
  };

  const headerDetails = getRoleHeaderDetails();

  if (!isOpen) {
    return (
      <button 
        className={`chat-toggle-btn shadow-lg ${headerDetails.class}`}
        onClick={() => setIsOpen(true)}
      >
        <AppIcon icon={MessageSquare} size={26} />
      </button>
    );
  }

  return (
    <div className={`chat-window shadow-2xl ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className={`chat-header d-flex align-items-center justify-content-between ${headerDetails.class}`}>
        <div className="d-flex align-items-center gap-2">
          <div className={`bot-avatar ${headerDetails.class}`}>
            <AppIcon icon={headerDetails.icon} size={20} />
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-dark">{headerDetails.title}</h6>
            <span className="online-indicator">{headerDetails.sub}</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="header-btn">
            {isMinimized ? <AppIcon icon={Maximize2} size={16} /> : <AppIcon icon={Minimize2} size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="header-btn">
            <AppIcon icon={X} size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Message List */}
          <div className="chat-messages p-3">
            {messages.map(msg => (
              <div key={msg.id} className={`message-wrapper ${msg.type} ${headerDetails.class}`}>
                <div className="message-bubble">
                  {/* If user uploaded image, show neon scanning laser overlay */}
                  {msg.isXrayUpload && msg.file_path && (
                    <div className="xray-preview-container">
                      <img src={msg.file_path} alt="Uploaded X-ray scan preview" className="xray-preview-img" />
                      <div className="scanner-overlay">
                        <div className="scanner-line"></div>
                        <div className="scanner-text">YOLO_RAD_TISSUE_SCANNING...</div>
                      </div>
                    </div>
                  )}

                  {/* Standard Text */}
                  {msg.text && formatMessageText(msg.text)}

                  {/* If bot completed scan findings, show premium neon scan card */}
                  {msg.findings && (
                    <div className="neon-findings-card mt-3">
                      <div className="d-flex align-items-center gap-2 mb-2 text-success">
                        <AppIcon icon={Activity} size={16} />
                        <span className="fw-bold small text-uppercase">YOLO Scan Results</span>
                      </div>
                      <div className="small mb-1"><span className="fw-bold">Findings:</span> {msg.findings}</div>
                      <div className="small mb-1"><span className="fw-bold">Clinical Term:</span> {msg.clinical_term}</div>
                      <div className="small mb-1"><span className="fw-bold">Severity:</span> {msg.severity}</div>
                      
                      {msg.recommended_specialty !== "None" && (
                        <button 
                          className="action-card-btn primary mt-3"
                          onClick={() => triggerFollowupBooking(msg.recommended_specialty)}
                        >
                          ✨ Quick Book Follow-up Specialist
                        </button>
                      )}
                    </div>
                  )}

                </div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {/* Simulated uploader scanner progress */}
            {isUploading && (
              <div className="message-wrapper bot">
                <div className="message-bubble border border-success bg-light text-dark p-3" style={{ borderRadius: '18px' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    <div>
                      <div className="fw-bold text-success" style={{ fontSize: '12px' }}>AI CLINICAL DISCOVERY SYSTEM</div>
                      <div className="text-muted small" style={{ fontSize: '10px' }}>{uploadProgress}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard bot loading typing indicator */}
            {loading && (
              <div className="message-wrapper bot">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Inputs */}
          <form className="chat-input-area p-2 border-top" onSubmit={(e) => handleSend(e)}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleXrayUpload}
            />
            
            {/* Show attachment paperclip tool for Patients only */}
            {userRole === 'patient' && (
              <button 
                type="button" 
                className="input-icon-btn" 
                title="Upload X-ray / Scans for AI analysis"
                onClick={handleXraySelect}
                disabled={loading || isUploading}
              >
                <AppIcon icon={Paperclip} size={20} />
              </button>
            )}

            <input 
              type="text" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || isUploading}
            />
            <button 
              type="submit" 
              className={`send-btn ${headerDetails.class}`}
              disabled={!input.trim() || loading || isUploading}
            >
              <AppIcon icon={Send} size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatAssistant;
