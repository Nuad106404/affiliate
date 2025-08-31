import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Send, Heart, Share2, Gift, X, MoreHorizontal, Volume2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isOwner?: boolean;
}

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

const LivePage: React.FC = () => {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when component mounts
  useEffect(() => {
    initializeCamera();
    
    // Simulate viewer count changes
    const viewerInterval = setInterval(() => {
      if (isLive) {
        setViewers(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      }
    }, 5000);

    return () => {
      clearInterval(viewerInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLive]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setViewers(Math.floor(Math.random() * 50) + 10);
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'System',
        message: `${user?.name} is now live!`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, welcomeMessage]);
    } else {
      setViewers(0);
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: user?.name || 'Anonymous',
      message: newMessage,
      timestamp: new Date(),
      isOwner: true
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate viewer responses
    setTimeout(() => {
      const responses = [
        'Great stream!',
        'Love this content!',
        'Keep it up!',
        'Amazing!',
        'So cool!',
        'Thanks for sharing!'
      ];
      
      const randomResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user: `Viewer${Math.floor(Math.random() * 100)}`,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, randomResponse]);
    }, 1000 + Math.random() * 3000);
  };

  const handleLike = () => {
    // Prevent multiple likes from same user
    if (hasLiked) return;
    
    setLikes(prev => prev + 1);
    setHasLiked(true);
    
    // Create floating heart animation
    const newHeart: FloatingHeart = {
      id: Date.now().toString(),
      x: Math.random() * 80 + 10, // Random position between 10% and 90%
      y: 100
    };
    
    setFloatingHearts(prev => [...prev, newHeart]);
    
    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* TikTok-style Full Screen Video */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-0' : ''}`}
        />
        
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <VideoOff className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Camera is off</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Hearts Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute animate-bounce"
            style={{
              left: `${heart.x}%`,
              bottom: `${heart.y}%`,
              animation: 'float-up 3s ease-out forwards'
            }}
          >
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          </div>
        ))}
      </div>

      {/* TikTok-style Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLive && (
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
            )}
            <div className="bg-black/30 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{viewers.toLocaleString()}</span>
            </div>
          </div>
          
          <button className="text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* TikTok-style Right Side Actions */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col space-y-6">
        {/* Profile */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={user?.avatar?.startsWith('/uploads/') 
                ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${user.avatar}` 
                : user?.avatar || '/default-avatar.svg'}
              alt={user?.name}
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
            {isLive && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex flex-col items-center space-y-1 text-white ${hasLiked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            hasLiked 
              ? 'bg-pink-600' 
              : 'bg-black/30 hover:bg-black/50'
          }`}>
            <Heart className={`w-7 h-7 ${hasLiked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-xs font-medium">{likes > 999 ? `${(likes/1000).toFixed(1)}K` : likes}</span>
        </button>

        {/* Comment Button */}
        <button className="flex flex-col items-center space-y-1 text-white">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium">{chatMessages.length}</span>
        </button>

        {/* Gift Button */}
        <button className="flex flex-col items-center space-y-1 text-white">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium">Gift</span>
        </button>

        {/* Share Button */}
        <button className="flex flex-col items-center space-y-1 text-white">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium">Share</span>
        </button>

        {/* More Button */}
        <button className="flex flex-col items-center space-y-1 text-white">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <MoreHorizontal className="w-7 h-7 text-white" />
          </div>
        </button>
      </div>

      {/* TikTok-style Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-white font-bold text-lg">@{user?.name}</h3>
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              LIVE
            </div>
          </div>
          <p className="text-white text-sm opacity-90 mb-3">
            {isLive ? 'Going live now! Join the conversation 🔥' : 'เริ่มต้นการไลฟ์'}
          </p>
        </div>

        {/* Floating Chat Messages */}
        <div className="mb-4 max-h-32 overflow-hidden">
          <div className="space-y-2">
            {chatMessages.slice(-3).map((msg) => (
              <div key={msg.id} className="bg-black/30 rounded-full px-3 py-2 max-w-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm font-medium">{msg.user}:</span>
                  <span className="text-white text-sm opacity-90">{msg.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-black/30 text-white placeholder-white/70 px-4 py-3 rounded-full border border-white/20 focus:outline-none focus:border-white/50"
              disabled={!isLive}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !isLive}
            className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* TikTok-style Bottom Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-4">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled 
              ? 'bg-white/20 text-white hover:bg-white/30' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
        
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled 
              ? 'bg-white/20 text-white hover:bg-white/30' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleLive}
          className={`px-6 py-3 rounded-full font-bold text-white transition-colors ${
            isLive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-pink-600 hover:bg-pink-700'
          }`}
        >
          {isLive ? 'End Live' : 'Go Live'}
        </button>

        <button className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* Custom CSS for floating animation */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-50px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LivePage;
