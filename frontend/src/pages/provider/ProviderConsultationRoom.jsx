import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../../services/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  StopCircle,
  User,
  Clock,
  MessageSquare,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProviderConsultationRoom = () => {
  const navigate = useNavigate();
  const { consultationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPatientJoined, setIsPatientJoined] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "patient", message: "Hello doctor, I'm ready for the consultation.", time: new Date().toLocaleTimeString() },
    { sender: "doctor", message: "Hi! Let's start the consultation.", time: new Date().toLocaleTimeString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [patientInfo, setPatientInfo] = useState({
    name: "Mominah Ejaz",
    age: 29,
    gender: "Female",
    symptoms: ["Fever", "Cough", "Fatigue"],
    reason: "Fever and cough for 3 days",
  });

  const videoRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const offerCreatedRef = useRef(false);

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // ✅ Timer
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // ✅ Setup WebRTC and Socket
  useEffect(() => {
    let mounted = true;

    const setupCall = async () => {
      try {
        setLoading(true);
        setError("");
        offerCreatedRef.current = false;

        // Get local camera/mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create PeerConnection
        const pc = new RTCPeerConnection(rtcConfiguration);
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log("🎥 Remote stream received!");
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
            setLoading(false);
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              consultationId,
              candidate: event.candidate,
            });
          }
        };

        // ✅ Socket events
        socket.on("user-joined", ({ role }) => {
          console.log("👤 User joined:", role);
          if (role === "patient") {
            setIsPatientJoined(true);
            
            // ✅ Create offer only ONCE when patient joins
            if (!offerCreatedRef.current) {
              setTimeout(async () => {
                try {
                  console.log("📞 Creating offer...");
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  socket.emit("call-user", {
                    consultationId,
                    offer,
                  });
                  offerCreatedRef.current = true;
                  console.log("📞 Offer sent to patient");
                } catch (err) {
                  console.error("Error creating offer:", err);
                }
              }, 1000);
            }
          }
        });

        socket.on("call-answered", async ({ answer }) => {
          console.log("📲 Call answered by patient");
          try {
            // ✅ Only set remote description if not already set
            if (pc.currentRemoteDescription === null) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              console.log("✅ Remote description set");
            }
          } catch (err) {
            console.error("Error setting remote description:", err);
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          try {
            if (candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        });

        socket.on("call-ended", () => {
          console.log("📴 Call ended by patient");
          setIsConnected(false);
          handleCleanup();
          navigate("/dashboard/provider/consultations", { replace: true });
        });

        // Join consultation room
        socket.emit("join-consultation", {
          consultationId,
          userId: "doctor",
          role: "doctor",
        });

        // Start timer
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

        setLoading(false);

      } catch (err) {
        console.error("❌ Setup error:", err);
        setError("Unable to access camera or microphone. Please check permissions.");
        setLoading(false);
      }
    };

    setupCall();

    return () => {
      mounted = false;
      socket.off("user-joined");
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
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    offerCreatedRef.current = false;
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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          }
        }
      }
      
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      if (screenTrack && peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
          setIsScreenSharing(true);
        } else {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
          setIsScreenSharing(true);
        }

        screenTrack.onended = () => {
          if (localStreamRef.current && peerConnectionRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            if (cameraTrack) {
              const senders = peerConnectionRef.current.getSenders();
              const videoSender = senders.find(s => s.track && s.track.kind === 'video');
              if (videoSender) {
                videoSender.replaceTrack(cameraTrack);
              }
            }
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
        };
      }
    } catch (error) {
      console.error("Screen sharing error:", error);
      alert("Screen sharing cancelled or not supported");
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    alert(isRecording ? "⏹️ Recording stopped" : "🔴 Recording started");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleEndCall = () => setShowEndDialog(true);

  const confirmEndCall = () => {
    setShowEndDialog(false);
    socket.emit("end-call", { consultationId });
    handleCleanup();
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/dashboard/provider/consultations", { replace: true });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      { sender: "doctor", message: newMessage, time: new Date().toLocaleTimeString() },
    ]);
    setNewMessage("");
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
        <p className="ml-3 text-gray-500">Connecting to patient...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : isPatientJoined ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm font-medium">
            {isConnected ? "Connected" : isPatientJoined ? "Patient ready" : "Waiting for patient..."}
          </span>
          <Badge className="bg-white/20 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
          <Badge className="bg-white/20 text-white border-0">
            <User className="h-3 w-3 mr-1" />
            {patientInfo.name}
          </Badge>
          {isScreenSharing && <Badge className="bg-blue-600 text-white border-0">📺 Sharing</Badge>}
          {isRecording && <Badge className="bg-red-600 text-white border-0 animate-pulse">🔴 Recording</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 bg-gray-900 relative">
        <div className="w-full h-full flex items-center justify-center">
          {isConnected ? (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
          ) : (
            <div className="flex flex-col items-center justify-center text-white">
              <User className="h-24 w-24 mb-3 opacity-50" />
              <p className="text-xl font-semibold">{isPatientJoined ? "Patient Ready" : "Waiting for Patient"}</p>
              <p className="text-sm text-gray-400">{isPatientJoined ? "Starting call..." : "Please wait..."}</p>
            </div>
          )}
        </div>

        {/* Local Video (PiP) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white/30 overflow-hidden">
          <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          <div className="absolute bottom-1 left-2 text-xs text-white/70">You {!isVideoOn && "(Video Off)"}</div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 p-3 rounded-full backdrop-blur-sm">
          <Button variant="ghost" size="icon" className={`text-white hover:bg-white/20 ${!isVideoOn ? "bg-red-600/80" : ""}`} onClick={toggleVideo}>
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className={`text-white hover:bg-white/20 ${!isAudioOn ? "bg-red-600/80" : ""}`} onClick={toggleAudio}>
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className={`text-white hover:bg-white/20 ${isScreenSharing ? "bg-blue-600/80" : ""}`} onClick={toggleScreenShare}>
            <ScreenShare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className={`text-white hover:bg-white/20 ${isRecording ? "bg-red-600/80" : ""}`} onClick={toggleRecording}>
            <div className={`h-3 w-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-white"}`} />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowNotes(!showNotes)}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleEndCall}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* End Call Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Consultation</DialogTitle>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Are you sure you want to end this consultation?</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="text-sm"><span className="font-medium">Duration:</span> {formatDuration(duration)}</div>
                <div className="text-sm"><span className="font-medium">Patient:</span> {patientInfo.name}</div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmEndCall}><PhoneOff className="h-4 w-4 mr-2" /> End Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderConsultationRoom;