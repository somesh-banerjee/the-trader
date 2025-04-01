import { Body, Controller, Get, Post } from "@nestjs/common";
import { SocketService } from "./socket.service";

@Controller("socket")
export class SocketController {
  constructor(
    private readonly socketService: SocketService,
  ) {}

  @Post("connect")
  async connect() {
    try {
      await this.socketService.start();
      return { message: "WebSocket connection started." };
    } catch (error) {
      return { error: error.message };
    }
  }

    @Post("disconnect")
    async disconnect() {
        try {
            await this.socketService.disconnect();
            return { message: "WebSocket connection stopped." };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    @Post("reconnect")
    async reconnect() {
        try {
            await this.socketService.reconnect();
            return { message: "WebSocket connection re-established." };
        } catch (error) {
            return { error: error.message };
        }
    }

    @Get("status")
    async getStatus() {
        try {
            const status = await this.socketService.getConnectionStatus();
            return { status };
        } catch (error) {
            return { error: error.message };
        }
    }

}