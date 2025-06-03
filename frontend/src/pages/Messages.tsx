'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiSearch, FiSend, FiMoreVertical, FiPaperclip, FiSmile, FiMessageCircle, FiX, FiImage, FiChevronUp, FiChevronDown, FiCamera, FiTrash2, FiCornerUpLeft } from 'react-icons/fi';
import { BsCheck, BsCheckAll, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import Image from 'next/image';
import { messageApi, MessageResponse, ConversationResponse, UserProfile } from '@/lib/messageApi';

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
  imageBase64List?: string[];
  
  // Referenced item information
  referencedItemId?: number;
  referencedItemTitle?: string;
  referencedItemImage?: string;
  referencedItemCategory?: string;
  referencedItemType?: string;
  
  // Reply information
  replyToMessageId?: number;
  replyToMessageText?: string;
  replyToSenderName?: string;
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
  const [isMounted, setIsMounted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Message hover states
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Fix hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await messageApi.sendMessage(
        selectedConversation.user.id, 
        newMessage, 
        undefined, // images
        undefined, // referencedItemId
        replyToMessage ? replyToMessage.id : undefined
      );
      
      setNewMessage('');
      setReplyToMessage(null);
      // Refresh messages here...
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle deleting a specific message
  const handleDeleteMessage = async (messageId: number) => {
    try {
      console.log('Deleting message:', messageId);
      
      // Call backend API to delete message
      await messageApi.deleteMessage(messageId);
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      console.log('Message deleted successfully');
      
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading || !isMounted) {
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
        <div className="w-80 bg-[#f7f7f7] border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-[#f7f7f7]">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className="flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{conversation.user.nickname}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-[#f7f7f7]">
                <h2 className="font-semibold text-gray-900">{selectedConversation.user.nickname}</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                      onMouseEnter={() => setHoveredMessageId(message.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {/* Action buttons - shown on hover */}
                      {hoveredMessageId === message.id && (
                        <div className={`flex items-center space-x-1 ${isCurrentUser ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                            title="Reply"
                          >
                            <FiCornerUpLeft className="w-3 h-3 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <FiTrash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      )}
                      
                      <div
                        className={`relative max-w-xs lg:max-w-md px-4 py-2 shadow transition-all duration-300 ${
                          isCurrentUser
                            ? 'bg-[#A6292A] text-white self-end rounded-tl-lg rounded-tr-2xl rounded-bl-lg rounded-br-md order-2'
                            : 'bg-[#f1f0f0] text-gray-900 self-start rounded-tl-2xl rounded-tr-lg rounded-br-lg rounded-bl-2xl order-1'
                        }`}
                      >
                        {/* Reply Preview */}
                        {message.replyToMessageId && (
                          <div className={`mb-2 border-l-4 pl-3 py-2 rounded-r ${
                            isCurrentUser 
                              ? 'border-white/30 bg-white/10' 
                              : 'border-gray-300 bg-gray-100'
                          }`}>
                            <div className={`text-xs font-medium mb-1 ${
                              isCurrentUser ? 'text-white/70' : 'text-gray-600'
                            }`}>
                              {message.replyToSenderName}
                            </div>
                            <div className={`text-xs ${
                              isCurrentUser ? 'text-white/80' : 'text-gray-700'
                            }`}>
                              {message.replyToMessageText && message.replyToMessageText.length > 100
                                ? `${message.replyToMessageText.substring(0, 100)}...`
                                : message.replyToMessageText
                              }
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                {/* Reply Preview */}
                {replyToMessage && (
                  <div className="mb-3 p-3 bg-gray-50 border-l-4 border-[#A6292A] rounded-r">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        Replying to {replyToMessage.senderId === currentUser?.id ? 'yourself' : selectedConversation.user.nickname}
                      </span>
                      <button
                        onClick={cancelReply}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <FiX className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {replyToMessage.content}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full bg-white rounded-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#A6292A] focus:border-[#A6292A] placeholder-gray-500 text-gray-900 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-2 rounded-full ml-2 transition-colors ${
                      newMessage.trim()
                        ? 'bg-[#A6292A] text-white hover:bg-[#8a1f1f] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
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
                  Select a conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 