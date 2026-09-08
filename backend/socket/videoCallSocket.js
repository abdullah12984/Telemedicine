// backend/socket/videoCallSocket.js
const registerVideoCallSocket = (io) => {
  // Room participants tracking: Map<roomId, Map<socketId, { role, userId }>>
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    let currentRoom = null;
    let currentRole = null;

    // Join consultation room
    socket.on("join-consultation", ({ consultationId, userId, role }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        if (rooms.has(currentRoom)) {
          rooms.get(currentRoom).delete(socket.id);
          if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);
        }
      }

      currentRoom = consultationId;
      currentRole = role?.toLowerCase();
      socket.join(consultationId);

      if (!rooms.has(consultationId)) {
        rooms.set(consultationId, new Map());
      }
      rooms.get(consultationId).set(socket.id, { role: currentRole, userId, socketId: socket.id });

      const participants = Array.from(rooms.get(consultationId).values());
      console.log(`👤 ${role} (${userId}) joined room ${consultationId}. Total participants:`, participants.length);

      // 1. Send existing participants to the joined user
      socket.emit("room-participants", { participants });

      // 2. Broadcast to other users in the room
      socket.to(consultationId).emit("user-joined", {
        userId,
        role: currentRole,
        socketId: socket.id,
      });

      // 3. If both doctor and patient are in the room, notify both!
      const hasDoctor = participants.some((p) => p.role === "doctor" || p.role === "provider");
      const hasPatient = participants.some((p) => p.role === "patient");

      if (hasDoctor && hasPatient) {
        console.log(`🎉 Both doctor and patient present in room ${consultationId}. Signaling ready!`);
        io.to(consultationId).emit("both-joined", {
          message: "Both users are connected!",
          participants,
        });
      }
    });

    // Doctor initiates call (sends offer)
    socket.on("call-user", ({ consultationId, offer }) => {
      console.log("📞 WebRTC offer forwarded to room:", consultationId);
      socket.to(consultationId).emit("incoming-call", {
        offer,
        from: socket.id,
      });
    });

    // Patient sends answer
    socket.on("call-answer", ({ consultationId, answer }) => {
      console.log("📲 WebRTC answer forwarded to room:", consultationId);
      socket.to(consultationId).emit("call-answered", {
        answer,
        from: socket.id,
      });
    });

    // ICE candidate exchange
    socket.on("ice-candidate", ({ consultationId, candidate }) => {
      socket.to(consultationId).emit("ice-candidate", {
        candidate,
        from: socket.id,
      });
    });

    // End call
    socket.on("end-call", ({ consultationId }) => {
      console.log("📴 Call ended:", consultationId);
      io.to(consultationId).emit("call-ended", { endedBy: socket.id });

      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.id);
        if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);
      }
      currentRoom = null;
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.id);
        if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);

        io.to(currentRoom).emit("user-disconnected", {
          socketId: socket.id,
          role: currentRole,
        });
        currentRoom = null;
      }
    });
  });
};

module.exports = registerVideoCallSocket;