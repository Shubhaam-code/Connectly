import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext";
import {
  resetCall,
  setCallConnected,
  toggleMute,
  toggleCamera,
  receiveIncomingCall
} from "../../redux/callSlice";
import {
  FiPhone,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiVolume2
} from "react-icons/fi";
import dp from "../../assets/dp.webp";

// Web Audio API Ringtone generator to avoid needing external assets
const playRingSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  
  let isStopped = false;
  
  const playBeep = () => {
    if (isStopped || ctx.state === "closed") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15); // Ring modulation effect
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  };

  playBeep();
  let interval = setInterval(playBeep, 2000);

  return {
    stop: () => {
      isStopped = true;
      clearInterval(interval);
      ctx.close().catch(() => {});
    }
  };
};

export const CallManager = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  
  const { callState, callType, targetUser, callerId, isMuted, isCameraOff } = useSelector(
    (state) => state.call
  );
  const { userData } = useSelector((state) => state.user);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const ringSoundRef = useRef(null);
  const timerRef = useRef(null);
  const iceQueueRef = useRef([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Clean up WebRTC peer connection and streams
  const cleanUpCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);

    if (ringSoundRef.current) {
      ringSoundRef.current.stop();
      ringSoundRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    iceQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  };

  // Mute & Camera toggling effects
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);

  // Socket Calling Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callerId, callerName, callerProfileImage, callType }) => {
      // Don't take call if already in a call
      if (callState !== "idle") {
        socket.emit("rejectCall", { callerId });
        return;
      }
      
      // Start ringtone
      ringSoundRef.current = playRingSound();

      dispatch(
        receiveIncomingCall({
          caller: {
            _id: callerId,
            name: callerName,
            userName: callerName,
            profileImage: callerProfileImage
          },
          callType
        })
      );
    };

    const handleCallRejected = () => {
      alert("Call Busy / Rejected");
      cleanUpCall();
      dispatch(resetCall());
    };

    const handleCallEnded = () => {
      cleanUpCall();
      dispatch(resetCall());
    };

    const handleCallAccepted = async () => {
      // Caller initiates WebRTC negotiation
      dispatch(setCallConnected());
      if (ringSoundRef.current) {
        ringSoundRef.current.stop();
        ringSoundRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video"
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Start call timer
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        // Create Peer Connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        pcRef.current = pc;

        // Add local tracks to pc
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Set up ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate && targetUser) {
            socket.emit("iceCandidate", {
              targetUserId: targetUser._id,
              candidate: event.candidate
            });
          }
        };

        // Set up remote track handler
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // Create SDP Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("sdpOffer", {
          receiverId: targetUser._id,
          sdp: offer
        });

      } catch (err) {
        console.error("WebRTC caller start failed:", err);
        socket.emit("endCall", { targetUserId: targetUser._id });
        cleanUpCall();
        dispatch(resetCall());
        alert("Failed to access camera/mic: " + err.message);
      }
    };

    const handleSdpOffer = async ({ callerId, sdp }) => {
      if (callState !== "connected" && callState !== "incoming") return;
      
      try {
        // Setup local media if not already set (receiver accepts call)
        let stream = localStreamRef.current;
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video"
          });
          localStreamRef.current = stream;
          setLocalStream(stream);

          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("iceCandidate", {
              targetUserId: callerId,
              candidate: event.candidate
            });
          }
        };

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        // Drain queued ICE candidates
        while (iceQueueRef.current.length > 0) {
          const cand = iceQueueRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (candErr) {
            console.error("WebRTC addIceCandidate from queue failed:", candErr);
          }
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("sdpAnswer", {
          callerId,
          sdp: answer
        });

      } catch (err) {
        console.error("WebRTC receiver SDP offer processing failed:", err);
        socket.emit("endCall", { targetUserId: callerId });
        cleanUpCall();
        dispatch(resetCall());
      }
    };

    const handleSdpAnswer = async ({ sdp }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          // Drain queued ICE candidates
          while (iceQueueRef.current.length > 0) {
            const cand = iceQueueRef.current.shift();
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.error("WebRTC addIceCandidate from queue failed:", candErr);
            }
          }
        } catch (err) {
          console.error("WebRTC setRemoteDescription answer failed:", err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("WebRTC addIceCandidate failed:", err);
        }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);
    socket.on("sdpOffer", handleSdpOffer);
    socket.on("sdpAnswer", handleSdpAnswer);
    socket.on("iceCandidate", handleIceCandidate);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
      socket.off("sdpOffer", handleSdpOffer);
      socket.off("sdpAnswer", handleSdpAnswer);
      socket.off("iceCandidate", handleIceCandidate);
    };
  }, [socket, callState, callType, targetUser]);

  // Outgoing Call Side Effect (emit callUser request)
  useEffect(() => {
    if (callState === "outgoing" && socket && targetUser) {
      ringSoundRef.current = playRingSound();
      socket.emit("callUser", {
        receiverId: targetUser._id,
        callerName: userData.name || userData.userName,
        callerProfileImage: userData.profileImage,
        callType
      });
    }
  }, [callState, socket, targetUser, callType, userData]);

  // Video stream elements bind
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Action: Accept Call
  const handleAccept = () => {
    if (ringSoundRef.current) {
      ringSoundRef.current.stop();
      ringSoundRef.current = null;
    }
    if (socket && callerId) {
      socket.emit("acceptCall", { callerId });
      dispatch(setCallConnected());
    }
  };

  // Action: Reject Call
  const handleReject = () => {
    if (ringSoundRef.current) {
      ringSoundRef.current.stop();
      ringSoundRef.current = null;
    }
    if (socket && callerId) {
      socket.emit("rejectCall", { callerId });
    }
    cleanUpCall();
    dispatch(resetCall());
  };

  // Action: Cancel / End Call
  const handleEndCall = () => {
    if (socket && targetUser) {
      socket.emit("endCall", { targetUserId: targetUser._id });
    }
    cleanUpCall();
    dispatch(resetCall());
  };

  if (callState === "idle") return null;

  // Format Duration Timer (mm:ss)
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md select-none font-sans text-white">
      {/* ─── INCOMING CALL SCREEN ─── */}
      {callState === "incoming" && (
        <div className="w-full max-w-sm flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-purple-500/30 overflow-hidden shadow-2xl animate-pulse">
              <img
                src={targetUser?.profileImage || dp}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full">
              {callType === "video" ? <FiVideo size={18} /> : <FiPhone size={18} />}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold">{targetUser?.name || targetUser?.userName}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Incoming {callType === "video" ? "Video" : "Voice"} Call...
            </p>
          </div>
          <div className="flex items-center gap-8 pt-6 w-full justify-center">
            {/* Reject */}
            <button
              onClick={handleReject}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25"
            >
              <FiPhoneOff size={24} className="transform rotate-135" />
            </button>
            {/* Accept */}
            <button
              onClick={handleAccept}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25"
            >
              <FiPhone size={24} className="animate-bounce" />
            </button>
          </div>
        </div>
      )}

      {/* ─── OUTGOING CALL SCREEN ─── */}
      {callState === "outgoing" && (
        <div className="w-full max-w-sm flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-purple-500/30 overflow-hidden shadow-2xl animate-pulse">
              <img
                src={targetUser?.profileImage || dp}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full">
              {callType === "video" ? <FiVideo size={18} /> : <FiPhone size={18} />}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold">{targetUser?.name || targetUser?.userName}</h3>
            <p className="text-sm text-gray-400 mt-1">Calling...</p>
          </div>
          <div className="pt-8">
            <button
              onClick={handleEndCall}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25"
            >
              <FiPhoneOff size={24} className="transform rotate-135" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CONNECTED ACTIVE CALL SCREEN ─── */}
      {callState === "connected" && (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-6">
          
          {/* VIDEO CALL SCREEN */}
          {callType === "video" ? (
            <div className="absolute inset-0 w-full h-full bg-[#111] overflow-hidden">
              {/* Remote Video (Fullscreen) */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4 bg-purple-950/25">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 shadow-xl animate-pulse">
                    <img
                      src={targetUser?.profileImage || dp}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Connecting video feed...</p>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-28 h-40 rounded-xl overflow-hidden border border-white/20 bg-black/40 shadow-2xl z-20">
                {isCameraOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/60 text-[10px] text-gray-500">
                    Camera Off
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Header Profile Info Floating */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/45 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                <img
                  src={targetUser?.profileImage || dp}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold">{targetUser?.name || targetUser?.userName}</h4>
                  <p className="text-[10px] text-green-400 font-bold">{formatTimer(callDuration)}</p>
                </div>
              </div>
            </div>
          ) : (
            // VOICE CALL SCREEN
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                {/* Ripples animations */}
                <div className="absolute -inset-4 rounded-full bg-purple-500/10 animate-ping" />
                <div className="w-32 h-32 rounded-full border-4 border-purple-500 overflow-hidden shadow-2xl z-10 relative">
                  <img
                    src={targetUser?.profileImage || dp}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{targetUser?.name || targetUser?.userName}</h3>
                <p className="text-xs text-green-400 font-bold tracking-widest uppercase bg-green-500/15 border border-green-500/20 px-3 py-1 rounded-full mt-2 w-fit mx-auto">
                  {formatTimer(callDuration)}
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM CONTROL TOOLBAR */}
          <div className="relative z-50 flex items-center gap-6 bg-black/40 backdrop-blur-md px-8 py-4 rounded-full border border-white/5 shadow-2xl">
            {/* Microphone Mute */}
            <button
              onClick={() => dispatch(toggleMute())}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isMuted
                  ? "bg-red-500/20 border border-red-500 text-red-500"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
              title="End Call"
            >
              <FiPhoneOff size={22} className="transform rotate-135" />
            </button>

            {/* Video Camera Toggle (Video Call Only) */}
            {callType === "video" ? (
              <button
                onClick={() => dispatch(toggleCamera())}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isCameraOff
                    ? "bg-red-500/20 border border-red-500 text-red-500"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title={isCameraOff ? "Camera On" : "Camera Off"}
              >
                {isCameraOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
              </button>
            ) : (
              // Speaker Controls indicator for Voice call
              <button
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white select-none opacity-50"
                disabled
              >
                <FiVolume2 size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallManager;
