const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/messages`;

// Utility function to convert File to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export interface MessageResponse {
  messageId: number;
  messageText: string;
  senderId: number;
  senderName: string;
  senderNickname: string;
  senderProfilePhoto: string;
  receiverId: number;
  receiverName: string;
  receiverNickname: string;
  receiverProfilePhoto: string;
  sentAt: string;
  isRead: boolean;
  imageBase64List: string[];
  
  // Referenced item fields
  referencedItemId?: number;
  referencedItemTitle?: string;
  referencedItemImage?: string;
  referencedItemCategory?: string;
  referencedItemType?: string;
  
  // Reply fields
  replyToMessageId?: number;
  replyToMessageText?: string;
  replyToSenderName?: string;
  replyToMessageImages?: string[];
}

export interface ConversationResponse {
  conversationId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserNickname: string;
  otherUserProfilePhoto?: string;
  otherUserIsOnline: boolean;
  otherUserLastSeen: string;
  lastMessage: MessageResponse;
  unreadCount: number;
}

export interface UserProfile {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  profilePhotoUrl?: string;
}

export interface SendMessageRequest {
  receiverId: number;
  messageText: string;
  imageBase64List?: string[];
  referencedItemId?: number;
  replyToMessageId?: number;
}

export interface Message {
  messageId: number;
  messageText: string;
  senderId: number;  
  senderName: string;
  sentAt: string;
  isRead: boolean;
  imageUrls?: string[];
  itemId?: number;
  itemTitle?: string;
  itemImage?: string;
  itemCategory?: string;
  itemType?: string;
  replyToMessageId?: number;
  replyToMessageText?: string;
  replyToSenderName?: string;
}

export interface UserInfo {
  // Add any necessary properties for UserInfo
}

export const messageApi = {
  // Get current user profile
  getCurrentUser: async (): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getCurrentUser API...');
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getCurrentUser response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getCurrentUser error response:', errorText);
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      console.log('getCurrentUser success:', profile);
      
      return {
        userId: profile.id,
        name: profile.name,
        nickname: profile.nickname,
        email: profile.email,
        profilePhotoUrl: profile.profilePhotoUrl,
      };
    } catch (error) {
      console.error('getCurrentUser fetch error:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId: number): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getUserById API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getUserById response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getUserById error response:', errorText);
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      console.log('getUserById success:', user);
      
      return {
        userId: user.user_id,
        name: `${user.name} ${user.surname}`,
        nickname: user.nickname,
        email: user.uniMail,
        profilePhotoUrl: user.profilePhotoUrl,
      };
    } catch (error) {
      console.error('getUserById fetch error:', error);
      throw error;
    }
  },

  // Get all conversations for current user
  getConversations: async (): Promise<ConversationResponse[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getConversations API...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getConversations response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getConversations error response:', errorText);
        throw new Error('Failed to fetch conversations');
      }

      const conversations = await response.json();
      console.log('getConversations success:', conversations);
      
      return conversations;
    } catch (error) {
      console.error('getConversations fetch error:', error);
      throw error;
    }
  },

  // Get messages between current user and another user
  getMessagesWithUser: async (userId: number): Promise<MessageResponse[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getMessagesWithUser API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getMessagesWithUser response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('getMessagesWithUser error response:', errorText);
        throw new Error('Failed to fetch messages');
      }

      const messages = await response.json();
      console.log('getMessagesWithUser success:', messages);
      
      return messages;
    } catch (error) {
      console.error('getMessagesWithUser fetch error:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (receiverId: number, messageText: string, images?: File[], referencedItemId?: number, replyToMessageId?: number): Promise<Message> => {
    try {
      // Convert images to base64 if present
      const imageBase64List: string[] = [];
      if (images && images.length > 0) {
        for (const image of images) {
          const base64 = await convertFileToBase64(image);
          imageBase64List.push(base64);
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId,
          messageText,
          imageBase64List: imageBase64List.length > 0 ? imageBase64List : undefined,
          referencedItemId,
          replyToMessageId
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Message blocked - user may have blocked you');
        }
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Start a new conversation
  startConversation: async (userId: number, messageText: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling startConversation API:', { userId, messageText });
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/start-conversation/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageText,
        }),
      });

      console.log('startConversation response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Cannot start conversation - user blocked');
        }
        const errorText = await response.text();
        console.error('startConversation error response:', errorText);
        throw new Error('Failed to start conversation');
      }

      console.log('startConversation success');
    } catch (error) {
      console.error('startConversation fetch error:', error);
      throw error;
    }
  },

  // Clear all messages with a user
  clearMessages: async (userId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling clearMessages API for user:', userId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/clear/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('clearMessages response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('clearMessages error response:', errorText);
        throw new Error('Failed to clear messages');
      }

      console.log('clearMessages success');
    } catch (error) {
      console.error('clearMessages fetch error:', error);
      throw error;
    }
  },

  // Delete a specific message (backward compatibility)
  deleteMessage: async (messageId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling deleteMessage API for message:', messageId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('deleteMessage response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('deleteMessage error response:', errorText);
        throw new Error('Failed to delete message');
      }

      console.log('deleteMessage success');
    } catch (error) {
      console.error('deleteMessage fetch error:', error);
      throw error;
    }
  },

  // Delete a message for current user only (soft delete)
  deleteMessageForSelf: async (messageId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling deleteMessageForSelf API for message:', messageId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${messageId}/self`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('deleteMessageForSelf response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('deleteMessageForSelf error response:', errorText);
        throw new Error('Failed to delete message for self');
      }

      console.log('deleteMessageForSelf success');
    } catch (error) {
      console.error('deleteMessageForSelf fetch error:', error);
      throw error;
    }
  },

  // Delete a message for everyone (hard delete - only sender can do this)
  deleteMessageForEveryone: async (messageId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling deleteMessageForEveryone API for message:', messageId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${messageId}/everyone`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('deleteMessageForEveryone response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('deleteMessageForEveryone error response:', errorText);
        throw new Error('Failed to delete message for everyone');
      }

      console.log('deleteMessageForEveryone success');
    } catch (error) {
      console.error('deleteMessageForEveryone fetch error:', error);
      throw error;
    }
  },

  // Block a user
  blockUser: async (userId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling blockUser API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/block/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('blockUser response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('blockUser error response:', errorData);
        throw new Error(errorData.error || 'Failed to block user');
      }

      console.log('blockUser success');
    } catch (error) {
      console.error('blockUser fetch error:', error);
      throw error;
    }
  },

  // Unblock a user
  unblockUser: async (userId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling unblockUser API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/unblock/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('unblockUser response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('unblockUser error response:', errorData);
        throw new Error(errorData.error || 'Failed to unblock user');
      }

      console.log('unblockUser success');
    } catch (error) {
      console.error('unblockUser fetch error:', error);
      throw error;
    }
  },

  // Check if user is blocked
  isUserBlocked: async (userId: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling isUserBlocked API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/is-blocked/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('isUserBlocked response status:', response.status);
      
      if (!response.ok) {
        console.error('isUserBlocked error, returning false');
        return false;
      }

      const data = await response.json();
      console.log('isUserBlocked success:', data.isBlocked);
      return data.isBlocked;
    } catch (error) {
      console.error('isUserBlocked fetch error:', error);
      return false;
    }
  },

  // Check if I am blocked by this user
  amIBlockedByUser: async (userId: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling amIBlockedByUser API for user:', userId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/am-i-blocked-by/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('amIBlockedByUser response status:', response.status);
      
      if (!response.ok) {
        console.error('amIBlockedByUser error, returning false');
        return false;
      }

      const data = await response.json();
      console.log('amIBlockedByUser success:', data.isBlocked);
      return data.isBlocked;
    } catch (error) {
      console.error('amIBlockedByUser fetch error:', error);
      return false;
    }
  },

  // Get blocked users list
  getBlockedUsers: async (): Promise<any[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getBlockedUsers API');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/blocked-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('getBlockedUsers response status:', response.status);
      
      if (!response.ok) {
        console.error('getBlockedUsers error, returning empty array');
        return [];
      }

      const data = await response.json();
      console.log('getBlockedUsers success:', data);
      return data;
    } catch (error) {
      console.error('getBlockedUsers fetch error:', error);
      return [];
    }
  },
}; 