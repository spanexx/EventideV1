import { Injectable } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';

@Injectable()
export class WebsocketsService {
  constructor(private readonly websocketsGateway: WebsocketsGateway) {}

  emitToRoom(room: string, event: string, data: any): void {
    this.websocketsGateway.emitToRoom(room, event, data);
  }

  emitToAll(event: string, data: any): void {
    this.websocketsGateway.emitToAll(event, data);
  }
}