import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";
import { getCameraOrMockStream } from "../../services/mediaStreamHelper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
  Clock,
  Loader2,
  Maximize2,
  Minimize2,
  MessageSquare,
  ScreenShare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PatientConsultationRoom = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Waiting for doctor...");
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isDoctorJoined, setIsDoctorJoined] = useState(false);
  const [isMockStream, setIsMockStream] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // Timer
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // ✅ CRITICAL FIX: Ensure remote stream attaches to Patient's main screen
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("📺 Attaching remote stream to Patient's main screen...");
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => console.log("Play error:", err));
    }
  }, [remoteStream, isConnected]);

  // ✅ Fix: Local PiP video attach when video element mounts
useEffect(() => {
  if (!loading && localVideoRef.current && localStreamRef.current) {
    console.log("📺 Attaching local stream to Patient's PiP...");
    localVideoRef.current.srcObject = localStreamRef.current;
    localVideoRef.current.play().catch((err) =>
      console.log("Local PiP play error:", err)
    );
  }
}, [loading]);

  useEffect(() => {
    let mounted = true;

    const startConsultation = async () => {
      try {
        setStatus("Connecting room...");
        setLoading(true);
        iceCandidatesQueueRef.current = [];

        // 1. Get Camera or Mock Stream
        const { stream, isMock } = await getCameraOrMockStream("👤 Patient");
        if (!mounted) {
          if (stream._cleanup) stream._cleanup();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setIsMockStream(isMock);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. PeerConnection
        const pc = new RTCPeerConnection(rtcConfiguration);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Doctor's stream received (Camera or Screen share)
        pc.ontrack = (event) => {
          console.log("🎥 Patient received remote track:", event.track.kind);
          const incoming = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
          setRemoteStream(incoming);
          setIsConnected(true);
          setStatus("Connected to doctor");
          setLoading(false);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              consultationId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setIsConnected(true);
            setStatus("Connected to doctor");
            setLoading(false);
          }
        };

        // Socket listeners
        socket.on("user-joined", ({ role }) => {
          if (role === "doctor") {
            setIsDoctorJoined(true);
            setStatus("Doctor joined. Connecting call...");
          }
        });

        socket.on("ready-to-call", () => {
          setIsDoctorJoined(true);
          setStatus("Doctor is connecting...");
        });

        socket.on("incoming-call", async ({ offer }) => {
          console.log("📞 Received call from doctor. Answering...");
          setStatus("Connecting to doctor...");

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("call-answer", {
              consultationId,
              answer,
            });
            setIsConnected(true);
          } catch (err) {
            console.error("Error answering call:", err);
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          try {
            if (!candidate) return;
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              iceCandidatesQueueRef.current.push(candidate);
            }
          } catch (error) {
            console.error("ICE error:", error);
          }
        });

        socket.on("call-ended", () => {
          setIsConnected(false);
          handleCleanup();
          navigate("/dashboard/patient/appointments", { replace: true });
        });

        socket.on("user-disconnected", ({ role }) => {
          if (role === "doctor") {
            setIsDoctorJoined(false);
            setIsConnected(false);
            setStatus("Doctor disconnected.");
          }
        });

        // Join room
        socket.emit("join-consultation", {
          consultationId,
          userId: "patient",
          role: "patient",
        });

        setStatus("Waiting for doctor...");
        setLoading(false);
      } catch (error) {
        console.error("Patient WebRTC error:", error);
        setLoading(false);
      }
    };

    startConsultation();

    return () => {
      mounted = false;
      socket.off("user-joined");
      socket.off("ready-to-call");
      socket.off("incoming-call");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("user-disconnected");
      handleCleanup();
    };
  }, [consultationId]);

  const handleCleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      if (localStreamRef.current._cleanup) localStreamRef.current._cleanup();
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ✅ SCREEN SHARING
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && screenTrack) {
          await videoSender.replaceTrack(screenTrack);
          console.log("✅ Patient screenTrack pushed to WebRTC!");
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      screenTrack.onended = async () => {
        if (localStreamRef.current && peerConnectionRef.current) {
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender && cameraTrack) {
            await videoSender.replaceTrack(cameraTrack);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error("Screen sharing error:", err);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOn(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioOn(track.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 text-white rounded-t-lg border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : isDoctorJoined ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Connected with Doctor" : isDoctorJoined ? "Connecting..." : "Waiting for doctor..."}
          </span>
          <Badge className="bg-gray-700 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
          <Badge className="bg-gray-700 text-white border-0">
            <User className="h-3 w-3 mr-1" />
            Patient
          </Badge>
          {isMockStream && <Badge className="bg-amber-600 text-white border-0">🧪 Mock Camera</Badge>}
          {isScreenSharing && <Badge className="bg-blue-600 text-white border-0 animate-pulse">📺 Sharing Screen</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video: Always in DOM */}
        <div className="w-full h-full flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            className={`w-full h-full object-contain ${isConnected ? "block" : "hidden"}`}
            autoPlay
            playsInline
          />

          {!isConnected && (
            <div className="flex flex-col items-center justify-center text-white text-center p-4">
              <User className="h-20 w-20 mb-3 opacity-50" />
              <p className="text-xl font-semibold">
                {isDoctorJoined ? "Doctor is connecting..." : "Waiting for Doctor"}
              </p>
              <p className="text-sm text-gray-400 mt-1">{status}</p>
            </div>
          )}
        </div>

        {/* Local Video PiP */}
        <div className="absolute top-4 right-4 w-52 h-36 bg-gray-800 rounded-lg border-2 border-white/30 overflow-hidden shadow-lg z-10">
          <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          <div className="absolute bottom-1 left-2 text-xs text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
            {isScreenSharing ? "Your Screen" : isMockStream ? "You (Mock)" : "You (Camera)"}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 p-3 rounded-full backdrop-blur-sm z-10">
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 ${!isVideoOn ? "bg-red-600" : ""}`}
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 ${!isAudioOn ? "bg-red-600" : ""}`}
            onClick={toggleAudio}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 ${isScreenSharing ? "bg-blue-600" : ""}`}
            onClick={toggleScreenShare}
            title="Share Screen"
          >
            <ScreenShare className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowNotes(!showNotes)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setShowEndDialog(true)}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* End Call Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Consultation</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEndDialog(false);
                socket.emit("end-call", { consultationId });
                handleCleanup();
                navigate("/dashboard/patient/appointments", { replace: true });
              }}
            >
              <PhoneOff className="h-4 w-4 mr-2" /> End Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientConsultationRoom;