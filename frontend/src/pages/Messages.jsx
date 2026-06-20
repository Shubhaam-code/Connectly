import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiSmile,
  FiCornerUpLeft,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiCheck,
  FiSend,
  FiImage,
  FiGrid,
  FiMic,
  FiPlay,
  FiPause,
  FiPhone,
  FiVideo,
  FiCamera
} from 'react-icons/fi'
import { startOutgoingCall } from '../redux/callSlice'
import { GoSearch } from 'react-icons/go'
import dp from "../assets/dp.webp"
import axiosInstance, { SERVER_URL } from '../lib/axiosInstance'
import { renderMessageText } from '../components/ui/MarkdownRenderer'
import { setMessages, setSelectedUser, setPrevChatUsers } from '../redux/messageSlice'
import { useSocket } from '../context/SocketContext'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '../hooks/useCustom'
import { formatTime } from '../utils/formatters'

// Helper for formatting time (m:ss)
const formatTimeStr = (secs) => {
  if (isNaN(secs) || !isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatBubbleTimestamp = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeStr = date.toLocaleTimeString([], timeOptions);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return timeStr;
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  } else {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
};

const formatSidebarTimestamp = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

// Reusable Voice Message Player Component
const VoicePlayer = ({ audioUrl, duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [speed, setSpeed] = useState(1); // 1x, 1.5x, 2x
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (!duration) {
        setTotalDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, duration]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(err => console.error("Audio playback error:", err));
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (e) => {
    e.stopPropagation();
    let nextSpeed = 1;
    if (speed === 1) nextSpeed = 1.5;
    else if (speed === 1.5) nextSpeed = 2;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const textClass = isOwn ? "text-white" : "text-[var(--text-primary)]";
  const bgClass = isOwn ? "bg-white/10 hover:bg-white/20" : "bg-[var(--border)] hover:bg-[var(--hover)]";
  const speedBgClass = isOwn ? "bg-white/10 hover:bg-white/20 border-white/5" : "bg-[var(--background-secondary)] border-[var(--border)] text-[var(--text-primary)]";
  
  const progressPercent = (currentTime / (totalDuration || 1)) * 100;
  const sliderStyle = isOwn
    ? { background: `linear-gradient(to right, #fff 0%, #fff ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)` }
    : { background: `linear-gradient(to right, #8B5CF6 0%, #EC4899 ${progressPercent}%, rgba(120,120,120,0.2) ${progressPercent}%, rgba(120,120,120,0.2) 100%)` };

  return (
    <div className={`flex items-center gap-3 py-1.5 px-1 font-sans text-xs ${textClass} min-w-[210px] md:min-w-[250px] select-none`}>
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer flex-shrink-0 ${bgClass}`}
      >
        {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} className="ml-0.5" />}
      </button>

      {/* Progress & Info */}
      <div className="flex-1 flex flex-col gap-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#EC4899] outline-none"
            style={sliderStyle}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] opacity-80">
          <span>{formatTimeStr(currentTime)}</span>
          <span>{formatTimeStr(totalDuration)}</span>
        </div>
      </div>

      {/* Speed Badge */}
      <button
        type="button"
        onClick={handleSpeedChange}
        className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase border active:scale-90 transition-all cursor-pointer flex-shrink-0 ${speedBgClass}`}
      >
        {speed}x
      </button>
    </div>
  );
};

// Emojis list for message reactions
const EMOJI_OPTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"]

const AI_USER = {
  _id: "ai-friend",
  userName: "friend_ai",
  name: "Friend AI",
  profileImage: "/bot.png",
  isAI: true
};

function Messages() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  const [lastAIMessage, setLastAIMessage] = useState(() => {
    const saved = localStorage.getItem('connectly_ai_friend_messages');
    if (saved) {
      try {
        const msgs = JSON.parse(saved);
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          return lastMsg.message || (lastMsg.messageType === "audio" ? "🎤 Voice Note" : "");
        }
      } catch (e) {}
    }
    return "Online";
  });

  const { userData } = useSelector(state => state.user)
  const { onlineUsers } = useSelector(state => state.socket)
  const { selectedUser, messages, prevChatUsers } = useSelector(state => state.message)
  const socket = useSocket()

  const isAIFriend = selectedUser?._id === "ai-friend" || selectedUser?.userName === "friend_ai" || selectedUser?.isAI;
  const aiChatFromDb = prevChatUsers?.find(chat => chat.user?.userName === "friend_ai" || chat.user?.isAI === true);

  const [searchQuery, setSearchQuery] = useState("")
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // File sending state
  const [backendFile, setBackendFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileType, setFileType] = useState("image") // "image" | "video"

  // Voice Recording state
  const [recordingState, setRecordingState] = useState("idle") // "idle" | "recording" | "preview"
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const [previewSpeed, setPreviewSpeed] = useState(1)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [amplitudes, setAmplitudes] = useState([10, 15, 8, 20, 12, 18, 25, 14, 10, 16, 22, 12])

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerIntervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const sourceRef = useRef(null)
  const previewAudioRef = useRef(null)

  // Reply message state
  const [replyingToMessage, setReplyingToMessage] = useState(null)

  // Editing message state
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState("")

  // Hover reaction overlay state
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null)
  const [reactionPopoverId, setReactionPopoverId] = useState(null)

  // Details panel toggle (desktop only)
  const [showDetails, setShowDetails] = useState(false)

  // Camera capture state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState("user"); // "user" | "environment"
  const cameraVideoRef = useRef(null);

  const handleStartCamera = async () => {
    setShowCameraModal(true);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: false
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Failed to access camera: " + err.message);
      setShowCameraModal(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleToggleCameraFacing = async () => {
    const nextMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextMode);
    
    // Stop current stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setCameraLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera switch failed:", err);
      alert("Failed to switch camera: " + err.message);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCapture = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (cameraFacingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
    }, "image/jpeg", 0.85);
  };

  const handleRetake = async () => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: false
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera retake failed:", err);
      alert("Failed to access camera: " + err.message);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCapturedBlob(null);
    setCapturedUrl(null);
  };

  const handleSendCaptured = async () => {
    if (!capturedBlob || !selectedUser?._id) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", "📷 Photo captured");
      formData.append("image", capturedBlob, "captured_photo.jpg");
      
      if (replyingToMessage) {
        formData.append("replyTo", replyingToMessage._id);
      }

      const result = await axiosInstance.post(
        `/api/message/send/${selectedUser._id}`,
        formData
      );

      dispatch(setMessages([...messages, result.data]));
      handleCloseCamera();
      fetchPrevChats();
    } catch (err) {
      console.error("Failed to send captured photo:", err);
      alert("Failed to send photo. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleStartCall = (type) => {
    if (!selectedUser) return;
    dispatch(
      startOutgoingCall({
        targetUser: selectedUser,
        callType: type
      })
    );
  };

  // Bind video element stream on change
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream && !capturedUrl) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, capturedUrl]);

  const messagesEndRef = useRef()
  const fileInputRef = useRef()
  const typingTimeoutRef = useRef(null)

  // Refs for socket handlers to prevent stale closure issues
  const messagesRef = useRef(messages)
  const selectedUserRef = useRef(selectedUser)

  useEffect(() => {
    return () => {
      if (recordingTimerIntervalRef.current) clearInterval(recordingTimerIntervalRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    selectedUserRef.current = selectedUser
    setReplyingToMessage(null)
    setEditingMessageId(null)
    setOtherUserTyping(false)
  }, [selectedUser])

  // Fetch conversations list on mount
  const fetchPrevChats = async () => {
    try {
      const result = await axiosInstance.get("/api/message/prevChats")
      dispatch(setPrevChatUsers(result.data || []))
    } catch (err) {
      console.error("fetchPrevChats error:", err)
    }
  }

  // Fetch messages for selected conversation
  const getAllMessages = async () => {
    if (!selectedUser?._id) return
    if (isAIFriend) {
      const saved = localStorage.getItem('connectly_ai_friend_messages')
      if (saved) {
        try {
          dispatch(setMessages(JSON.parse(saved)))
        } catch (e) {
          setInitialAIMessages()
        }
      } else {
        setInitialAIMessages()
      }
      return
    }
    try {
      const result = await axiosInstance.get(`/api/message/getAll/${selectedUser._id}`)
      dispatch(setMessages(result.data || []))

      // Mark as seen
      await axiosInstance.put(`/api/message/seen/${selectedUser._id}`)
      
      // Explicitly fetch prevChats after marking as read to sync badge states
      const prevChatsRes = await axiosInstance.get("/api/message/prevChats")
      dispatch(setPrevChatUsers(prevChatsRes.data || []))
    } catch (error) {
      console.error("getAllMessages error:", error)
    }
  }

  const setInitialAIMessages = () => {
    const defaultMsgs = [
      {
        _id: 'greet',
        sender: 'assistant',
        message: 'Hey! 💜 I am your Connectly Companion. I am here to chat, brainstorm, write code, or just listen. Ask me anything! ✨',
        createdAt: new Date().toISOString()
      }
    ]
    dispatch(setMessages(defaultMsgs))
    localStorage.setItem('connectly_ai_friend_messages', JSON.stringify(defaultMsgs))
    setLastAIMessage(defaultMsgs[0].message)
  }

  const handleClearAIMemory = () => {
    if (window.confirm("Wipe our chat memory? 💜")) {
      setInitialAIMessages()
    }
  }

  useEffect(() => {
    fetchPrevChats()
    if (window.location.pathname === "/chat") {
      dispatch(setSelectedUser(AI_USER))
    }
    return () => {
      dispatch(setSelectedUser(null))
    }
  }, [dispatch])

  useEffect(() => {
    if (selectedUser?._id === "ai-friend" && aiChatFromDb?.user) {
      dispatch(setSelectedUser(aiChatFromDb.user))
    }
  }, [prevChatUsers, selectedUser, aiChatFromDb])

  useEffect(() => {
    getAllMessages()
  }, [selectedUser?._id])

  // Socket listener registration
  useEffect(() => {
    if (!socket) return

    // Removed local handleNewMessage since it is now globally handled in App.jsx

    const handleMessagesSeen = ({ viewerId }) => {
      // If the viewer is the currently active user, mark our sent messages as seen
      if (selectedUserRef.current && viewerId?.toString() === selectedUserRef.current._id?.toString()) {
        const updated = messagesRef.current.map(m =>
          m.sender === userData._id || m.sender?._id === userData._id
            ? { ...m, seen: true, delivered: true }
            : m
        )
        dispatch(setMessages(updated))
      }
    }

    const handleMessagesDelivered = ({ receiverId }) => {
      // If the receiver is our currently active user, mark our sent messages as delivered
      if (selectedUserRef.current && receiverId?.toString() === selectedUserRef.current._id?.toString()) {
        const updated = messagesRef.current.map(m =>
          m.sender === userData._id || m.sender?._id === userData._id
            ? { ...m, delivered: true }
            : m
        )
        dispatch(setMessages(updated))
      }
    }

    const handleMessageReaction = ({ messageId, reactions }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      )
      dispatch(setMessages(updated))
    }

    const handleMessageEdited = ({ messageId, message, isEdited }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, message, isEdited } : m
      )
      dispatch(setMessages(updated))
    }

    const handleMessageDeleted = ({ messageId, isDeleted }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, message: "This message was deleted", image: undefined, video: undefined, isDeleted } : m
      )
      dispatch(setMessages(updated))
    }

    const handleTyping = ({ senderId }) => {
      if (selectedUserRef.current && senderId?.toString() === selectedUserRef.current._id?.toString()) {
        setOtherUserTyping(true)
      }
    }

    const handleStopTyping = ({ senderId }) => {
      if (selectedUserRef.current && senderId?.toString() === selectedUserRef.current._id?.toString()) {
        setOtherUserTyping(false)
      }
    }

    socket.on("messagesSeen", handleMessagesSeen)
    socket.on("messagesDelivered", handleMessagesDelivered)
    socket.on("messageReaction", handleMessageReaction)
    socket.on("messageEdited", handleMessageEdited)
    socket.on("messageDeleted", handleMessageDeleted)
    socket.on("typing", handleTyping)
    socket.on("stopTyping", handleStopTyping)

    return () => {
      socket.off("messagesSeen", handleMessagesSeen)
      socket.off("messagesDelivered", handleMessagesDelivered)
      socket.off("messageReaction", handleMessageReaction)
      socket.off("messageEdited", handleMessageEdited)
      socket.off("messageDeleted", handleMessageDeleted)
      socket.off("typing", handleTyping)
      socket.off("stopTyping", handleStopTyping)
    }
  }, [socket, dispatch])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherUserTyping])

  // Handle file choice (image/video)
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setBackendFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFileType(file.type.startsWith("video/") ? "video" : "image")
  }

  // Voice recording volume meter
  const startVolumeAnalyzer = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      const updateWave = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const newAmps = [];
        const step = Math.floor(bufferLength / 12) || 1;
        for (let i = 0; i < 12; i++) {
          const val = dataArray[i * step] || 0;
          const height = Math.max(4, Math.round((val / 255) * 28));
          newAmps.push(height);
        }
        setAmplitudes(newAmps);
        requestAnimationFrame(updateWave);
      };

      updateWave();
    } catch (err) {
      console.error("Volume analyzer setup failed:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecordingState("recording");
      setRecordingDuration(0);

      recordingTimerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      startVolumeAnalyzer(stream);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Could not access microphone. Please check your recording permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;

    setRecordingState("preview");
  };

  const discardRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;

    setRecordingState("idle");
    setRecordedBlob(null);
    setAudioPreviewUrl(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);
    setPreviewSpeed(1);
  };

  const handleSendVoiceMessage = async () => {
    if (!recordedBlob || !selectedUser?._id) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("messageType", "audio");
      formData.append("audioDuration", recordingDuration);
      formData.append("image", recordedBlob, "voice_message.webm");

      if (replyingToMessage) {
        formData.append("replyTo", replyingToMessage._id);
      }

      const result = await axiosInstance.post(
        `/api/message/send/${selectedUser._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      dispatch(setMessages([...messages, result.data]));
      discardRecording();
      fetchPrevChats();
    } catch (err) {
      console.error("Failed to send voice message:", err);
      alert("Failed to send voice message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.playbackRate = previewSpeed;
      previewAudioRef.current.play().catch(err => console.error(err));
      setIsPlayingPreview(true);
    }
  };

  const handlePreviewSeek = (e) => {
    const time = parseFloat(e.target.value);
    setPreviewCurrentTime(time);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
    }
  };

  const togglePreviewSpeed = () => {
    let nextSpeed = 1;
    if (previewSpeed === 1) nextSpeed = 1.5;
    else if (previewSpeed === 1.5) nextSpeed = 2;
    setPreviewSpeed(nextSpeed);
    if (previewAudioRef.current) {
      previewAudioRef.current.playbackRate = nextSpeed;
    }
  };

  // Handle typing triggers
  const handleInputChange = (e) => {
    setInput(e.target.value)

    if (!socket || !selectedUser?._id) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit("typing", { receiverId: selectedUser._id })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit("stopTyping", { receiverId: selectedUser._id })
    }, 2000)
  }

  // Send message
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!input.trim() && !backendFile) return

    setSending(true)

    // Stop typing indicator instantly
    if (isTyping) {
      setIsTyping(false)
      socket?.emit("stopTyping", { receiverId: selectedUser._id })
    }

    if (isAIFriend) {
      const userText = input.trim()
      if (!userText) return
      setInput("")

      const userMsg = {
        _id: Math.random().toString(36).substring(7),
        sender: userData._id || 'user',
        message: userText,
        createdAt: new Date().toISOString()
      }

      const updatedMessages = [...messages, userMsg]
      dispatch(setMessages(updatedMessages))
      localStorage.setItem('connectly_ai_friend_messages', JSON.stringify(updatedMessages))
      setLastAIMessage(userText)

      // Temporary assistant message for streaming
      const assistantMsgId = Math.random().toString(36).substring(7)
      const newAssistantMsg = {
        _id: assistantMsgId,
        sender: 'assistant',
        message: '',
        createdAt: new Date().toISOString()
      }

      dispatch(setMessages([...updatedMessages, newAssistantMsg]))
      setOtherUserTyping(true)

      try {
        const payloadMessages = [...updatedMessages].slice(-10).map(msg => ({
          sender: (msg.sender === userData._id || msg.sender?._id === userData._id || msg.sender === 'user') ? 'user' : 'assistant',
          text: msg.message
        }))

        const response = await fetch(`${SERVER_URL}/api/friend/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messages: payloadMessages })
        })

        setOtherUserTyping(false)

        if (!response.ok) {
          throw new Error('Connection failed')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const cleanLine = line.trim()
            if (!cleanLine) continue
            if (cleanLine === 'data: [DONE]') continue

            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6))
                if (data.content) {
                  accumulatedResponse += data.content
                  const nextMsgs = messagesRef.current.map(msg => {
                    if (msg._id === assistantMsgId) {
                      return { ...msg, message: accumulatedResponse }
                    }
                    return msg
                  })
                  localStorage.setItem('connectly_ai_friend_messages', JSON.stringify(nextMsgs))
                  setLastAIMessage(accumulatedResponse)
                  dispatch(setMessages(nextMsgs))
                }
              } catch (err) {
                // Ignore parsing errors
              }
            }
          }
        }
      } catch (err) {
        console.error('Groq AI Friend stream error:', err)
        setOtherUserTyping(false)
        const nextMsgs = messagesRef.current.map(msg => {
          if (msg._id === assistantMsgId) {
            return { ...msg, message: "Sorry, I'm having trouble connecting right now. 💜" }
          }
          return msg
        })
        localStorage.setItem('connectly_ai_friend_messages', JSON.stringify(nextMsgs))
        dispatch(setMessages(nextMsgs))
      } finally {
        setSending(false)
      }
      return
    }

    try {
      const formData = new FormData()
      formData.append("message", input)
      if (backendFile) {
        formData.append("image", backendFile) // Multer parses file key
      }
      if (replyingToMessage) {
        formData.append("replyTo", replyingToMessage._id)
      }

      const result = await axiosInstance.post(
        `/api/message/send/${selectedUser._id}`,
        formData
      )

      dispatch(setMessages([...messages, result.data]))
      setInput("")
      setBackendFile(null)
      setPreviewUrl(null)
      setReplyingToMessage(null)
      fetchPrevChats() // Refresh sidebar list order
    } catch (err) {
      console.error("send message error:", err)
    } finally {
      setSending(false)
    }
  }

  // Toggle reactions
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const result = await axiosInstance.post(`/api/message/reaction/${messageId}`, { emoji })
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setReactionPopoverId(null)
    } catch (err) {
      console.error("toggleReaction error:", err)
    }
  }

  // Edit Message
  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return
    try {
      const result = await axiosInstance.put(`/api/message/edit/${messageId}`, { message: editText })
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setEditingMessageId(null)
      setEditText("")
    } catch (err) {
      console.error("editMessage error:", err)
    }
  }

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return
    try {
      const result = await axiosInstance.delete(`/api/message/delete/${messageId}`)
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setActiveMessageMenuId(null)
    } catch (err) {
      console.error("deleteMessage error:", err)
    }
  }

  // Filter conversations list based on search query and exclude Friend AI
  const filteredChats = prevChatUsers?.filter(chat =>
    chat.user?.userName !== "friend_ai" &&
    !chat.user?.isAI &&
    (chat.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     chat.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const showAIFriend = !searchQuery || 
    AI_USER.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    AI_USER.userName.toLowerCase().includes(searchQuery.toLowerCase());

  // Horizontal list of online followed users
  const onlineFollowed = userData?.following?.filter(u => onlineUsers?.includes(u._id)) || []

  // Shared media list (for Details sidebar)
  const sharedMedia = messages.filter(m => m.image || m.video)

  return (
    <Layout>
      <div className="flex h-full bg-[var(--background)] text-[var(--text-primary)] overflow-hidden relative">

        {/* Left Panel: Conversation list (shown on desktop, or on mobile when selectedUser is null) */}
        {(!isMobile || !selectedUser) && (
          <div className="w-full md:w-[350px] border-r border-[var(--border)] h-full flex flex-col flex-shrink-0 bg-[var(--background)]">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border)] flex-shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">Messages</h1>
                <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] flex items-center justify-center text-xs border border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                  {prevChatUsers?.length || 0}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2.5 px-3.5 h-9 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
                <GoSearch size={16} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Online users horizontal row */}
            {onlineFollowed.length > 0 && (
              <div className="px-5 py-3 border-b border-[var(--border)] overflow-x-auto flex-shrink-0 flex gap-4 scrollbar-none">
                {onlineFollowed.map(u => (
                  <div
                    key={u._id}
                    onClick={() => dispatch(setSelectedUser(u))}
                    className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-all flex-shrink-0"
                  >
                    <div className="relative">
                      <img src={u.profileImage || dp} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-green-500 p-0.5" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--background)] rounded-full" />
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] truncate w-12 text-center">{u.userName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto bg-[var(--background)]">
              {/* Friends Header */}
              <div className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background-secondary)]/10 border-b border-[var(--border)]">
                Friends
              </div>
              {filteredChats.length > 0 ? (
                <div className="divide-y divide-[var(--border)]">
                  {filteredChats.map((chat) => {
                    const chatUser = chat.user
                    const isOnline = onlineUsers?.includes(chatUser._id)
                    const isSelected = selectedUser?._id === chatUser._id
                    return (
                      <div
                        key={chatUser._id}
                        onClick={() => dispatch(setSelectedUser(chatUser))}
                        className={`flex items-center gap-3.5 p-4 cursor-pointer transition-all border-l-2 ${isSelected ? "bg-[var(--hover)] border-purple-500 font-semibold" : "hover:bg-[var(--hover)]/60 border-transparent"
                          }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={chatUser.profileImage || dp}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover bg-[var(--background-secondary)]"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--background)] rounded-full animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm truncate text-[var(--text-primary)] ${chat.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                              {chatUser.name || chatUser.userName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className={`text-xs truncate flex items-center gap-1 min-w-0 ${
                              chat.unreadCount > 0 ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"
                            }`}>
                              <span className="truncate">
                                {chat.lastMessageSender === userData._id ? "You: " : ""}
                                {chat.lastMessageMedia ? (
                                  chat.lastMessageMedia === "image" ? "📷 Photo" :
                                  chat.lastMessageMedia === "video" ? "🎥 Video" :
                                  chat.lastMessageMedia === "audio" ? "🎤 Voice Message" : `Sent a ${chat.lastMessageMedia}`
                                ) : (chat.lastMessage || (isOnline ? "Online now" : "Offline"))}
                              </span>
                              {chat.lastMessageTimestamp && (
                                <>
                                  <span className="text-[var(--text-muted)] flex-shrink-0">&middot;</span>
                                  <span className="text-[var(--text-muted)] flex-shrink-0">
                                    {formatSidebarTimestamp(chat.lastMessageTimestamp)}
                                  </span>
                                </>
                              )}
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-6 text-[var(--text-secondary)] bg-[var(--background)]">
                  <p className="text-xs">No chats found</p>
                </div>
              )}

              {/* AI Friends Header */}
              <div className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] border-t border-[var(--border)] bg-[var(--background-secondary)]/10">
                AI Friends
              </div>
              {showAIFriend && (
                <div
                  onClick={() => {
                    if (aiChatFromDb?.user) {
                      dispatch(setSelectedUser(aiChatFromDb.user))
                    } else {
                      dispatch(setSelectedUser(AI_USER))
                    }
                  }}
                  className={`flex items-center gap-3.5 p-4 cursor-pointer transition-all border-l-2 ${isAIFriend ? "bg-[var(--hover)] border-purple-500 font-bold" : "hover:bg-[var(--hover)]/60 border-transparent"
                    }`}
                >
                  <div className="relative w-11 h-11 md:w-14 md:h-14 flex-shrink-0">
                    <img
                      src="/bot.png"
                      alt="Friend AI"
                      className="w-full h-full rounded-full object-cover border border-purple-500/20 shadow-md"
                    />
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--background)] rounded-full animate-pulse" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate text-[var(--text-primary)] ${aiChatFromDb?.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                        Friend AI
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className={`text-xs truncate flex items-center gap-1 min-w-0 ${
                        aiChatFromDb?.unreadCount > 0 ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"
                      }`}>
                        <span className="truncate">
                          {aiChatFromDb?.lastMessageSender === userData._id ? "You: " : ""}
                          {aiChatFromDb?.lastMessageMedia ? (
                            aiChatFromDb.lastMessageMedia === "image" ? "📷 Photo" :
                            aiChatFromDb.lastMessageMedia === "video" ? "🎥 Video" :
                            aiChatFromDb.lastMessageMedia === "audio" ? "🎤 Voice Message" : `Sent a ${aiChatFromDb.lastMessageMedia}`
                          ) : (aiChatFromDb?.lastMessage || lastAIMessage)}
                        </span>
                        {aiChatFromDb?.lastMessageTimestamp && (
                          <>
                            <span className="text-[var(--text-muted)] flex-shrink-0">&middot;</span>
                            <span className="text-[var(--text-muted)] flex-shrink-0">
                              {formatSidebarTimestamp(aiChatFromDb.lastMessageTimestamp)}
                            </span>
                          </>
                        )}
                      </div>
                      {aiChatFromDb?.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
                          {aiChatFromDb.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Middle Panel: Active Conversation Thread */}
        {selectedUser ? (
          <div className="flex-1 h-full flex flex-col bg-[var(--background)] relative">
            {/* Header */}
            <div className="h-16 px-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 sticky top-0 bg-[var(--background)]/95 backdrop-blur-md z-30">
              {/* Left Section: Back (on mobile) + Avatar + Name/Status */}
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => {
                      dispatch(setSelectedUser(null))
                      if (window.location.pathname === "/chat") {
                        navigate("/messages")
                      }
                    }}
                    className="p-1 -ml-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-all cursor-pointer"
                    title="Back"
                  >
                    <FiArrowLeft size={22} />
                  </button>
                )}
                
                <div className="relative flex-shrink-0">
                  {isAIFriend ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/20 shadow-md">
                      <img
                        src="/bot.png"
                        alt="Friend AI"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <img
                      src={selectedUser.profileImage || dp}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover cursor-pointer border border-[var(--border)] hover:opacity-90 transition-opacity"
                      onClick={() => navigate(`/profile/${selectedUser.userName}`)}
                    />
                  )}
                  {/* Status Indicator Dot on Avatar */}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[var(--background)] rounded-full ${
                    isAIFriend || onlineUsers?.includes(selectedUser._id) ? "bg-green-500" : "bg-gray-400"
                  }`} />
                </div>

                <div className="flex flex-col min-w-0">
                  <h2
                    className="text-sm font-semibold truncate hover:underline cursor-pointer text-[var(--text-primary)] leading-tight"
                    onClick={() => {
                      if (!isAIFriend) {
                        navigate(`/profile/${selectedUser.userName}`)
                      }
                    }}
                  >
                    {selectedUser.name || selectedUser.userName}
                  </h2>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium leading-none">
                    {isAIFriend ? (
                      "Active Companion"
                    ) : (
                      onlineUsers?.includes(selectedUser._id) ? "Active now" : "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Center: Empty for spacing */}
              <div></div>

              {/* Right Section: Call buttons + Details button */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!isAIFriend && (
                  <>
                    <button
                      onClick={() => handleStartCall("voice")}
                      className="p-2 rounded-full text-[var(--text-secondary)] hover:text-green-500 hover:bg-green-500/10 transition-all cursor-pointer flex items-center justify-center"
                      title="Voice Call"
                    >
                      <FiPhone size={20} />
                    </button>
                    <button
                      onClick={() => handleStartCall("video")}
                      className="p-2 rounded-full text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer flex items-center justify-center"
                      title="Video Call"
                    >
                      <FiVideo size={20} />
                    </button>
                  </>
                )}

                {isAIFriend ? (
                  <button
                    onClick={handleClearAIMemory}
                    title="Clear Chat Memory"
                    className="p-2 rounded-full transition-all cursor-pointer text-red-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center"
                  >
                    <FiTrash2 size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    title="Conversation Details"
                    className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      showDetails
                        ? "bg-purple-500/10 text-purple-500"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <FiInfo size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]">
              <AnimatePresence initial={false}>
                {messages?.map((msg) => {
                  const isOwn = msg.sender === userData._id || msg.sender?._id === userData._id
                  const isMenuOpen = activeMessageMenuId === msg._id
                  const isEdited = msg.isEdited
                  const isDeleted = msg.isDeleted

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} relative group`}
                    >
                      {/* Replying-to label inside bubble */}
                      {msg.replyTo && (
                        <div className="text-[10px] text-[var(--text-secondary)] mb-0.5 flex items-center gap-1">
                          <FiCornerUpLeft size={10} />
                          Replying to {msg.replyTo.sender === userData._id ? "yourself" : selectedUser.userName}
                        </div>
                      )}

                      <div className={`flex items-center gap-2 max-w-[70%] group`}>
                        {/* Hover menu - Left of own message, Right of received message */}
                        {isOwn && !isDeleted && !isAIFriend && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setReplyingToMessage(msg)
                                fileInputRef.current.focus()
                              }}
                              title="Reply"
                              className="p-1 hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
                            >
                              <FiCornerUpLeft size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(msg._id)
                                setEditText(msg.message)
                              }}
                              title="Edit"
                              className="p-1 hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              title="Delete"
                              className="p-1 hover:bg-red-500/10 rounded-full text-red-500 text-xs cursor-pointer"
                            >
                              <FiTrash2 size={14} />
                            </button>
                            <button
                              onClick={() => setReactionPopoverId(reactionPopoverId === msg._id ? null : msg._id)}
                              title="React"
                              className="p-1 hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
                            >
                              <FiSmile size={14} />
                            </button>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          onDoubleClick={() => !isAIFriend && handleToggleReaction(msg._id, "❤️")}
                          className={`rounded-2xl px-4 py-2.5 text-sm select-none relative break-words shadow-md transition-all ${isOwn
                              ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none"
                              : "bg-[var(--bubble-receiver-bg)] text-[var(--bubble-receiver-text)] rounded-bl-none border border-[var(--bubble-receiver-border)]"
                            }`}
                        >
                          {/* Reply Quote preview inside bubble */}
                          <div className="flex flex-col">
                            {msg.replyTo && (
                              <div className="bg-[var(--background-secondary)]/85 border-l-2 border-purple-400 px-2.5 py-1 mb-2 rounded text-[11px] text-[var(--text-secondary)] max-w-full truncate">
                                <span className="font-bold text-[var(--text-muted)] block text-[9px]">
                                  {msg.replyTo.sender === userData._id ? "You" : selectedUser.userName}
                                </span>
                                {msg.replyTo.message || "Media message"}
                              </div>
                            )}

                            {/* Image rendering */}
                            {msg.image && (
                              <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-[var(--border)]">
                                <img src={msg.image} alt="Shared media" className="w-full object-cover max-h-60" />
                              </div>
                            )}

                            {/* Video rendering */}
                            {msg.video && (
                              <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-[var(--border)]">
                                <video src={msg.video} controls className="w-full max-h-60" />
                              </div>
                            )}

                            {/* Shared Post Card inside bubble */}
                            {msg.sharedPost && (
                              <div
                                onClick={() => navigate(`/profile/${msg.sharedPost.author?.userName || ''}`)}
                                className="cursor-pointer border border-[var(--border)] bg-[var(--card)] rounded-lg p-2.5 max-w-[240px] mt-1 space-y-2 hover:bg-[var(--hover)] transition-all text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <img src={msg.sharedPost.author?.profileImage || dp} alt="" className="w-5 h-5 rounded-full object-cover" />
                                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">{msg.sharedPost.author?.userName}</span>
                                </div>
                                <img src={msg.sharedPost.media} alt="" className="w-full h-32 object-cover rounded" />
                                <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{msg.sharedPost.caption}</p>
                              </div>
                            )}

                            {/* Voice Note rendering */}
                            {(msg.messageType === "audio" || msg.audioUrl) ? (
                              <VoicePlayer
                                audioUrl={msg.audioUrl}
                                duration={msg.audioDuration}
                                isOwn={isOwn}
                              />
                            ) : editingMessageId === msg._id ? (
                              <div className="flex flex-col gap-2 min-w-[150px] mt-1">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="bg-[var(--background-secondary)] text-[var(--text-primary)] text-xs px-2 py-1 rounded outline-none border border-[var(--border)]"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="text-[10px] bg-[var(--hover)] hover:bg-[var(--background-secondary)] px-2 py-1 rounded font-semibold text-[var(--text-secondary)] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(msg._id)}
                                    className="text-[10px] bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded font-semibold cursor-pointer text-white"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={isDeleted ? "text-[var(--text-muted)] italic text-xs" : "leading-relaxed text-inherit"}>
                                {isAIFriend && !isOwn ? renderMessageText(msg.message) : msg.message}
                              </p>
                            )}

                            {/* WhatsApp Style Timestamp + Status Checkmarks */}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] self-end select-none ${
                              isOwn ? "text-purple-200" : "text-[var(--text-muted)]"
                            }`}>
                              {isEdited && <span className="italic mr-0.5 opacity-70">(edited)</span>}
                              <span>{formatBubbleTimestamp(msg.createdAt)}</span>
                              {isOwn && (
                                <span className="flex items-center font-bold text-[10px] ml-0.5 leading-none">
                                  {msg.seen ? (
                                    <span className="text-[#38BDF8]" title="Seen">✓✓</span>
                                  ) : msg.delivered ? (
                                    <span className="text-white/60" title="Delivered">✓✓</span>
                                  ) : (
                                    <span className="text-white/45" title="Sent">✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reactions pills */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={`absolute -bottom-2 flex gap-0.5 bg-[var(--background-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded-full z-10 ${isOwn ? 'left-2' : 'right-2'}`}>
                              {msg.reactions.map((reaction, rIdx) => (
                                <span key={rIdx} title={reaction.user?.userName} className="text-xs">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Received message hover triggers */}
                        {!isOwn && !isDeleted && !isAIFriend && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setReactionPopoverId(reactionPopoverId === msg._id ? null : msg._id)}
                              className="p-1 hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <FiSmile size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToMessage(msg)
                                fileInputRef.current.focus()
                              }}
                              className="p-1 hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <FiCornerUpLeft size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reactions Popover */}
                      {reactionPopoverId === msg._id && (
                        <div className={`absolute bottom-full mb-1 z-50 bg-[var(--card)] border border-[var(--border)] p-1.5 rounded-full flex gap-2 shadow-xl ${isOwn ? 'right-0' : 'left-0'}`}>
                          {EMOJI_OPTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className="hover:scale-125 transition-transform text-sm cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Typing animation bubble */}
              {otherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] italic px-4 py-1">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{selectedUser.userName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Upload Form */}
            <div className="border-t border-[var(--border)] p-4 bg-[var(--background)] flex-shrink-0">

              {/* Media Send Preview */}
              {previewUrl && (
                <div className="relative inline-block mb-3 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
                  {fileType === "video" ? (
                    <video src={previewUrl} className="h-20 w-32 rounded-lg object-cover" muted />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <button
                    onClick={() => {
                      setPreviewUrl(null)
                      setBackendFile(null)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Replying-to label */}
              {replyingToMessage && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-xs mb-3 text-[var(--text-secondary)]">
                  <div className="truncate">
                    <span className="font-semibold text-purple-400">Replying to {replyingToMessage.sender === userData._id ? "yourself" : selectedUser.userName}:</span>
                    <span className="ml-1 text-[var(--text-muted)]">{replyingToMessage.message || "Attachment"}</span>
                  </div>
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" onClick={() => setReplyingToMessage(null)}>✕</button>
                </div>
              )}

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {/* Left image icon */}
                {recordingState === "idle" && !isAIFriend && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="p-2 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex-shrink-0"
                      title="Upload Image/Video"
                    >
                      <FiImage size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="p-2 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex-shrink-0"
                      title="Camera Capture"
                    >
                      <FiCamera size={18} />
                    </button>
                  </>
                )}

                {/* Dynamic Input area / recording wave / preview player */}
                {recordingState === "recording" ? (
                  // Recording UI
                  <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-full text-xs text-red-400">
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="p-1 hover:bg-red-500/20 rounded-full text-red-400 cursor-pointer flex-shrink-0"
                      title="Discard Recording"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    <span className="flex items-center gap-2 font-bold animate-pulse flex-1 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Recording...
                    </span>
                    
                    {/* Live Waveform Visualizer */}
                    <div className="flex items-end gap-0.5 h-6 px-2">
                      {amplitudes.map((amp, idx) => (
                        <div
                          key={idx}
                          className="w-0.75 bg-red-400 rounded-full transition-all duration-75"
                          style={{ height: `${amp}px` }}
                        />
                      ))}
                    </div>

                    <span className="font-mono text-[11px] font-bold text-red-400 whitespace-nowrap bg-red-500/15 px-2.5 py-0.5 rounded-full">
                      {formatTimeStr(recordingDuration)}
                    </span>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="p-1 hover:bg-red-500/20 rounded-full text-red-400 cursor-pointer flex-shrink-0"
                      title="Stop Recording"
                    >
                      <FiCheck size={18} className="stroke-[3]" />
                    </button>
                  </div>
                ) : recordingState === "preview" ? (
                  // Preview UI
                  <div className="flex-1 flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-full text-xs text-[var(--text-primary)]">
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="p-1 hover:bg-[var(--hover)] rounded-full text-red-400 cursor-pointer flex-shrink-0"
                      title="Discard Voice Note"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    
                    {/* Preview Play/Pause */}
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="p-1 text-[#8B5CF6] hover:text-[#EC4899] transition-colors cursor-pointer flex-shrink-0"
                    >
                      {isPlayingPreview ? <FiPause size={18} /> : <FiPlay size={18} />}
                    </button>
                    
                    {/* Preview Audio Element & Seek Slider */}
                    <audio
                      ref={previewAudioRef}
                      src={audioPreviewUrl}
                      onTimeUpdate={(e) => setPreviewCurrentTime(e.target.currentTime)}
                      onEnded={() => setIsPlayingPreview(false)}
                    />
                    <input
                      type="range"
                      min="0"
                      max={recordingDuration || 1}
                      value={previewCurrentTime}
                      onChange={handlePreviewSeek}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#EC4899] outline-none"
                      style={{
                        background: `linear-gradient(to right, #8B5CF6 0%, #EC4899 ${(previewCurrentTime / (recordingDuration || 1)) * 100}%, rgba(255,255,255,0.2) ${(previewCurrentTime / (recordingDuration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatTimeStr(previewCurrentTime)} / {formatTimeStr(recordingDuration)}
                    </span>
                    
                    {/* Playback speed toggle */}
                    <button
                      type="button"
                      onClick={togglePreviewSpeed}
                      className="px-2 py-0.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[9px] font-black text-[var(--text-primary)] cursor-pointer flex-shrink-0"
                    >
                      {previewSpeed}x
                    </button>
                  </div>
                ) : (
                  // Idle Text Input
                  <input
                    type="text"
                    placeholder="Message..."
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                  />
                )}

                {/* Microphone button (visible in idle state) */}
                {recordingState === "idle" && !isAIFriend && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex-shrink-0"
                    title="Record Voice Note"
                  >
                    <FiMic size={18} />
                  </button>
                )}

                {/* Send button (always visible in idle if input or file, or in preview to send audio) */}
                {(recordingState === "preview" || input.trim() || backendFile) && (
                  <button
                    type="button"
                    onClick={recordingState === "preview" ? handleSendVoiceMessage : handleSendMessage}
                    disabled={sending}
                    className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-all flex items-center justify-center disabled:bg-[var(--background-secondary)] disabled:text-[var(--text-muted)] cursor-pointer flex-shrink-0"
                  >
                    <FiSend size={16} />
                  </button>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* Desktop Right panel default placeholder */
          !isMobile && (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-[var(--background)] text-center p-8">
              <div className="w-24 h-24 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] mb-6 bg-[var(--card)]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Messages</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
                Send private photos and messages to a friend or group. Start the conversation from recommended creators.
              </p>
            </div>
          )
        )}

        {/* Right Details Panel: Profile Info & Shared Gallery (visible when toggled and user is selected) */}
        {!isMobile && selectedUser && showDetails && (
          <div className="w-[280px] border-l border-[var(--border)] h-full bg-[var(--background)] flex flex-col flex-shrink-0 z-20">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border)] text-center flex flex-col items-center gap-3">
              <img
                src={selectedUser.profileImage || dp}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30 p-0.5 cursor-pointer"
                onClick={() => navigate(`/profile/${selectedUser.userName}`)}
              />
              <div>
                <h3
                  className="font-bold text-sm hover:underline cursor-pointer text-[var(--text-primary)]"
                  onClick={() => navigate(`/profile/${selectedUser.userName}`)}
                >
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">@{selectedUser.userName}</p>
              </div>
            </div>

            {/* Gallery grid of shared attachments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <FiGrid size={12} />
                Shared Attachments
              </h4>
              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {sharedMedia.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      className="aspect-square bg-[var(--background-secondary)] rounded overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      {m.image ? (
                        <img src={m.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.video} className="w-full h-full object-cover" muted />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">No media shared in this chat yet</p>
              )}
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans text-[var(--text-primary)]">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl relative">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Camera Capture
                </h3>
                <button
                  onClick={handleCloseCamera}
                  className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Video / Photo Preview Container */}
              <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border border-[var(--border)] flex items-center justify-center">
                {cameraLoading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {capturedUrl ? (
                  <img
                    src={capturedUrl}
                    alt="Captured preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: cameraFacingMode === "user" ? "scaleX(-1)" : "none" }}
                  />
                )}

                {/* Flip Camera Button */}
                {!capturedUrl && !cameraLoading && (
                  <button
                    onClick={handleToggleCameraFacing}
                    className="absolute top-3 right-3 p-2 bg-black/65 hover:bg-black/85 rounded-full text-white border border-white/10 transition-all cursor-pointer active:scale-90"
                    title="Switch Camera"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {capturedUrl ? (
                  <>
                    <button
                      onClick={handleRetake}
                      className="px-4 py-2 text-xs font-bold bg-[var(--background-secondary)] hover:bg-[var(--border)] rounded-xl border border-[var(--border)] cursor-pointer"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleSendCaptured}
                      disabled={sending}
                      className="px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-green-600/25 disabled:bg-gray-700"
                    >
                      <FiSend size={12} /> Send Photo
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCloseCamera}
                      className="px-4 py-2 text-xs font-bold bg-[var(--background-secondary)] hover:bg-[var(--border)] rounded-xl border border-[var(--border)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCapture}
                      disabled={cameraLoading}
                      className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/25 disabled:bg-gray-700"
                    >
                      <FiCamera size={14} /> Capture
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default Messages
