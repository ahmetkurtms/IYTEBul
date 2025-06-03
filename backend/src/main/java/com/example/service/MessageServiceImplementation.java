package com.example.service;

import com.example.models.DeletedMessages;
import com.example.models.Messages;
import com.example.models.User;
import com.example.models.Item;
import com.example.repository.DeletedMessagesRepository;
import com.example.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;

@Service
public class MessageServiceImplementation implements MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private DeletedMessagesRepository deletedMessagesRepository;
    
    @Override
    public Messages sendMessage(User sender, User receiver, String messageText) {
        return sendMessage(sender, receiver, messageText, null);
    }
    
    @Override
    public Messages sendMessage(User sender, User receiver, String messageText, Item referencedItem) {
        Messages message = new Messages();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessageText(messageText);
        message.setIsRead(false);
        message.setReferencedItem(referencedItem);
        
        return messageRepository.save(message);
    }
    
    @Override
    public List<Messages> getMessagesBetweenUsers(User user1, User user2) {
        return messageRepository.findMessagesBetweenUsers(user1, user2);
    }
    
    @Override
    public List<Messages> getMessagesBetweenUsersExcludingDeleted(User user1, User user2, User currentUser) {
        return messageRepository.findMessagesBetweenUsersExcludingDeleted(user1, user2, currentUser);
    }
    
    @Override
    public List<Messages> getConversationsForUser(User user) {
        return messageRepository.findLatestConversations(user);
    }
    
    @Override
    public List<Messages> getConversationsForUserExcludingDeleted(User user) {
        try {
            List<Messages> allMessages = messageRepository.findLatestConversationsExcludingDeleted(user);
            
            if (allMessages == null || allMessages.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Group messages by conversation partner and get the latest message for each
            Map<Long, Messages> latestMessagesMap = new HashMap<>();
            
            for (Messages message : allMessages) {
                if (message == null) continue;
                
                if (message.getSender() == null || message.getReceiver() == null) {
                    System.out.println("WARNING: Message with null sender or receiver, skipping message ID: " + message.getMessageId());
                    continue;
                }
                
                Long otherUserId = message.getSender().getUser_id().equals(user.getUser_id()) 
                    ? message.getReceiver().getUser_id() 
                    : message.getSender().getUser_id();
                
                if (otherUserId == null) {
                    System.out.println("WARNING: Could not determine other user ID for message: " + message.getMessageId());
                    continue;
                }
                
                if (!latestMessagesMap.containsKey(otherUserId) || 
                    (message.getSentAt() != null && latestMessagesMap.get(otherUserId).getSentAt() != null &&
                     message.getSentAt().isAfter(latestMessagesMap.get(otherUserId).getSentAt()))) {
                    latestMessagesMap.put(otherUserId, message);
                }
            }
            
            return new ArrayList<>(latestMessagesMap.values());
        } catch (Exception e) {
            System.out.println("Error in getConversationsForUserExcludingDeleted: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    @Override
    public Long countUnreadMessages(User receiver, User sender) {
        return messageRepository.countUnreadMessages(receiver, sender);
    }
    
    @Override
    public Long countUnreadMessagesExcludingDeleted(User receiver, User sender) {
        return messageRepository.countUnreadMessagesExcludingDeleted(receiver, sender);
    }
    
    @Override
    @Transactional
    public void markMessagesAsRead(User receiver, User sender) {
        messageRepository.markMessagesAsRead(receiver, sender);
    }
    
    @Override
    public Messages getMessageById(Long messageId) {
        Optional<Messages> message = messageRepository.findById(messageId);
        return message.orElse(null);
    }
    
    @Override
    @Transactional
    public void clearMessagesBetweenUsers(User currentUser, User otherUser) {
        // Get all messages between the two users
        List<Messages> messages = messageRepository.findMessagesBetweenUsers(currentUser, otherUser);
        
        // Mark each message as deleted for the current user (soft delete)
        for (Messages message : messages) {
            // Check if this message is already marked as deleted for this user
            if (!deletedMessagesRepository.isMessageDeletedForUser(message, currentUser)) {
                DeletedMessages deletedMessage = new DeletedMessages(message, currentUser);
                deletedMessagesRepository.save(deletedMessage);
            }
        }
    }
} 