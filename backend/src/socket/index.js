import { Server } from "socket.io";
import { authenticate } from "../middleware/authenticate.js";
import { createMessageGateway } from "./message-gateway.js";

export function attachSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  const messageGateway = createMessageGateway(io);

  io.use((socket, next) => {
    const authorization = socket.handshake.auth?.token
      ? `Bearer ${socket.handshake.auth.token}`
      : socket.handshake.headers.authorization;

    const req = { headers: { authorization } };
    const res = {
      status() {
        return this;
      },
      json(payload) {
        next(new Error(payload.error || "Unauthorized"));
      }
    };

    authenticate(req, res, () => {
      socket.data.user = req.user;
      next();
    });
  });

  io.on("connection", (socket) => {
    socket.on("join_room", ({ room_type, room_id }) => {
      socket.join(`${room_type}:${room_id}`);
    });

    socket.on("leave_room", ({ room_type, room_id }) => {
      socket.leave(`${room_type}:${room_id}`);
    });

    socket.on("typing_start", ({ room_id }) => {
      socket.broadcast.emit("user_typing", {
        room_id,
        user_id: socket.data.user.id,
        user_name: socket.data.user.name
      });
    });

    socket.on("typing_stop", () => {});

    socket.on("read_messages", ({ room_id, up_to_message_id }) => {
      socket.broadcast.emit("messages_read", {
        room_id,
        user_id: socket.data.user.id,
        up_to_message_id
      });
    });

    socket.on("send_message", async (payload) => {
      try {
        await messageGateway.processUserMessage({
          userId: socket.data.user.id,
          roomType: payload.room_type,
          roomId: payload.room_id,
          content: payload.content ?? null,
          mediaUrl: payload.media_url ?? null,
          mediaType: payload.media_type ?? null,
          transport: "socket"
        });
      } catch (error) {
        socket.emit("error", {
          code: "SEND_FAILED",
          message: error.message
        });
      }
    });
  });

  return { io, messageGateway };
}
