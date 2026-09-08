import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ScreenShare,
  User,
  Clock,
  MessageSquare,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProviderConsultationRoom = () => {
  const navigate = useNavigate();
  const { consultationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPatientJoined, setIsPatientJoined] = useState(false);
  const [isMockStream, setIsMockStream] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [duration, setDuration] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const videoRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const offerCreatedRef = useRef(false);
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

  // ✅ CRITICAL FIX: Ensure remote stream attaches whenever videoRef is ready
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log("📺 Attaching remote stream to Doctor's main screen...");
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch((err) => console.log("Play error:", err));
    }
  }, [remoteStream, isConnected]);

  useEffect(() => {
    let mounted = true;

    const setupCall = async () => {
      try {
        setLoading(true);
        offerCreatedRef.current = false;
        iceCandidatesQueueRef.current = [];

        // 1. Get Camera or Mock Stream
        const { stream, isMock } = await getCameraOrMockStream("👨‍⚕️ Doctor");
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

        // 2. Initialize WebRTC
        const pc = new RTCPeerConnection(rtcConfiguration);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track received from Patient
        pc.ontrack = (event) => {
          console.log("🎥 Doctor received track:", event.track.kind);
          const incoming = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
          setRemoteStream(incoming);
          setIsConnected(true);
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
            setLoading(false);
          }
        };

        const initiateCall = async () => {
          if (offerCreatedRef.current) return;
          offerCreatedRef.current = true;
          try {
            console.log("📞 Doctor creating offer...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("call-user", { consultationId, offer });
          } catch (err) {
            console.error("Error creating offer:", err);
            offerCreatedRef.current = false;
          }
        };

        // Socket listeners
        socket.on("user-joined", ({ role }) => {
          if (role === "patient") {
            setIsPatientJoined(true);
            setTimeout(() => initiateCall(), 500);
          }
        });

        socket.on("ready-to-call", () => {
          setIsPatientJoined(true);
          setTimeout(() => initiateCall(), 500);
        });

        socket.on("call-answered", async ({ answer }) => {
          try {
            if (pc.signalingState !== "closed" && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              while (iceCandidatesQueueRef.current.length > 0) {
                const cand = iceCandidatesQueueRef.current.shift();
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              setIsConnected(true);
            }
          } catch (err) {
            console.error("Answer error:", err);
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
          } catch (err) {
            console.error("ICE error:", err);
          }
        });

        socket.on("call-ended", () => {
          setIsConnected(false);
          handleCleanup();
          navigate("/dashboard/provider/consultations", { replace: true });
        });

        // Join room
        socket.emit("join-consultation", {
          consultationId,
          userId: "doctor",
          role: "doctor",
        });

        setLoading(false);
      } catch (err) {
        console.error("Doctor setup error:", err);
        setLoading(false);
      }
    };

    setupCall();

    return () => {
      mounted = false;
      socket.off("user-joined");
      socket.off("ready-to-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
      if (timerRef.current) clearInterval(timerRef.current);
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
    offerCreatedRef.current = false;
  };

  // ✅ SCREEN SHARING
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to Camera
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
          console.log("✅ Doctor screenTrack pushed to WebRTC!");
        }
      }

      // Show screen in local PiP
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
      console.error("Screen share error:", err);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-500">Connecting room...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : isPatientJoined ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Connected with Patient" : isPatientJoined ? "Calling Patient..." : "Waiting for patient..."}
          </span>
          <Badge className="bg-white/20 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
          <Badge className="bg-white/20 text-white border-0">
            <User className="h-3 w-3 mr-1" />
            Doctor
          </Badge>
          {isMockStream && <Badge className="bg-amber-600 text-white border-0">🧪 Mock Camera</Badge>}
          {isScreenSharing && <Badge className="bg-blue-600 text-white border-0 animate-pulse">📺 Sharing Screen</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 bg-gray-900 relative">
        <div className="w-full h-full flex items-center justify-center">
          {/* Main Remote Video: Always in DOM */}
          <video
            ref={videoRef}
            className={`w-full h-full object-contain ${isConnected ? "block" : "hidden"}`}
            autoPlay
            playsInline
          />

          {!isConnected && (
            <div className="flex flex-col items-center justify-center text-white text-center p-4">
              <User className="h-20 w-20 mb-3 opacity-50" />
              <p className="text-xl font-semibold">
                {isPatientJoined ? "Connecting to Patient..." : "Waiting for Patient"}
              </p>
              <p className="text-sm text-gray-400 mt-1">Patient will join shortly.</p>
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
                navigate("/dashboard/provider/consultations", { replace: true });
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

export default ProviderConsultationRoom;