import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Bot, User, CornerDownLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Notice, BloodDonor, Note, Assignment, Department, Teacher, QuestionPaper, CollegeInformation } from "../types";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AiAssistantProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  // Context arrays passed to compile the dynamic search model
  notices: Notice[];
  donors: BloodDonor[];
  notes: Note[];
  assignments: Assignment[];
  departments: Department[];
  faculty: Teacher[];
  questionPapers: QuestionPaper[];
  collegeInformation: CollegeInformation[];
}

export default function AiAssistant({
  initialQuery = "",
  onClearInitialQuery,
  notices,
  donors,
  notes,
  assignments,
  departments,
  faculty,
  questionPapers,
  collegeInformation,
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "👋 Hello! I am CampusAI, your direct voice and knowledge assistant for Govt Polytechnic College Kaduthuruthy.\n\nAsk me anything about board exams, class notes, assignment deadlines, blood doors, or specific syllabus materials!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isListeningSimulated, setIsListeningSimulated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synth
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Handle parent query trigger (e.g. from Home page quick questions)
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
      handleSend(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech helper
  const speakText = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    synthRef.current.cancel(); // Stop current speech
    
    // Clean markdown before speaking
    const cleanText = text.replace(/[#*`_-]/g, "").substring(0, 200); // speak first 200 chars for punchy voice output
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Compile campus database summary for Gemini scope using intelligent dynamic search
  const compileContextSummary = (userQuery: string): string => {
    try {
      const q = userQuery.toLowerCase();
      const matchedParts: string[] = [];
      const matchCategories: string[] = [];
      
      // A. DEPARTMENT CHECK matches based on code, name, or overview
      const deptMatches = departments.filter(d => 
        q.includes(d.id.toLowerCase()) || 
        q.includes(d.code.toLowerCase()) || 
        q.includes(d.name.toLowerCase()) ||
        (d.hodName && q.includes(d.hodName.toLowerCase()))
      );
      if (deptMatches.length > 0) {
        matchCategories.push("Departments");
        matchedParts.push("MATCHED DEPARTMENTS:");
        deptMatches.forEach(d => {
          matchedParts.push(`- Department Name: ${d.name} (${d.code})`);
          matchedParts.push(`  Overview: ${d.overview}`);
          matchedParts.push(`  Head of Department (HOD): ${d.hodName} (Email: ${d.hodEmail})`);
          matchedParts.push(`  Metrics: ${d.studentCount} students enrolled, ${d.facultyCount} active faculty teachers.`);
        });
      }

      // B. FACULTY/TEACHER CHECK matches based on teacher name, designation, email, or telephone
      const facultyMatches = faculty.filter(t => 
        q.includes(t.name.toLowerCase()) || 
        q.includes(t.designation.toLowerCase()) || 
        q.includes(t.email.toLowerCase()) || 
        (t.phone && q.includes(t.phone)) ||
        (t.id && q.includes(t.id.toLowerCase()))
      );
      if (facultyMatches.length > 0) {
        matchCategories.push("Faculty");
        matchedParts.push("\nMATCHED FACULTY & TEACHERS:");
        facultyMatches.forEach(t => {
          matchedParts.push(`- ${t.name} (${t.designation}) in Department: ${t.departmentId}. Email: ${t.email}, Contact: ${t.phone || 'N/A'}`);
        });
      }

      // C. LATEST NOTICES CHECK matches based on titles, dates, categories, contents
      const noticeMatches = notices.filter(n => 
        q.includes(n.title.toLowerCase()) || 
        q.includes(n.content.toLowerCase()) || 
        q.includes(n.category.toLowerCase()) ||
        q.includes(n.date)
      );
      if (noticeMatches.length > 0) {
        matchCategories.push("Notices");
        matchedParts.push("\nMATCHED OFFICIAL BOARD NOTICES:");
        noticeMatches.slice(0, 3).forEach(n => {
          matchedParts.push(`- [Date: ${n.date}] [Category: ${n.category}] Title: ${n.title}`);
          matchedParts.push(`  Announcement: ${n.content}`);
        });
      }

      // D. DOWNLOADABLE SYLLABUS NOTES CHECK matches based on title, subject, semester, department
      const noteMatches = notes.filter(n => 
        q.includes(n.title.toLowerCase()) || 
        q.includes(n.subject.toLowerCase()) || 
        q.includes(`s${n.semester}`) || 
        q.includes(`sem ${n.semester}`) || 
        q.includes(`sem-${n.semester}`) || 
        q.includes(`semester ${n.semester}`) ||
        q.includes(n.departmentId.toLowerCase())
      );
      if (noteMatches.length > 0) {
        matchCategories.push("Lecture Notes");
        matchedParts.push("\nMATCHED ACADEMIC SYLLABUS NOTES:");
        noteMatches.forEach(n => {
          matchedParts.push(`- Notes Title: "${n.title}" for Course Subject: ${n.subject} (Sem ${n.semester}, ${n.departmentId} Engineering)`);
          matchedParts.push(`  Shared Filename: ${n.fileName}, Direct Access download URL: ${n.fileUrl}`);
        });
      }

      // E. EXAM QUESTION PAPERS CHECK matches based on title, subject, semester, year, department
      const paperMatches = questionPapers.filter(p => 
        q.includes(p.title.toLowerCase()) || 
        q.includes(p.subject.toLowerCase()) || 
        q.includes(`s${p.semester}`) || 
        q.includes(`sem ${p.semester}`) || 
        q.includes(`sem-${p.semester}`) || 
        q.includes(`semester ${p.semester}`) ||
        q.includes(p.departmentId.toLowerCase()) ||
        q.includes(p.year)
      );
      if (paperMatches.length > 0) {
        matchCategories.push("Previous Question Papers");
        matchedParts.push("\nMATCHED BOARD QUESTION PAPERS:");
        paperMatches.forEach(p => {
          matchedParts.push(`- Prev Exam Paper: "${p.title}" for Subject: ${p.subject} (Year: ${p.year}, Sem ${p.semester}, ${p.departmentId} branch)`);
          matchedParts.push(`  Filename: ${p.fileName}, Board download URL: ${p.fileUrl}`);
        });
      }

      // F. ASSIGNMENTS CHECK matches based on title, subject, description, semester
      const assignMatches = assignments.filter(a => 
        q.includes(a.title.toLowerCase()) || 
        q.includes(a.subject.toLowerCase()) || 
        q.includes(a.description.toLowerCase()) || 
        q.includes(`s${a.semester}`) || 
        q.includes(`sem ${a.semester}`) || 
        q.includes(`sem-${a.semester}`) || 
        q.includes(`semester ${a.semester}`)
      );
      if (assignMatches.length > 0) {
        matchCategories.push("Assignments");
        matchedParts.push("\nMATCHED HOMEWORK & LAB ASSIGNMENTS:");
        assignMatches.forEach(a => {
          matchedParts.push(`- Assignment Task: "${a.title}" for Subject: ${a.subject} (Sem ${a.semester}, ${a.departmentId} department)`);
          matchedParts.push(`  Due Date: ${a.dueDate}. Details/Requirements: ${a.description}`);
        });
      }

      // G. BLOOD DONORS CHECK matches based on name, blood group, place, phone
      const bloodGroupsFound = ["o+", "o-", "a+", "a-", "b+", "b-", "ab+", "ab-"].filter(g => q.includes(g));
      const donorMatches = donors.filter(d => {
        const matchesGroup = bloodGroupsFound.some(bg => d.bloodGroup.toLowerCase() === bg);
        const matchesSearchTerm = q.includes("donor") || q.includes("blood") || q.includes(d.name.toLowerCase()) || q.includes(d.place.toLowerCase());
        return matchesGroup || (q.includes(d.bloodGroup.toLowerCase()) && matchesSearchTerm) || (d.name && q.includes(d.name.toLowerCase()));
      });
      if (donorMatches.length > 0) {
        matchCategories.push("Blood Bank");
        matchedParts.push("\nMATCHED BLOOD BANK DONORS:");
        donorMatches.forEach(d => {
          matchedParts.push(`- Volunteer Registered: ${d.name} (Blood Group: ${d.bloodGroup})`);
          matchedParts.push(`  Current availability: ${d.isAvailable ? 'AVAILABLE (Contact immediately)' : 'NOT AVAILABLE'}`);
          matchedParts.push(`  Mobile Phone Contact: ${d.phone} (Semester ${d.semester} in department: ${d.departmentId}, Place: ${d.place})`);
        });
      }

      // H. OFFICIAL COLLEGE INFORMATION CHECK (History, Mission, principal, address etc.)
      const infoMatches = collegeInformation.filter(info => 
        q.includes(info.id.toLowerCase()) || 
        q.includes(info.title.toLowerCase()) || 
        q.includes(info.content.toLowerCase()) ||
        (info.id === "principal" && q.includes("susha")) || 
        (info.id === "contact" && (q.includes("phone") || q.includes("email") || q.includes("contact") || q.includes("address") || q.includes("hotline"))) ||
        (info.id === "address" && (q.includes("where") || q.includes("route") || q.includes("station") || q.includes("location") || q.includes("kottayam") || q.includes("muttuchira")))
      );
      if (infoMatches.length > 0) {
        matchCategories.push("College Information");
        matchedParts.push("\nMATCHED OFFICIAL COLLEGE DIRECTORY FACTS:");
        infoMatches.forEach(info => {
          matchedParts.push(`- ${info.title}: ${info.content}`);
        });
      }

      // I. FALLBACK GENERAL CONTEXT if search matched absolutely nothing (so we still give solid grounding context)
      if (matchedParts.length === 0) {
        matchedParts.push("GENERAL COLLEGE DIRECTORY OVERVIEW (FALLBACK GROUNDING):");
        collegeInformation.forEach(info => {
          if (["overview", "principal", "contact", "address"].includes(info.id)) {
            matchedParts.push(`- ${info.title}: ${info.content}`);
          }
        });
      }

      const categoryHint = matchCategories.length > 0 
        ? `[RAG matched modules search: ${matchCategories.join(", ")}]` 
        : `[RAG defaults loaded]`;
      
      matchedParts.unshift(categoryHint);
      return matchedParts.join("\n");

    } catch (err) {
      console.error("Context summary compilation error:", err);
      return "Default: Govt Polytechnic College Kaduthuruthy, Kerala. Offers Diploma in Computer, Hardware, and Electronics branches. Principal is Smt. Susha S.";
    }
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    setApiKeyError(null);
    if (!customMessage) {
      setInput("");
    }

    // Append user message
    const updatedMessages = [...messages, { role: "user" as const, text: textToSend }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const contextSummary = compileContextSummary(textToSend);

    // Map history for API
    const chatHistory = updatedMessages.slice(1, -1).map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend, 
          contextSummary,
          chatHistory
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "API_KEY_MISSING") {
          setApiKeyError(data.message || "Your server is missing the GEMINI_API_KEY environment variable. Add it in AI Studio settings.");
        } else {
          setApiKeyError(data.message || "An error occurred. Check browser console logs or database rules.");
        }
        setIsLoading(false);
        return;
      }

      const modelReply = data.reply;
      setMessages(prev => [...prev, { role: "model", text: modelReply }]);
      
      // Auto-read response if voice enabled
      if (voiceEnabled) {
        speakText(modelReply);
      }
    } catch (err: any) {
      console.error(err);
      setApiKeyError("Connection failure. Make sure the Node dev server is running on Port 3000.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate voice listening input for voice button
  const toggleListeningSimulation = () => {
    if (isListeningSimulated) {
      setIsListeningSimulated(false);
      return;
    }

    setIsListeningSimulated(true);
    stopSpeaking();

    // After 3.5 seconds, feed a sample voice command
    setTimeout(() => {
      setIsListeningSimulated(false);
      const voicePrompts = [
        "Find O+ blood donors",
        "Show latest notices for examinations",
        "Who is the HOD of Computer engineering?",
        "Show assignments",
        "Explain S5 notes download keys",
        "What is the capital of India?" // testing out-of-scope filter
      ];
      const randomPrompt = voicePrompts[Math.floor(Math.random() * voicePrompts.length)];
      setInput(randomPrompt);
      handleSend(randomPrompt);
    }, 3500);
  };

  const sampleQuestions = [
    "Show latest notices",
    "Find O+ blood donors",
    "Show S5 notes",
    "Show assignments",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[650px] overflow-hidden rounded-[28px] border border-blue-50 bg-slate-50/50 shadow-xs">
      
      {/* Bot Chat Header */}
      <div className="flex items-center justify-between border-b border-blue-50 bg-white px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-100">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h2 className="text-md font-bold text-slate-800 flex items-center gap-1">
              CampusAI Assistant
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Strictly configured for GPC Kaduthuruthy</p>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 transition"
              title="Stop reading out loud"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Stop Voice</span>
            </button>
          )}

          <button
            onClick={() => {
              const newVal = !voiceEnabled;
              setVoiceEnabled(newVal);
              if (!newVal) stopSpeaking();
            }}
            className={`p-2.5 rounded-xl border transition ${
              voiceEnabled 
                ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title={voiceEnabled ? "Mute automatic voice response" : "Enable automatic voice answers"}
          >
            {voiceEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[140px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar block */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                m.role === "user"
                  ? "bg-slate-200 text-slate-700"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble block */}
            <div
              className={`rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-xs"
              } whitespace-pre-line`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 animate-bounce">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-white p-4 text-sm border border-slate-100 rounded-tl-none shadow-xs">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* API Warning */}
        {apiKeyError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <p className="leading-snug">{apiKeyError}</p>
          </div>
        )}

        {/* Mic waveform simulation */}
        {isListeningSimulated && (
          <div className="flex flex-col items-center justify-center p-6 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center space-x-1">
              <div className="w-1 bg-blue-500 h-6 rounded-full animate-pulse" />
              <div className="w-1 bg-indigo-500 h-10 rounded-full animate-bounce [animation-delay:100ms]" />
              <div className="w-1 bg-blue-600 h-14 rounded-full animate-bounce [animation-delay:200ms]" />
              <div className="w-1 bg-indigo-600 h-11 rounded-full animate-bounce [animation-delay:300ms]" />
              <div className="w-1 bg-blue-500 h-5 rounded-full animate-pulse" />
            </div>
            <p className="text-xs font-bold text-blue-700">CampusAI is listening...</p>
            <p className="text-[10px] text-slate-500 text-center">Simulating voice capture based on educational models. Release to analyze.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions footer */}
      {messages.length === 1 && (
        <div className="bg-white/50 px-6 py-3 border-t border-blue-50 flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Suggested Questions:</span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(sq);
                handleSend(sq);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 px-3 py-1.5 rounded-lg bg-white transition active:scale-95 shadow-2xs"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center space-x-2"
        >
          {/* Voice button */}
          <button
            type="button"
            onClick={toggleListeningSimulation}
            className={`p-3 rounded-2xl border transition active:scale-90 ${
              isListeningSimulated
                ? "bg-red-500 border-red-500 text-white animate-pulse shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title="Simulate Voice Input / Smart Mic"
          >
            {isListeningSimulated ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListeningSimulated
                ? "Listening... Speak now or type..."
                : "Ask CampusAI: exam dates, blood donors, S5 web technology notes..."
            }
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 pr-14 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            disabled={isLoading || isListeningSimulated}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isListeningSimulated}
            className="absolute right-2 px-3 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-40 transition active:scale-95"
            title="Send voice query"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2.5 font-medium">
          CampusAI is powered by Gemini 2.5 and strictly bounded to college catalogs. No personal or general data is retained.
        </p>
      </div>

    </div>
  );
}
