import { Server } from "socket.io";

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join room based on workspace ID
      socket.on("joinRoom", ({ workspaceId, position }) => {
        socket.join(workspaceId);
        socket.broadcast.to(workspaceId).emit("userJoined", { id: socket.id, position });

        // Check and assign position to avoid overlap
        io.to(socket.id).emit("assignPosition", position);

        // Handle position updates
        socket.on("move", (newPosition) => {
          socket.broadcast.to(workspaceId).emit("userMoved", { id: socket.id, position: newPosition });
        });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        io.emit("userDisconnected", socket.id);
      });
    });
  }
  res.end();
};

export default ioHandler;
