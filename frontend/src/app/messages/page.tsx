'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiSearch, FiSend, FiMoreVertical, FiPhone, FiVideo, FiPaperclip, FiSmile } from 'react-icons/fi';
import { BsCheck, BsCheckAll } from 'react-icons/bs';
import Image from 'next/image';

interface User {
  id: number;
  nickname: string;
  name: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  isSent: boolean;
}

interface Conversation {
  id: number;
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Mock current user
    setCurrentUser({
      id: 1,
      nickname: 'currentuser',
      name: 'Current User',
      profilePhotoUrl: undefined,
      isOnline: true
    });

    // Mock conversations
    const mockConversations: Conversation[] = [
      {
        id: 1,
        user: {
          id: 2,
          nickname: 'kedimedi',
          name: 'Ahmet Yılmaz',
          profilePhotoUrl: undefined,
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        lastMessage: {
          id: 1,
          senderId: 2,
          receiverId: 1,
          content: 'I lost my blue jacket, have you seen it?',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isRead: false,
          isSent: true
        },
        unreadCount: 2
      },
      {
        id: 2,
        user: {
          id: 3,
          nickname: 'student123',
          name: 'Elif Demir',
          profilePhotoUrl: undefined,
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        lastMessage: {
          id: 2,
          senderId: 1,
          receiverId: 3,
          content: 'Thank you, I will come tomorrow',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        unreadCount: 0
      },
      {
        id: 3,
        user: {
          id: 4,
          nickname: 'techguy',
          name: 'Mehmet Kaya',
          profilePhotoUrl: undefined,
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        lastMessage: {
          id: 3,
          senderId: 4,
          receiverId: 1,
          content: 'I found a laptop bag, is it yours?',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        unreadCount: 0
      }
    ];

    setConversations(mockConversations);
    setLoading(false);
  }, [router]);

  // Mock messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      const mockMessages: Message[] = [
        {
          id: 1,
          senderId: selectedConversation.user.id,
          receiverId: 1,
          content: 'Hello! I saw your lost item post.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        {
          id: 2,
          senderId: 1,
          receiverId: selectedConversation.user.id,
          content: 'Hello! Which item are we talking about?',
          timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        {
          id: 3,
          senderId: selectedConversation.user.id,
          receiverId: 1,
          content: 'I lost my blue jacket, have you seen it?',
          timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        {
          id: 4,
          senderId: 1,
          receiverId: selectedConversation.user.id,
          content: 'Which building did you lose it in? I will keep an eye out.',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isRead: true,
          isSent: true
        },
        {
          id: 5,
          senderId: selectedConversation.user.id,
          receiverId: 1,
          content: 'In the Computer Engineering building, I might have left it somewhere on the 3rd floor.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isRead: false,
          isSent: true
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now(),
      senderId: 1,
      receiverId: selectedConversation.user.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      isSent: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close options menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showOptionsMenu && optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOptionsMenu]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9a0e20] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#9a0e20] to-[#7a0b19]">
            <h1 className="text-xl font-bold text-white mb-3">Messages</h1>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-[#f8d7da]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {conversation.user.profilePhotoUrl ? (
                        <Image
                          src={conversation.user.profilePhotoUrl}
                          alt={conversation.user.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {conversation.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.user.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.lastMessage && formatDistanceToNow(
                          new Date(conversation.lastMessage.timestamp),
                          { addSuffix: true, locale: enUS }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-[#9a0e20] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {selectedConversation.user.profilePhotoUrl ? (
                        <Image
                          src={selectedConversation.user.profilePhotoUrl}
                          alt={selectedConversation.user.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {selectedConversation.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {selectedConversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.user.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.user.isOnline ? 'Online' : 
                        `Last seen: ${formatDistanceToNow(new Date(selectedConversation.user.lastSeen || ''), { addSuffix: true, locale: enUS })}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative" ref={optionsMenuRef}>
                    <button 
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiMoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Options Dropdown Menu */}
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            // Handle clear messages
                            setMessages([]);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Clear Messages</span>
                        </button>
                        <button
                          onClick={() => {
                            // Handle block user
                            alert(`${selectedConversation?.user.name} has been blocked`);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <span>🚫</span>
                          <span>Block User</span>
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            // Handle report user
                            alert(`${selectedConversation?.user.name} has been reported`);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors flex items-center space-x-2"
                        >
                          <span>⚠️</span>
                          <span>Report User</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 1 ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === 1
                          ? 'bg-[#9a0e20] text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.senderId === 1 ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.senderId === 1 && (
                          <div className="text-xs">
                            {message.isRead ? (
                              <BsCheckAll className="w-4 h-4 text-blue-300" />
                            ) : (
                              <BsCheck className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiPaperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent placeholder-gray-500 text-gray-900"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-2 rounded-lg transition-colors ${
                      newMessage.trim()
                        ? 'bg-[#9a0e20] text-white hover:bg-[#7a0b19]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start Messaging
                </h3>
                <p className="text-gray-600">
                  Select a conversation or start a new message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 