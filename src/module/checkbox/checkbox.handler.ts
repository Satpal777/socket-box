import type { Server, Socket } from "socket.io";
import { CheckboxDTO } from "./checkbox.dto.js";
import { checkboxService } from "./checkbox.service.js";
import { pub, CHANNELS } from "../../redis/redis.js";

export function registerCheckboxHandlers(io: Server, socket: Socket): void {

  checkboxService
    .getAll()
    .then((all) => socket.emit("checkbox:all", all))
    .catch((err) => {
      console.error("[checkbox] Failed to fetch on connect:", err);
      socket.emit("checkbox:error", { message: "Failed to load checkboxes." });
    });

  socket.on("checkbox:get_all", async () => {
    try {
      const all = await checkboxService.getAll();
      socket.emit("checkbox:all", all);
    } catch (err) {
      console.error("[checkbox] get_all error:", err);
      socket.emit("checkbox:error", { message: "Failed to load checkboxes." });
    }
  });

  socket.on("checkbox:update", async (data: unknown) => {
    const user = (socket as any).user;
    if (!user) {
      socket.emit("checkbox:error", { message: "Unauthorized" });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (user.exp && now > user.exp) {
      socket.emit("checkbox:error", { message: "Token expired" });
      socket.disconnect();
      return;
    }
    const { value, errors } = CheckboxDTO.safeValidate(data) as any;

    if (errors || !value) {
      socket.emit("checkbox:error", {
        message: `Validation failed: ${errors}`,
      });
      return;
    }

    try {
      const updated = await checkboxService.update(
        value.id,
        value.checked,
        value.userId
      );

      pub.publish(CHANNELS.checkboxUpdated, JSON.stringify(updated));
    } catch (err) {
      console.error("[checkbox] update error:", err);
      socket.emit("checkbox:error", {
        message: "Failed to update checkbox.",
      });
    }
  });
}