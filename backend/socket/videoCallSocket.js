const registerVideoCallSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    let currentRoom = null;
    let currentRole = null;

    // Join consultation room
    socket.on("join-consultation", ({ consultationId, userId, role }) => {
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
      }

      currentRoom = consultationId;
      currentRole = role;

      socket.join(consultationId);

      console.log(`👤 ${role} (${userId}) joined consultation: ${consultationId}`);

      // ✅ Tell everyone in the room that user joined
      io.to(consultationId).emit("user-joined", {
        userId,
        role,
        socketId: socket.id,
      });

      // ✅ If both users are in the room, notify them
      const room = io.sockets.adapter.rooms.get(consultationId);
      if (room) {
        const participants = Array.from(room);
        console.log(`👥 Participants in room ${consultationId}:`, participants);
        
        if (participants.length >= 2) {
          io.to(consultationId).emit("both-joined", {
            message: "Both users are connected!",
          });
        }
      }
    });

    // ✅ Doctor initiates call (sends offer)
    socket.on("call-user", ({ consultationId, offer }) => {
      console.log("📞 WebRTC offer received from doctor");
      
      // Send offer to patient (all other users in room)
      socket.to(consultationId).emit("incoming-call", {
        offer,
        from: socket.id,
      });
    });

    // ✅ Patient sends WebRTC answer
    socket.on("call-answer", ({ consultationId, answer }) => {
      console.log("📲 WebRTC answer received from patient");
      
      // Send answer back to doctor
      socket.to(consultationId).emit("call-answered", {
        answer,
        from: socket.id,
      });
    });

    // ✅ ICE candidate exchange
    socket.on("ice-candidate", ({ consultationId, candidate }) => {
      socket.to(consultationId).emit("ice-candidate", {
        candidate,
        from: socket.id,
      });
    });

    // ✅ End call
    socket.on("end-call", ({ consultationId }) => {
      console.log("📴 Call ended:", consultationId);
      io.to(consultationId).emit("call-ended", {
        endedBy: socket.id,
      });
      
      // Clean up room
      if (currentRoom) {
        socket.leave(currentRoom);
        currentRoom = null;
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      
      if (currentRoom) {
        io.to(currentRoom).emit("user-disconnected", {
          socketId: socket.id,
          role: currentRole,
        });
        socket.leave(currentRoom);
        currentRoom = null;
      }
    });
  });
};

module.exports = registerVideoCallSocket;