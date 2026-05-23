import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { EventBusService, ORDER_STATUS_CHANGED, OrderStatusChangedEvent } from '../../common/events/event-bus.js';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit(): void {
    this.eventBus.on(ORDER_STATUS_CHANGED, (event: OrderStatusChangedEvent) => {
      this.broadcastOrderStatusChange(event);
    });
  }

  afterInit(_server: Server): void {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth['token'] as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        client.disconnect(true);
        return;
      }
      const payload = this.jwtService.verify(token, { secret });
      (client as any).jwtPayload = payload;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket): void {}

  @SubscribeMessage('subscribe:order')
  async handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): Promise<void> {
    const payload = (client as any).jwtPayload;
    if (!payload) {
      client.disconnect(true);
      return;
    }
    await client.join('order:' + data.orderId);
  }

  private broadcastOrderStatusChange(event: OrderStatusChangedEvent): void {
    this.server.to('order:' + event.orderId).emit('order.status_changed', {
      orderId: event.orderId,
      status: event.toStatus,
      previousStatus: event.fromStatus,
    });
  }
}
