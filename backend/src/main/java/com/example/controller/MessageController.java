package com.example.controller;

import com.example.models.Messages;
import com.example.models.User;
import com.example.request.SendMessageRequest;
import com.example.response.ApiResponse;
import com.example.response.ConversationResponse;
import com.example.response.MessageResponse;
import com.example.service.MessageService;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private UserService userService;
    
    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Messages API is running");
    }
    
    // Send a new message
    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendMessage(@RequestBody SendMessageRequest request) {
        try {
            System.out.println("=== SEND MESSAGE REQUEST ===");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Authentication: " + authentication);
            String currentUserEmail = authentication.getName();
            System.out.println("Current user email: " + currentUserEmail);
            
            User sender = userService.findUserByEmail(currentUserEmail);
            
            if (sender == null) {
                System.out.println("Sender not found for email: " + currentUserEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }
            
            System.out.println("Sender found: " + sender.getName());
            
            User receiver;
            try {
                receiver = userService.findUserById(request.getReceiverId());
                System.out.println("Receiver found: " + receiver.getName());
            } catch (Exception e) {
                System.out.println("Receiver not found for ID: " + request.getReceiverId());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("Receiver not found", false));
            }
            
            Messages message = messageService.sendMessage(sender, receiver, request.getMessageText());
            System.out.println("Message sent successfully: " + message.getMessageId());
            
            return ResponseEntity.ok(new ApiResponse("Message sent successfully", true));
            
        } catch (Exception e) {
            System.out.println("Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Error sending message: " + e.getMessage(), false));
        }
    }
    
    // Get conversations for current user
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        try {
            System.out.println("=== GET CONVERSATIONS REQUEST ===");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Authentication object: " + authentication);
            
            if (authentication == null) {
                System.out.println("Authentication is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            System.out.println("Authentication class: " + authentication.getClass().getName());
            System.out.println("Is authenticated: " + authentication.isAuthenticated());
            System.out.println("Principal: " + authentication.getPrincipal());
            System.out.println("Name: " + authentication.getName());
            
            if (!authentication.isAuthenticated()) {
                System.out.println("User not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            String currentUserEmail = authentication.getName();
            System.out.println("Current user email: " + currentUserEmail);
            
            if (currentUserEmail == null || currentUserEmail.equals("anonymousUser")) {
                System.out.println("User email is null or anonymous");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            User currentUser = userService.findUserByEmail(currentUserEmail);
            
            if (currentUser == null) {
                System.out.println("User not found for email: " + currentUserEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            System.out.println("Current user found: " + currentUser.getName() + " (ID: " + currentUser.getUser_id() + ")");
            
            List<Messages> latestMessages = messageService.getConversationsForUserExcludingDeleted(currentUser);
            System.out.println("Found " + latestMessages.size() + " conversations");
            
            List<ConversationResponse> conversations = new ArrayList<>();
            
            for (Messages message : latestMessages) {
                User otherUser = message.getSender().getUser_id().equals(currentUser.getUser_id()) 
                    ? message.getReceiver() : message.getSender();
                
                Long unreadCount = messageService.countUnreadMessagesExcludingDeleted(currentUser, otherUser);
                
                MessageResponse lastMessageResponse = convertToMessageResponse(message);
                
                ConversationResponse conversation = new ConversationResponse();
                conversation.setConversationId(otherUser.getUser_id());
                conversation.setOtherUserId(otherUser.getUser_id());
                conversation.setOtherUserName(otherUser.getName() + " " + otherUser.getSurname());
                conversation.setOtherUserNickname(otherUser.getNickname());
                conversation.setOtherUserProfilePhoto(otherUser.getProfilePhotoUrl());
                conversation.setOtherUserIsOnline(true); // TODO: Implement online status
                conversation.setOtherUserLastSeen(LocalDateTime.now()); // TODO: Implement last seen
                conversation.setLastMessage(lastMessageResponse);
                conversation.setUnreadCount(unreadCount);
                
                conversations.add(conversation);
                System.out.println("Added conversation with: " + otherUser.getName());
            }
            
            System.out.println("Returning " + conversations.size() + " conversations");
            return ResponseEntity.ok(conversations);
            
        } catch (Exception e) {
            System.out.println("Error in getConversations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    // Get messages between current user and another user
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageResponse>> getMessagesWithUser(@PathVariable Long userId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = userService.findUserByEmail(currentUserEmail);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            User otherUser;
            try {
                otherUser = userService.findUserById(userId);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ArrayList<>());
            }
            
            List<Messages> messages = messageService.getMessagesBetweenUsersExcludingDeleted(currentUser, otherUser, currentUser);
            List<MessageResponse> messageResponses = new ArrayList<>();
            
            for (Messages message : messages) {
                messageResponses.add(convertToMessageResponse(message));
            }
            
            // Mark messages as read
            messageService.markMessagesAsRead(currentUser, otherUser);
            
            return ResponseEntity.ok(messageResponses);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
    
    // Start a new conversation (used when clicking "Send Message" from a post)
    @PostMapping("/start-conversation/{userId}")
    public ResponseEntity<ApiResponse> startConversation(@PathVariable Long userId, @RequestBody SendMessageRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User sender = userService.findUserByEmail(currentUserEmail);
            
            if (sender == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }
            
            User receiver;
            try {
                receiver = userService.findUserById(userId);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("User not found", false));
            }
            
            // Send the initial message
            Messages message = messageService.sendMessage(sender, receiver, request.getMessageText());
            
            return ResponseEntity.ok(new ApiResponse("Conversation started successfully", true));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Error starting conversation: " + e.getMessage(), false));
        }
    }
    
    // Clear all messages between current user and another user
    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<ApiResponse> clearMessages(@PathVariable Long userId) {
        try {
            System.out.println("=== CLEAR MESSAGES REQUEST ===");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = userService.findUserByEmail(currentUserEmail);
            
            if (currentUser == null) {
                System.out.println("Current user not found for email: " + currentUserEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }
            
            User otherUser;
            try {
                otherUser = userService.findUserById(userId);
                System.out.println("Other user found: " + otherUser.getName());
            } catch (Exception e) {
                System.out.println("Other user not found for ID: " + userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("User not found", false));
            }
            
            // Clear all messages between the two users
            messageService.clearMessagesBetweenUsers(currentUser, otherUser);
            System.out.println("Messages cleared successfully between " + currentUser.getName() + " and " + otherUser.getName());
            
            return ResponseEntity.ok(new ApiResponse("Messages cleared successfully", true));
            
        } catch (Exception e) {
            System.out.println("Error in clearMessages: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Error clearing messages: " + e.getMessage(), false));
        }
    }
    
    private MessageResponse convertToMessageResponse(Messages message) {
        MessageResponse response = new MessageResponse();
        response.setMessageId(message.getMessageId());
        response.setSenderId(message.getSender().getUser_id());
        response.setSenderName(message.getSender().getName() + " " + message.getSender().getSurname());
        response.setSenderNickname(message.getSender().getNickname());
        response.setSenderProfilePhoto(message.getSender().getProfilePhotoUrl());
        response.setReceiverId(message.getReceiver().getUser_id());
        response.setReceiverName(message.getReceiver().getName() + " " + message.getReceiver().getSurname());
        response.setReceiverNickname(message.getReceiver().getNickname());
        response.setReceiverProfilePhoto(message.getReceiver().getProfilePhotoUrl());
        response.setMessageText(message.getMessageText());
        response.setSentAt(message.getSentAt());
        response.setIsRead(message.getIsRead());
        return response;
    }
} 