const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let activeConnections = {}; 

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("identify", ({ role, name, email }) => {
    if (role === "admin") {
      socket.join("admin_room");
      console.log("Admin joined:", socket.id);
      socket.emit("active_users", Object.values(activeConnections));
    } else {
      activeConnections[socket.id] = { id: socket.id, name, email };
      socket.join(`user_room_${socket.id}`);
      io.to("admin_room").emit("user_connected", activeConnections[socket.id]);
    }
  });

  socket.on("user_message", (msg) => {
    io.to("admin_room").emit("receive_user_message", {
      from: socket.id,
      text: msg
    });
  });

  socket.on("admin_message", ({ to, text }) => {
    io.to(`user_room_${to}`).emit("receive_admin_message", text);
  });

  socket.on("disconnect", () => {
    if (activeConnections[socket.id]) {
      delete activeConnections[socket.id];
      io.to("admin_room").emit("user_disconnected", socket.id);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
