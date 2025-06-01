const API_BASE_URL = 'http://localhost:8080/api/messages';

export interface MessageResponse {
  messageId: number;
  senderId: number;
  senderName: string;
  senderNickname: string;
  senderProfilePhoto?: string;
  receiverId: number;
  receiverName: string;
  receiverNickname: string;
  receiverProfilePhoto?: string;
  messageText: string;
  sentAt: string;
  isRead: boolean;
  imageBase64List?: string[];
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

export const messageApi = {
  // Get current user profile
  getCurrentUser: async (): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling getCurrentUser API...');
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/users/profile', {
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
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
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
      const response = await fetch(`${API_BASE_URL}/conversations`, {
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
      const response = await fetch(`${API_BASE_URL}/conversation/${userId}`, {
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
  sendMessage: async ({ receiverId, messageText, imageBase64List }: { receiverId: number, messageText: string, imageBase64List: string[] }) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling sendMessage API:', { receiverId, messageText, imageBase64List });
    try {
      const response = await fetch(`${API_BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          messageText,
          imageBase64List,
        }),
      });

      console.log('sendMessage response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('sendMessage error response:', errorText);
        throw new Error('Failed to send message');
      }
      console.log('sendMessage success');
    } catch (error) {
      console.error('sendMessage fetch error:', error);
      throw error;
    }
  },

  // Start a new conversation
  startConversation: async (userId: number, messageText: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    console.log('Calling startConversation API:', { userId, messageText });
    
    try {
      const response = await fetch(`${API_BASE_URL}/start-conversation/${userId}`, {
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
}; 