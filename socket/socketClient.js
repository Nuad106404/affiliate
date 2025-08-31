const { io } = require('socket.io-client');

class SocketClient {
  constructor(url = 'http://localhost:4000') {
    this.socket = null;
    this.url = url;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Send admin message to user
  sendAdminMessage(recipientId, message, sender, messageId) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send-admin-message', {
      recipientId,
      message,
      sender,
      messageId
    });

    return true;
  }

  // Send notification
  sendNotification(userId, notification) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send-notification', {
      userId,
      notification
    });

    return true;
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
}

module.exports = SocketClient;
