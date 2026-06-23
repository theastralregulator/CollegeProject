import React, { useState, useEffect, useRef } from "react";
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, getDocs, setDoc, arrayUnion
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { User as AuthUser } from "firebase/auth";
import { Message, ConversationMeta, AdminUser, AdminRole } from "../types";
import { 
  Send, Paperclip, Search, Trash2, Pin, AlertCircle, 
  Check, CheckCheck, Megaphone, User, Loader2, Star, 
  Bell, Volume2, ShieldAlert, Sparkles, X, FileText, Image as ImageIcon,
  Plus
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  student_admin: "Student Admin",
  support_admin: "Support Admin",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  student_admin: "bg-emerald-100 text-emerald-700",
  support_admin: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  super_admin: "bg-purple-100 text-purple-700",
};

interface CommunicationCenterProps {
  user: AuthUser | null;
  adminData: AdminUser | null;
}

export default function CommunicationCenter({ user, adminData }: CommunicationCenterProps) {
  const currentUser = user;
  const currentUserRole = adminData?.role || null;
  const currentUserName = adminData?.name || "Admin";
  const loading = !adminData;

  // Messaging States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  
  // File Attachment States
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Super Admin Specific States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeChatAdmin, setActiveChatAdmin] = useState<AdminUser | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [convFilter, setConvFilter] = useState<"all" | "pinned" | "important">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<"admin" | "support_admin" | "student_admin" | "all">("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 2. Super Admin: Load all conversations & users
  useEffect(() => {
    if (currentUserRole !== "super_admin") return;

    // Load admin users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list: AdminUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.role && data.uid !== currentUser?.uid) {
          list.push({
            uid: data.uid,
            email: data.email || "",
            name: data.fullName || data.name || "Admin",
            phone: data.phone || "",
            role: data.role as AdminRole,
            suspended: data.suspended ?? false,
            createdAt: data.createdAt || "",
          });
        }
      });
      setUsers(list);
    });

    // Load conversation metadata
    const unsubConv = onSnapshot(collection(db, "conversations"), (snap) => {
      const list: ConversationMeta[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          adminUid: data.adminUid,
          adminName: data.adminName,
          adminRole: data.adminRole,
          pinned: !!data.pinned,
          isImportant: !!data.isImportant,
          lastMessage: data.lastMessage || "",
          lastMessageAt: data.lastMessageAt || "",
          unreadCount: data.unreadCount || 0,
        });
      });
      list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.lastMessageAt.localeCompare(a.lastMessageAt);
      });
      setConversations(list);
    });

    return () => {
      unsubUsers();
      unsubConv();
    };
  }, [currentUserRole]);

  // 3. Load active message logs in real-time
  useEffect(() => {
    if (!currentUser || !currentUserRole) return;

    let q;
    if (currentUserRole === "super_admin") {
      if (!activeChatAdmin) {
        setMessages([]);
        return;
      }
      // Super Admin reads messages in conversation with the active user
      q = query(
        collection(db, "messages"),
        where("participantIds", "array-contains", activeChatAdmin.uid)
      );
    } else {
      // Normal admin reads messages in conversation with Super Admin
      q = query(
        collection(db, "messages"),
        where("participantIds", "array-contains", currentUser.uid)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const list: Message[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (!data.deleted) {
          list.push({
            id: d.id,
            senderId: data.senderId,
            senderRole: data.senderRole,
            receiverId: data.receiverId,
            receiverRole: data.receiverRole,
            participantIds: data.participantIds,
            message: data.message,
            createdAt: data.createdAt,
            read: !!data.read,
            deleted: !!data.deleted,
            pinned: !!data.pinned,
            attachmentUrl: data.attachmentUrl,
            attachmentName: data.attachmentName,
            attachmentType: data.attachmentType
          });
        }
      });

      // Sort in-memory to avoid requiring Firestore composite indexes
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      
      setMessages(list);

      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Mark incoming messages as read
      list.forEach((msg) => {
        if (msg.receiverId === currentUser.uid && !msg.read && msg.id) {
          updateDoc(doc(db, "messages", msg.id), { read: true });
        }
      });

      // Clear unreadCount in conversation metadata
      if (currentUserRole === "super_admin" && activeChatAdmin) {
        updateDoc(doc(db, "conversations", activeChatAdmin.uid), { unreadCount: 0 }).catch(() => {});
      } else if (currentUserRole !== "super_admin") {
        updateDoc(doc(db, "conversations", currentUser.uid), { unreadCount: 0 }).catch(() => {});
      }
    }, (err) => {
      console.error("[CommunicationCenter] messages snapshot error:", err);
    });

    return unsub;
  }, [currentUser, currentUserRole, activeChatAdmin]);

  // 4. Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUserRole) return;
    if (!inputText.trim() && !attachment) return;

    let targetReceiverId = "";
    let targetReceiverRole = "";

    if (currentUserRole === "super_admin") {
      if (!activeChatAdmin) return;
      targetReceiverId = activeChatAdmin.uid;
      targetReceiverRole = activeChatAdmin.role;
    } else {
      // Find a super admin or default to Sabin's whitelist email user
      // Since normal admins can only message Super Admin, we direct it to the whitelist admin
      // Query super_admin UID from users list or default
      try {
        const uSnap = await getDocs(query(collection(db, "users"), where("role", "==", "super_admin")));
        let superAdminUid = "sabinsaji-superadmin-uid"; // default fallback
        uSnap.forEach((d) => {
          superAdminUid = d.id;
        });
        targetReceiverId = superAdminUid;
        targetReceiverRole = "super_admin";
      } catch (err) {
        console.error("Failed to lookup Super Admin UID:", err);
        targetReceiverId = "sabinsaji-superadmin-uid";
        targetReceiverRole = "super_admin";
      }
    }

    const messageText = inputText.trim();
    setInputText("");

    let fileUrl = "";
    let fileName = "";
    let fileType = "";

    if (attachment) {
      if (attachment.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10 MB limit.");
        return;
      }
      setIsUploading(true);
      try {
        const fileRef = ref(storage, `messages/attachments/${Date.now()}_${attachment.name}`);
        const uploadTask = uploadBytesResumable(fileRef, attachment);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              reject(error);
            },
            () => {
              resolve();
            }
          );
        });
        fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
        fileName = attachment.name;
        fileType = attachment.type;
        setAttachment(null);
      } catch (err: any) {
        console.error("File upload failed:", err);
        alert("File attachment upload failed: " + err.message);
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }
      setIsUploading(false);
      setUploadProgress(null);
    }

    try {
      const msgData: Message = {
        senderId: currentUser.uid,
        senderRole: currentUserRole,
        receiverId: targetReceiverId,
        receiverRole: targetReceiverRole,
        participantIds: [currentUser.uid, targetReceiverId],
        message: messageText,
        createdAt: new Date().toISOString(),
        read: false,
        deleted: false,
      };

      if (fileUrl) {
        msgData.attachmentUrl = fileUrl;
        msgData.attachmentName = fileName;
        msgData.attachmentType = fileType;
      }

      await addDoc(collection(db, "messages"), msgData);

      // Create or update conversation metadata
      const convId = currentUserRole === "super_admin" ? targetReceiverId : currentUser.uid;
      const convRef = doc(db, "conversations", convId);
      
      // Get receiver details for naming
      let adminName = currentUserName;
      let adminRole = currentUserRole;
      if (currentUserRole === "super_admin" && activeChatAdmin) {
        adminName = activeChatAdmin.name;
        adminRole = activeChatAdmin.role;
      }

      await setDoc(convRef, {
        adminUid: convId,
        adminName,
        adminRole,
        lastMessage: fileUrl ? `📎 [Attachment] ${fileName}` : messageText,
        lastMessageAt: new Date().toISOString(),
        unreadCount: currentUserRole === "super_admin" ? 0 : 1
      }, { merge: true });

    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // 5. Broadcast Announcement handler
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      let targets: AdminUser[] = [];
      if (broadcastTarget === "all") {
        targets = users;
      } else {
        targets = users.filter((u) => u.role === broadcastTarget);
      }

      const now = new Date().toISOString();

      const promises = targets.map(async (u) => {
        const msgData = {
          senderId: currentUser?.uid || "",
          senderRole: "super_admin",
          receiverId: u.uid,
          receiverRole: u.role,
          participantIds: [currentUser?.uid || "", u.uid],
          message: `📢 [BROADCAST ANNOUNCEMENT]\n\n${broadcastMessage.trim()}`,
          createdAt: now,
          read: false,
          deleted: false,
        };
        await addDoc(collection(db, "messages"), msgData);

        // Update conv meta
        const convRef = doc(db, "conversations", u.uid);
        await setDoc(convRef, {
          adminUid: u.uid,
          adminName: u.name,
          adminRole: u.role,
          lastMessage: `📢 Broadcast: ${broadcastMessage.trim().substring(0, 30)}...`,
          lastMessageAt: now,
          unreadCount: 1
        }, { merge: true });
      });

      await Promise.all(promises);
      setBroadcastMessage("");
      setShowBroadcastModal(false);
      alert("Broadcast sent successfully!");
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      alert("Failed to send broadcast: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // 6. Delete conversation handler (Super Admin only)
  const handleDeleteConversation = async (adminUid: string) => {
    if (!window.confirm("Are you sure you want to clear/delete this conversation history?")) return;
    try {
      // Find all messages between them and delete
      const q = query(
        collection(db, "messages"),
        where("participantIds", "array-contains", adminUid)
      );
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, "messages", d.id)));
      await Promise.all(deletePromises);

      // Delete conversation meta
      await deleteDoc(doc(db, "conversations", adminUid));
      setActiveChatAdmin(null);
    } catch (err: any) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // 7. Pin important conversation
  const togglePinConversation = async (adminUid: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, "conversations", adminUid), { pinned: !currentPinned });
    } catch (err) {
      console.error("Pin update failed:", err);
    }
  };

  // 8. Mark conversation important
  const toggleImportantConversation = async (adminUid: string, currentImportant: boolean) => {
    try {
      await updateDoc(doc(db, "conversations", adminUid), { isImportant: !currentImportant });
    } catch (err) {
      console.error("Important update failed:", err);
    }
  };

  // 9. Pin single message inside chat
  const togglePinMessage = async (msgId: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, "messages", msgId), { pinned: !currentPinned });
    } catch (err) {
      console.error("Pin message failed:", err);
    }
  };

  // 10. Delete single message inside chat
  const deleteSingleMessage = async (msgId: string) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await updateDoc(doc(db, "messages", msgId), { deleted: true });
    } catch (err) {
      console.error("Delete message failed:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-slate-400">Loading Communication Center...</div>;
  }

  // Filter conversations for left list
  const filteredConversations = conversations.filter((c) => {
    if (convFilter === "pinned" && !c.pinned) return false;
    if (convFilter === "important" && !c.isImportant) return false;

    // Search by admin name, role, or last message content
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = c.adminName.toLowerCase().includes(query);
      const roleMatch = ROLE_LABELS[c.adminRole]?.toLowerCase().includes(query) || false;
      const msgMatch = c.lastMessage.toLowerCase().includes(query);
      return nameMatch || roleMatch || msgMatch;
    }
    return true;
  });

  // Include a virtual item if we started a new chat with an admin who has no messages yet
  const displayConversations = [...filteredConversations];
  if (activeChatAdmin && !filteredConversations.some(c => c.adminUid === activeChatAdmin.uid)) {
    displayConversations.unshift({
      id: activeChatAdmin.uid,
      adminUid: activeChatAdmin.uid,
      adminName: activeChatAdmin.name,
      adminRole: activeChatAdmin.role,
      pinned: false,
      isImportant: false,
      lastMessage: "No messages yet. Send a message to start.",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0
    });
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 space-y-6 text-xs animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-600 animate-pulse" />
            Admin Communication Center
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {currentUserRole === "super_admin" 
              ? "Secure internal messaging dashboard with college administrative teams." 
              : "Secure direct messaging console with the Super Administration Office."}
          </p>
        </div>
        {currentUserRole === "super_admin" && (
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-650 hover:bg-purple-750 text-white font-bold px-4 py-2.5 shadow-xs transition"
          >
            <Megaphone className="h-4 w-4" />
            Send Announcement
          </button>
        )}
      </div>

      {/* Main chat UI */}
      {currentUserRole === "super_admin" ? (
        // ── SUPER ADMIN DASHBOARD (Double column) ──
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
          
          {/* Left panel: chats listing */}
          <div className="border-r border-slate-100 bg-white flex flex-col h-full">
            <div className="p-4 space-y-3 border-b border-slate-50">
              {/* Search bar & New Chat Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search user, role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-150 pl-9 pr-3 py-2 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 text-[11px]"
                  />
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-755 text-white font-bold transition flex items-center justify-center shrink-0 shadow-3xs cursor-pointer animate-fade-in"
                  title="New Conversation"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Conversation list filters */}
              <div className="flex gap-1">
                {(["all", "pinned", "important"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setConvFilter(filter)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition ${
                      convFilter === filter 
                        ? "bg-purple-50 text-purple-700 border border-purple-200" 
                        : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Chats list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {displayConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">No active conversations found.</div>
              ) : (
                displayConversations.map((c) => {
                  const isActive = activeChatAdmin?.uid === c.adminUid;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        const matchedAdmin = users.find(u => u.uid === c.adminUid);
                        if (matchedAdmin) setActiveChatAdmin(matchedAdmin);
                      }}
                      className={`p-4 flex items-center justify-between cursor-pointer transition relative hover:bg-slate-50 ${
                        isActive ? "bg-purple-50/50 border-l-4 border-purple-600" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 text-[11px]">{c.adminName}</span>
                            <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${ROLE_COLORS[c.adminRole] || "bg-slate-100 text-slate-600"}`}>
                              {ROLE_LABELS[c.adminRole] || "Staff"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">{c.lastMessage}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {c.unreadCount > 0 && (
                          <span className="h-4.5 min-w-4.5 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                            {c.unreadCount}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {c.pinned && <Pin className="h-3 w-3 text-purple-600 fill-purple-600" />}
                          {c.isImportant && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active chat */}
          <div className="md:col-span-2 flex flex-col h-full bg-white relative">
            {activeChatAdmin ? (
              <>
                {/* Active chat header */}
                <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black">
                      {activeChatAdmin.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[12px] flex items-center gap-2">
                        {activeChatAdmin.name}
                        <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${ROLE_COLORS[activeChatAdmin.role]}`}>
                          {ROLE_LABELS[activeChatAdmin.role]}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{activeChatAdmin.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Conversation Pinned/Important/Delete controls */}
                    {(() => {
                      const cMeta = conversations.find(c => c.adminUid === activeChatAdmin.uid);
                      const isPinned = cMeta?.pinned || false;
                      const isImportant = cMeta?.isImportant || false;
                      return (
                        <>
                          <button
                            onClick={() => togglePinConversation(activeChatAdmin.uid, isPinned)}
                            className={`p-1.5 rounded-lg border transition ${
                              isPinned ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-white border-slate-150 text-slate-400 hover:text-slate-600"
                            }`}
                            title={isPinned ? "Unpin Chat" : "Pin Chat"}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleImportantConversation(activeChatAdmin.uid, isImportant)}
                            className={`p-1.5 rounded-lg border transition ${
                              isImportant ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-white border-slate-150 text-slate-400 hover:text-slate-600"
                            }`}
                            title={isImportant ? "Unmark Important" : "Mark Important"}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteConversation(activeChatAdmin.uid)}
                            className="p-1.5 rounded-lg border border-slate-150 bg-white text-slate-400 hover:text-red-600 transition"
                            title="Delete Conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold space-y-2">
                      <Sparkles className="h-8 w-8 text-purple-300" />
                      <p>Start a secure conversation with {activeChatAdmin.name}.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.uid;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                          <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-2xs relative ${
                            isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                          }`}>
                            
                            {/* Message actions on hover */}
                            <div className={`absolute top-2 ${isMe ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border border-slate-100 rounded-lg p-1 shadow-sm`}>
                              <button onClick={() => togglePinMessage(msg.id!, !!msg.pinned)} className="p-0.5 hover:bg-slate-50 rounded text-slate-400 hover:text-purple-600">
                                <Pin className={`h-3 w-3 ${msg.pinned ? "fill-purple-600 text-purple-600" : ""}`} />
                              </button>
                              <button onClick={() => deleteSingleMessage(msg.id!)} className="p-0.5 hover:bg-slate-50 rounded text-slate-400 hover:text-red-500">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Pinned label */}
                            {msg.pinned && (
                              <div className={`flex items-center gap-1 text-[8px] font-bold uppercase mb-1.5 ${isMe ? "text-purple-200" : "text-purple-500"}`}>
                                <Pin className="h-2.5 w-2.5 fill-current" /> Pinned Message
                              </div>
                            )}

                            {/* Message body */}
                            {msg.message && <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.message}</p>}

                            {/* Attachment display */}
                            {msg.attachmentUrl && (
                              <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                isMe ? "bg-purple-700/50 border-purple-500/30 text-purple-50" : "bg-slate-50 border-slate-150 text-slate-700"
                              }`}>
                                <div className="flex items-center gap-2 truncate">
                                  {msg.attachmentType?.startsWith("image/") ? (
                                    <ImageIcon className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="font-extrabold truncate text-[10px]">{msg.attachmentName}</span>
                                </div>
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-black text-[9px] uppercase hover:underline shrink-0 ${isMe ? "text-white" : "text-indigo-650"}`}
                                >
                                  Download
                                </a>
                              </div>
                            )}

                            {/* Meta timestamp & status */}
                            <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] font-bold ${
                              isMe ? "text-purple-200/80" : "text-slate-400"
                            }`}>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                msg.read ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" /> : <Check className="h-3.5 w-3.5 text-purple-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Attachment preview bar */}
                {attachment && (
                  <div className="p-3 border-t border-slate-150 bg-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                    </span>
                    <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-700">Cancel</button>
                  </div>
                )}

                {/* Send input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 flex items-center gap-2 bg-white">
                  <label className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer transition">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAttachment(file);
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    placeholder={`Type message to ${activeChatAdmin.name}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                  />

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold space-y-3">
                <User className="h-10 w-10 text-slate-355" />
                <p className="text-slate-500">Select a conversation from the left sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── STANDARD ADMIN CHAT SCREEN (Direct chat with Super Admin) ──
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 flex flex-col h-[500px]">
          
          {/* Chat head */}
          <div className="p-4 border-b border-slate-150 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-650 text-white flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-[12px] flex items-center gap-2">
                  GPTC Connect Super Admin Office
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold">Direct Communication Channel</p>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold space-y-2">
                <Sparkles className="h-8 w-8 text-indigo-350" />
                <p>Welcome! Type a message below to query the Super Administration.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-2xs relative ${
                      isMe ? "bg-indigo-650 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    }`}>
                      
                      {msg.pinned && (
                        <div className={`flex items-center gap-1 text-[8px] font-bold uppercase mb-1.5 ${isMe ? "text-indigo-200" : "text-indigo-550"}`}>
                          <Pin className="h-2.5 w-2.5 fill-current" /> Pinned Message
                        </div>
                      )}

                      {msg.message && <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.message}</p>}

                      {msg.attachmentUrl && (
                        <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isMe ? "bg-indigo-700/50 border-indigo-500/30 text-indigo-50" : "bg-slate-50 border-slate-150 text-slate-700"
                        }`}>
                          <div className="flex items-center gap-2 truncate">
                            {msg.attachmentType?.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0" />
                            )}
                            <span className="font-extrabold truncate text-[10px]">{msg.attachmentName}</span>
                          </div>
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-black text-[9px] uppercase hover:underline shrink-0 ${isMe ? "text-white" : "text-indigo-650"}`}
                          >
                            Download
                          </a>
                        </div>
                      )}

                      <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] font-bold ${
                        isMe ? "text-indigo-200/80" : "text-slate-400"
                      }`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.read ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" /> : <Check className="h-3.5 w-3.5 text-indigo-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview */}
          {attachment && (
            <div className="p-3 border-t border-slate-150 bg-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5 truncate">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                {attachment.name} ({Math.round(attachment.size / 1024)} KB)
              </span>
              <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-700">Cancel</button>
            </div>
          )}

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 flex items-center gap-2 bg-white">
            <label className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer transition">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachment(file);
                }}
              />
            </label>

            <input
              type="text"
              placeholder="Send secure message to Super Admin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={isUploading}
              className="p-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold transition disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── BROADCAST MODAL ── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-650 animate-bounce" />
                Send Announcement Broadcast
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Target Admin Role Group</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="all">All Registered Admins</option>
                  <option value="admin">Staff Admins Only</option>
                  <option value="support_admin">Support Admins Only</option>
                  <option value="student_admin">Student Admins Only</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Announcement Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter the broadcast text here. This announcement will appear instantly in their direct messages as a system notification..."
                  rows={5}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting}
                  className="flex-1 rounded-xl bg-purple-650 hover:bg-purple-755 text-white py-2.5 font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    "Send Broadcast"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW CHAT MODAL ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-650" />
                Start Chat with Administrator
              </h3>
              <button 
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatSearchQuery("");
                }} 
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search admins */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={newChatSearchQuery}
                onChange={(e) => setNewChatSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 text-[11px]"
              />
            </div>

            {/* List of admins */}
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {(() => {
                const query = newChatSearchQuery.toLowerCase().trim();
                const filteredAdmins = users.filter((u) => {
                  const nameMatch = u.name.toLowerCase().includes(query);
                  const roleMatch = ROLE_LABELS[u.role]?.toLowerCase().includes(query) || false;
                  const emailMatch = u.email.toLowerCase().includes(query);
                  return nameMatch || roleMatch || emailMatch;
                });

                if (filteredAdmins.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-400 font-bold text-[10px]">
                      No administrative users found.
                    </div>
                  );
                }

                return filteredAdmins.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => {
                      setActiveChatAdmin(u);
                      setShowNewChatModal(false);
                      setNewChatSearchQuery("");
                    }}
                    className="p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-650 font-black text-[10px]">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 text-[11px] block">{u.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold block">{u.email}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[u.role] || "Staff"}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
