import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected, joining user room with ID:', user.id);
      newSocket.emit('join-user-room', user.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for admin messages
    newSocket.on('admin-message', (messageData: any) => {
        console.log('Received message data:', messageData);
        Swal.fire({
          title: '',
          html: `
            <div style="text-align: center; padding: 20px 10px 10px 10px;">
              <div style="
                width: 80px; 
                height: 80px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 50%; 
                margin: 0 auto 24px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
              ">
                <svg width="36" height="36" fill="white" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                </svg>
              </div>
              
              <h2 style="
                font-size: 24px; 
                font-weight: 700; 
                color: #1f2937; 
                margin: 0 0 8px 0;
                line-height: 1.2;
              ">แจ้งเตือน</h2>
              
              
              <div style="
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 20px;
                margin: 0 auto 32px auto;
                max-width: 400px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              ">
                <p style="
                  color: #374151; 
                  font-size: 16px; 
                  line-height: 1.6; 
                  margin: 0;
                  font-weight: 400;
                  word-wrap: break-word;
                ">${messageData.content}</p>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'รับทราบ',
          confirmButtonColor: '#667eea',
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            popup: 'swal2-modern-popup',
            confirmButton: 'swal2-modern-button'
          },
          buttonsStyling: false,
          didOpen: () => {
            const popup = Swal.getPopup();
            if (popup) {
              popup.style.borderRadius = '20px';
              popup.style.border = 'none';
              popup.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              popup.style.padding = '0 0 20px 0';
              popup.style.overflow = 'hidden';
            }
            
            const confirmButton = Swal.getConfirmButton();
            if (confirmButton) {
              confirmButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              confirmButton.style.border = 'none';
              confirmButton.style.borderRadius = '12px';
              confirmButton.style.padding = '12px 32px';
              confirmButton.style.fontSize = '16px';
              confirmButton.style.fontWeight = '600';
              confirmButton.style.color = 'white';
              confirmButton.style.cursor = 'pointer';
              confirmButton.style.transition = 'all 0.3s ease';
              confirmButton.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.4)';
              confirmButton.style.margin = '0 auto';
              confirmButton.style.display = 'block';
              
              confirmButton.addEventListener('mouseenter', () => {
                confirmButton.style.transform = 'translateY(-2px)';
                confirmButton.style.boxShadow = '0 6px 20px 0 rgba(102, 126, 234, 0.5)';
              });
              
              confirmButton.addEventListener('mouseleave', () => {
                confirmButton.style.transform = 'translateY(0)';
                confirmButton.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.4)';
              });
            }
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            // Delete the message from database when user clicks "Got it"
            const messageId = messageData._id || messageData.id;
            console.log('Attempting to delete message with ID:', messageId);
            console.log('Message data object:', messageData);
            console.log('Using token:', localStorage.getItem('token'));
            
            if (!messageId) {
              console.error('Message ID is undefined, cannot delete');
              return;
            }
            
            try {
              const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/messages/delete/${messageId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('Delete response status:', response.status);
              
              if (response.ok) {
                const result = await response.json();
                console.log('Message deleted successfully:', result);
              } else {
                const errorData = await response.json();
                console.error('Failed to delete message:', response.status, errorData);
              }
            } catch (error) {
              console.error('Network error deleting message:', error);
            }
          }
        });
      });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};