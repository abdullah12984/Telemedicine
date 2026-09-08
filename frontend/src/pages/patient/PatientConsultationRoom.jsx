import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  User,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  MessageSquare,
  ScreenShare,
  StopCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PatientConsultationRoom = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Waiting for doctor...");
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isDoctorJoined, setIsDoctorJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "patient", message: "Hello doctor, I'm ready for the consultation.", time: new Date().toLocaleTimeString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [useMockVideo, setUseMockVideo] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);

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

    const startConsultation = async () => {
      try {
        setStatus("Starting consultation...");
        setLoading(true);
        setError("");
        setPermissionDenied(false);

        const useMock = localStorage.getItem('useMockVideo') === 'true';
        setUseMockVideo(useMock);

        let stream = null;

        // ✅ Check if we should use mock
        if (useMock) {
          setStatus("Using mock video stream (testing mode)...");
          
          // Create mock video stream
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          
          const drawMock = () => {
            ctx.fillStyle = '#4a90d9';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = 'white';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👤 Patient', 320, 240);
            ctx.font = '20px Arial';
            ctx.fillText(`Testing Mode`, 320, 300);
            ctx.font = '14px Arial';
            ctx.fillText(`⏱ ${new Date().toLocaleTimeString()}`, 320, 340);
          };
          drawMock();
          
          stream = canvas.captureStream(30);
          
          // ✅ Add mock audio
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const destination = audioContext.createMediaStreamDestination();
            oscillator.connect(destination);
            oscillator.frequency.value = 440;
            oscillator.start();
            const audioTrack = destination.stream.getAudioTracks()[0];
            if (audioTrack) {
              stream.addTrack(audioTrack);
            }
            // Keep oscillator running
            oscillator.onended = () => {};
          } catch (e) {
            console.log("Mock audio not available");
          }
          
          // ✅ Store stream
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            console.log("✅ Local mock video stream attached");
          }
          
          // ✅ CREATE WebRTC connection for mock mode too
          const peerConnection = new RTCPeerConnection(rtcConfiguration);
          peerConnectionRef.current = peerConnection;
          
          // ✅ Add local tracks
          stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
            console.log(`✅ Mock track added: ${track.kind}`);
          });
          
          // ✅ Handle remote stream
          peerConnection.ontrack = (event) => {
            console.log("🎥 Remote stream received (mock mode)");
            if (remoteVideoRef.current && event.streams[0]) {
              remoteVideoRef.current.srcObject = event.streams[0];
              setIsConnected(true);
              setStatus("Connected to doctor");
              setLoading(false);
            }
          };
          
          // ✅ ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("ice-candidate", {
                consultationId,
                candidate: event.candidate,
              });
            }
          };
          
          // ✅ Socket events for mock mode
          socket.on("user-joined", ({ role }) => {
            console.log("👤 User joined:", role);
            if (role === "doctor") {
              setIsDoctorJoined(true);
              setStatus("Doctor has joined. Waiting for call...");
            }
          });
          
          socket.on("incoming-call", async ({ offer }) => {
            console.log("📞 Incoming call from doctor");
            setStatus("Doctor is calling...");
            
            try {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
              );
              
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              
              socket.emit("call-answer", {
                consultationId,
                answer,
              });
              
              setStatus("Connecting to doctor...");
            } catch (err) {
              console.error("Error handling incoming call:", err);
            }
          });
          
          socket.on("call-answered", () => {
            console.log("📲 Call connected (mock mode)");
            setIsConnected(true);
            setStatus("Connected to doctor");
            setLoading(false);
          });
          
          socket.on("ice-candidate", async ({ candidate }) => {
            try {
              if (candidate) {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
              }
            } catch (error) {
              console.error("ICE candidate error:", error);
            }
          });
          
          socket.on("call-ended", () => {
            console.log("📴 Doctor ended the call");
            setIsConnected(false);
            setStatus("Doctor ended the consultation");
            handleCleanup();
          });
          
          // ✅ Join room
          socket.emit("join-consultation", {
            consultationId,
            userId: "patient",
            role: "patient",
          });
          
          setStatus("Waiting for doctor to join...");
          setLoading(false);
          return;
        }

        // ✅ Real camera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Your browser does not support camera/microphone access.");
          setLoading(false);
          return;
        }

        try {
          console.log("📷 Requesting camera access...");
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: "user", 
              width: { ideal: 640 }, 
              height: { ideal: 480 } 
            },
            audio: true,
          });
          console.log("✅ Camera stream acquired");
        } catch (err) {
          console.error("❌ Camera error:", err);
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setPermissionDenied(true);
            setError("Camera access denied. Would you like to use mock video for testing?");
            setLoading(false);
            return;
          } else if (err.name === "NotFoundError") {
            setError("No camera or microphone found. Please connect a device.");
            setLoading(false);
            return;
          } else {
            throw err;
          }
        }

        if (!stream || !mounted) return;

        localStreamRef.current = stream;
        setStatus("Camera and microphone connected");

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create WebRTC connection
        const peerConnection = new RTCPeerConnection(rtcConfiguration);
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
          console.log("🎥 Doctor stream received");
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
            setStatus("Connected to doctor");
            setLoading(false);
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              consultationId,
              candidate: event.candidate,
            });
          }
        };

        // Socket events
        socket.on("user-joined", ({ role }) => {
          console.log("👤 User joined:", role);
          if (role === "doctor") {
            setIsDoctorJoined(true);
            setStatus("Doctor has joined. Waiting for call...");
          }
        });

        socket.on("incoming-call", async ({ offer }) => {
          console.log("📞 Incoming call from doctor");
          setStatus("Doctor is calling...");

          try {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(offer)
            );

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit("call-answer", {
              consultationId,
              answer,
            });

            setStatus("Connecting to doctor...");
          } catch (err) {
            console.error("Error handling incoming call:", err);
            setError("Failed to connect to doctor. Please try again.");
          }
        });

        socket.on("call-answered", () => {
          console.log("📲 Call connected");
          setIsConnected(true);
          setStatus("Connected to doctor");
          setLoading(false);
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          try {
            if (candidate) {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          } catch (error) {
            console.error("ICE candidate error:", error);
          }
        });

        socket.on("call-ended", () => {
          console.log("📴 Doctor ended the call");
          setIsConnected(false);
          setStatus("Doctor ended the consultation");
          handleCleanup();
        });

        socket.on("user-disconnected", ({ role }) => {
          console.log(`👤 ${role} disconnected`);
          if (role === "doctor") {
            setIsDoctorJoined(false);
            setStatus("Doctor disconnected. Waiting for reconnection...");
          }
        });

        // Join consultation room
        socket.emit("join-consultation", {
          consultationId,
          userId: "patient",
          role: "patient",
        });

        setStatus("Waiting for doctor to join...");
        setLoading(false);

      } catch (error) {
        console.error("❌ Patient WebRTC error:", error);
        setError(error.message || "Failed to start consultation. Please try again.");
        setLoading(false);
      }
    };

    startConsultation();

    return () => {
      mounted = false;
      socket.off("user-joined");
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("user-disconnected");
      handleCleanup();
    };
  }, [consultationId]);

  const handleCleanup = () => {
    console.log("🧹 Cleaning up...");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 Track stopped: ${track.kind}`);
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(audioTrack.enabled);
    }
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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
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
      setIsScreenSharing(true);

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        const screenTrack = screenStream.getVideoTracks()[0];
        if (videoSender && screenTrack) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }
        if (localStreamRef.current && peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoSender && cameraTrack) {
            videoSender.replaceTrack(cameraTrack);
          }
        }
      };
    } catch (error) {
      console.error("Screen sharing error:", error);
      alert("Screen sharing cancelled or not supported");
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    alert(isRecording ? "⏹️ Recording stopped" : "🔴 Recording started");
  };

  const handleEndCall = () => setShowEndDialog(true);

  const confirmEndCall = () => {
    setShowEndDialog(false);
    socket.emit("end-call", { consultationId });
    handleCleanup();
    navigate("/dashboard/patient/appointments", { replace: true });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      { sender: "patient", message: newMessage, time: new Date().toLocaleTimeString() },
    ]);
    setNewMessage("");
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const enableMockVideo = () => {
    localStorage.setItem('useMockVideo', 'true');
    window.location.reload();
  };

  // ✅ Permission Denied UI
  if (permissionDenied) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Camera & Microphone Access Required</h2>
          <p className="text-gray-400 mb-4">
            This consultation requires access to your camera and microphone.
            Please allow access in your browser settings or use mock video for testing.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={enableMockVideo} className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
              🎭 Use Mock Video (Testing)
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6">
          <Alert variant="destructive" className="bg-red-900/50 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate(-1)} className="w-full mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 text-white rounded-t-lg border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : isDoctorJoined ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-sm font-medium">
            {isConnected ? "Connected" : isDoctorJoined ? "Doctor ready" : "Waiting for doctor..."}
          </span>
          <Badge className="bg-gray-700 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
          <Badge className="bg-gray-700 text-white border-0">
            <User className="h-3 w-3 mr-1" />
            Patient
          </Badge>
          {useMockVideo && <Badge className="bg-yellow-600 text-white border-0">🎭 Mock</Badge>}
          {isScreenSharing && <Badge className="bg-blue-600 text-white border-0">📺 Sharing</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video - Doctor */}
        <div className="w-full h-full flex items-center justify-center">
          {isConnected ? (
            <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
          ) : (
            <div className="flex flex-col items-center justify-center text-white">
              <User className="h-24 w-24 mb-3 opacity-50" />
              <p className="text-xl font-semibold">{isDoctorJoined ? "Doctor is connecting..." : "Waiting for Doctor"}</p>
              <p className="text-sm text-gray-400">{isDoctorJoined ? "Starting call..." : "Please wait..."}</p>
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
                <div className="text-sm">
                  <span className="font-medium">Duration:</span> {formatDuration(duration)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Doctor:</span> Doctor
                </div>
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

export default PatientConsultationRoom;