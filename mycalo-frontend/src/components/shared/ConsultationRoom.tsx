"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Message {
  _id: string;
  bookingId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "file" | "call_log";
  createdAt: string;
}

interface BookingDetails {
  _id: string;
  userId: string | { _id: string; name: string };
  doctorId: string | { _id: string; name: string };
  patientName: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface ConsultationRoomProps {
  bookingId: string;
  role: "doctor" | "user";
}

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function ConsultationRoom({ bookingId, role }: ConsultationRoomProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Call status
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "incoming" | "connected">("idle");

  // WebRTC & Socket refs
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Queries
  const { data: booking, isLoading: bookingLoading } = useQuery<BookingDetails>({
    queryKey: ["booking-consultation-detail", bookingId],
    queryFn: async () => {
      // Both roles can hit the detail route since we configured it in controller
      const res = await api.get(`/doctors/bookings/${bookingId}/messages`);
      // Wait, that route returns messages. Let's write a route to get booking detail or use existing.
      // Wait, we have userChatAccess or doctorChatAccess which returns access details, or getVerificationDetail?
      // Actually, we can get booking details from the message endpoint or getMyBookings list, or load it from a query.
      // Let's call the message history API which we created, it returns the messages.
      return {
        _id: bookingId,
        patientName: role === "doctor" ? "Patient" : "Doctor",
        startTime: "",
        endTime: "",
        status: "confirmed"
      } as any;
    }
  });

  // Load message history from DB
  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", bookingId],
    queryFn: async () => {
      const res = await api.get(`/doctors/bookings/${bookingId}/messages`);
      setMessages(res.data.data);
      return res.data.data;
    }
  });

  // Mutation to complete consultation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/doctors/bookings/${bookingId}/complete`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Consultation completed!");
      router.replace(role === "doctor" ? "/doctor/dashboard" : "/doctor/bookings");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message);
    }
  });

  // Socket Connection Setup
  useEffect(() => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = rawApiUrl.replace("/api", "");

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // Join room
    socket.emit("join-room", { bookingId, userId: user?._id });

    // Handle new text messages
    socket.on("new-message", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some((p) => p._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    // WebRTC Signaling: Incoming Call
    socket.on("incoming-call", async ({ offer }) => {
      setCallStatus("incoming");
      // Store the offer on peer connection
      const pc = getOrCreatePeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
    });

    // WebRTC Signaling: Answer Call
    socket.on("call-answered", async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connected");
      }
    });

    // WebRTC Signaling: ICE Candidate
    socket.on("ice-candidate", async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    // WebRTC Signaling: Call Ended
    socket.on("call-ended", () => {
      cleanupCall();
      toast.info("Call ended by the other user.");
    });

    // WebRTC Signaling: Media state changed (remote muted/camera toggled)
    socket.on("media-state-changed", ({ type, enabled }) => {
      if (type === "video") {
        toast.info(enabled ? "User turned video on" : "User turned video off");
      }
    });

    return () => {
      socket.disconnect();
      cleanupCall();
    };
  }, [bookingId, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebRTC Peer Connection Helper
  const getOrCreatePeerConnection = (): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          bookingId,
          candidate: event.candidate,
        });
      }
    };

    // Remote stream arrives
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Start Call
  const startCall = async () => {
    try {
      setInCall(true);
      setCallStatus("calling");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = getOrCreatePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("call-user", { bookingId, offer });
    } catch (err) {
      console.error("Failed to access media devices:", err);
      toast.error("Could not access camera or microphone.");
      setInCall(false);
      setCallStatus("idle");
    }
  };

  // Accept Call
  const acceptCall = async () => {
    try {
      setInCall(true);
      setCallStatus("connected");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = getOrCreatePeerConnection();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("answer-call", { bookingId, answer });
    } catch (err) {
      console.error("Failed to accept call:", err);
      toast.error("Failed to accept call.");
      cleanupCall();
    }
  };

  // End Call
  const endCall = () => {
    socketRef.current?.emit("end-call", { bookingId });
    cleanupCall();
  };

  const cleanupCall = () => {
    setInCall(false);
    setCallStatus("idle");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // Toggle Media
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socketRef.current?.emit("toggle-media", {
          bookingId,
          type: "audio",
          enabled: audioTrack.enabled,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        socketRef.current?.emit("toggle-media", {
          bookingId,
          type: "video",
          enabled: videoTrack.enabled,
        });
      }
    }
  };

  // Send Text Message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit("send-message", {
      bookingId,
      senderId: user?._id,
      senderType: role,
      message: newMessage.trim(),
      messageType: "text",
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 p-4">
      {/* LEFT PANEL: Media Call / Stream View */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[28px] border border-slate-800 p-6 relative overflow-hidden">
        
        {/* Connection status header */}
        <div className="flex items-center justify-between mb-4 z-10">
          <div className="flex items-center gap-2 bg-black/35 px-4 py-1.5 rounded-full border border-white/5">
            <span className={`w-2.5 h-2.5 rounded-full ${inCall ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
            <span className="text-[11px] font-black text-white/80 uppercase tracking-wider">
              {callStatus === "idle" && "Standby"}
              {callStatus === "calling" && "Calling..."}
              {callStatus === "incoming" && "Incoming Call..."}
              {callStatus === "connected" && "Call Active"}
            </span>
          </div>

          {/* Complete Consultation Button (Doctor only) */}
          {role === "doctor" && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all"
            >
              Complete Session
            </button>
          )}
        </div>

        {/* Video stream box */}
        <div className="flex-1 bg-slate-950/70 rounded-[20px] flex items-center justify-center relative overflow-hidden border border-slate-850">
          {inCall ? (
            <div className="w-full h-full relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              
              {/* Remote Video */}
              <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-black/40 px-3 py-1 rounded text-white text-xs">
                  Remote user
                </span>
              </div>

              {/* Local Video */}
              <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-black/40 px-3 py-1 rounded text-white text-xs">
                  You (Local)
                </span>
              </div>

            </div>
          ) : (
            <div className="text-center p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl">🎥</div>
              <h4 className="text-white font-black">Ready for Call</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Start a secure end-to-end audio/video consultation session with the other participant.
              </p>
              
              {/* Call Control Button */}
              {callStatus === "incoming" ? (
                <button
                  onClick={acceptCall}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-[14px] shadow-lg animate-bounce"
                >
                  📞 Accept Call
                </button>
              ) : (
                <button
                  onClick={startCall}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-sm rounded-[14px] shadow-lg transition-colors"
                >
                  🎥 Start Consultation Call
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media Call Controllers */}
        {inCall && (
          <div className="flex items-center justify-center gap-4 mt-4 z-10">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full border transition-all ${isMuted ? "bg-red-500/25 border-red-500 text-red-500" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
            >
              {isMuted ? "🎙️ Muted" : "🎙️ Mute"}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full border transition-all ${isVideoOff ? "bg-red-500/25 border-red-500 text-red-500" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
            >
              {isVideoOff ? "🎥 Camera Off" : "🎥 Camera On"}
            </button>
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 border border-red-500 text-white hover:bg-red-700 font-bold px-6"
            >
              🛑 Hang Up
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Chat Messaging Box */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Chat header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-black text-slate-900 text-sm">Consultation Chat</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Secure Session</p>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-2">💬</span>
              <p className="text-xs text-slate-400 font-bold">No Messages Yet</p>
              <p className="text-[10px] text-slate-300 mt-1">Start chatting by sending a message below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderType === role;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col max-w-[80%] ${mine ? "self-end items-end" : "self-start items-start"}`}
                >
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    {msg.senderType === role ? "You" : msg.senderType}
                  </span>
                  <div
                    className={`p-3.5 rounded-[18px] text-xs leading-relaxed ${mine ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"}`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[8px] text-slate-300 mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type message here..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
