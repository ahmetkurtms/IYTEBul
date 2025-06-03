package com.example.controller;

import com.example.models.Messages;
import com.example.models.User;
import com.example.models.MessageImage;
import com.example.models.Item;
import com.example.request.SendMessageRequest;
import com.example.response.ApiResponse;
import com.example.response.ConversationResponse;
import com.example.response.MessageResponse;
import com.example.repository.MessageImageRepository;
import com.example.service.MessageService;
import com.example.service.UserService;
import com.example.service.ItemService;
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
    @Autowired
    private MessageImageRepository messageImageRepository;
    @Autowired
    private ItemService itemService;
    
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
            
            Item referencedItem = null;
            if (request.getReferencedItemId() != null) {
                try {
                    referencedItem = itemService.findItemById(request.getReferencedItemId());
                    if (referencedItem == null) {
                        System.out.println("Referenced item not found for ID: " + request.getReferencedItemId());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse("Referenced item not found", false));
                    }
                } catch (Exception e) {
                    System.out.println("Referenced item not found for ID: " + request.getReferencedItemId());
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse("Referenced item not found", false));
                }
            }
            
            // Find reply to message if provided
            Messages replyToMessage = null;
            if (request.getReplyToMessageId() != null) {
                replyToMessage = messageService.getMessageById(request.getReplyToMessageId());
                if (replyToMessage == null) {
                    System.out.println("Reply to message not found for ID: " + request.getReplyToMessageId());
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse("Reply to message not found", false));
                }
            }
            
            // Send the message
            Messages message = messageService.sendMessage(sender, receiver, request.getMessageText(), referencedItem, replyToMessage);
            System.out.println("Message sent successfully: " + message.getMessageId());
            // Save images if present
            if (request.getImageBase64List() != null) {
                for (String base64 : request.getImageBase64List()) {
                    MessageImage img = new MessageImage();
                    img.setMessage(message);
                    img.setImageBase64(base64);
                    messageImageRepository.save(img);
               }
            }
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
            System.out.println("Authentication: " + authentication);
            
            if (authentication == null) {
                System.out.println("Authentication is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            String currentUserEmail = authentication.getName();
            System.out.println("Current user email: " + currentUserEmail);
            
            if (currentUserEmail == null) {
                System.out.println("Current user email is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            User currentUser = userService.findUserByEmail(currentUserEmail);
            
            if (currentUser == null) {
                System.out.println("Current user not found for email: " + currentUserEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }
            
            System.out.println("Current user found: " + currentUser.getName() + " (ID: " + currentUser.getUser_id() + ")");
            
            List<Messages> latestMessages = messageService.getConversationsForUserExcludingDeleted(currentUser);
            System.out.println("Found " + latestMessages.size() + " conversations");
            
            List<ConversationResponse> conversations = new ArrayList<>();
            
            for (Messages message : latestMessages) {
                try {
                    if (message == null) {
                        System.out.println("WARNING: Null message in conversation list");
                        continue;
                    }
                    
                    if (message.getSender() == null || message.getReceiver() == null) {
                        System.out.println("WARNING: Message with null sender or receiver - ID: " + message.getMessageId());
                        continue;
                    }
                    
                    User otherUser = message.getSender().getUser_id().equals(currentUser.getUser_id()) 
                        ? message.getReceiver() : message.getSender();
                    
                    if (otherUser == null) {
                        System.out.println("WARNING: Other user is null for message ID: " + message.getMessageId());
                        continue;
                    }
                    
                    Long unreadCount = messageService.countUnreadMessagesExcludingDeleted(currentUser, otherUser);
                    if (unreadCount == null) {
                        unreadCount = 0L;
                    }
                    
                    MessageResponse lastMessageResponse = convertToMessageResponse(message, new ArrayList<>());
                    
                    if (lastMessageResponse == null) {
                        System.out.println("WARNING: Failed to convert message to response for message ID: " + message.getMessageId());
                        continue;
                    }
                    
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
                } catch (Exception innerException) {
                    System.out.println("Error processing conversation for message ID " + (message != null ? message.getMessageId() : "null") + ": " + innerException.getMessage());
                    innerException.printStackTrace();
                    // Continue with next message instead of failing entire request
                }
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
                messageResponses.add(convertToMessageResponse(message, new ArrayList<>()));
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
    
    // Delete a specific message
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse> deleteMessage(@PathVariable Long messageId) {
        try {
            System.out.println("=== DELETE MESSAGE REQUEST ===");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            User currentUser = userService.findUserByEmail(currentUserEmail);
            
            if (currentUser == null) {
                System.out.println("Current user not found for email: " + currentUserEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }
            
            System.out.println("Deleting message ID: " + messageId + " by user: " + currentUser.getName());
            
            // Delete the message
            messageService.deleteMessage(messageId, currentUser);
            
            return ResponseEntity.ok(new ApiResponse("Message deleted successfully", true));
            
        } catch (Exception e) {
            System.out.println("Error in deleteMessage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Error deleting message: " + e.getMessage(), false));
        }
    }
    
    private MessageResponse convertToMessageResponse(Messages message, List<String> imageUrls) {
        MessageResponse response = new MessageResponse();
        response.setMessageId(message.getMessageId());
        
        if (message.getSender() != null) {
            response.setSenderId(message.getSender().getUser_id());
            response.setSenderName(message.getSender().getName() + " " + message.getSender().getSurname());
            response.setSenderNickname(message.getSender().getNickname());
            response.setSenderProfilePhoto(message.getSender().getProfilePhotoUrl());
        }
        
        if (message.getReceiver() != null) {
            response.setReceiverId(message.getReceiver().getUser_id());
            response.setReceiverName(message.getReceiver().getName() + " " + message.getReceiver().getSurname());
            response.setReceiverNickname(message.getReceiver().getNickname());
            response.setReceiverProfilePhoto(message.getReceiver().getProfilePhotoUrl());
        }
        
        response.setMessageText(message.getMessageText());
        response.setSentAt(message.getSentAt());
        response.setIsRead(message.getIsRead());
        response.setImageBase64List(imageUrls);
        
        // Add referenced item information if present
        if (message.getReferencedItem() != null) {
            Item item = message.getReferencedItem();
            response.setReferencedItemId(item.getItem_id());
            response.setReferencedItemTitle(item.getTitle());
            response.setReferencedItemCategory(item.getCategory().toString());
            response.setReferencedItemType(item.getType().toString());
            
            // If item has no image, use default category image
            String itemImage = item.getImage();
            if (itemImage == null || itemImage.trim().isEmpty()) {
                // Use default category images based on category
                String category = item.getCategory().toString();
                switch (category) {
                    case "Electronics":
                        itemImage = "default_electronic";
                        break;
                    case "Clothing":
                        itemImage = "default_clothing";
                        break;
                    case "Cards":
                        itemImage = "default_cards";
                        break;
                    case "Accessories":
                        itemImage = "default_accessories";
                        break;
                    default:
                        itemImage = "default_other";
                        break;
                }
            }
            response.setReferencedItemImage(itemImage);
        }
        
        // Add reply information if present
        if (message.getReplyToMessage() != null) {
            Messages replyMessage = message.getReplyToMessage();
            response.setReplyToMessageId(replyMessage.getMessageId());
            response.setReplyToMessageText(replyMessage.getMessageText());
            if (replyMessage.getSender() != null) {
                response.setReplyToSenderName(replyMessage.getSender().getName());
            }
        }
        
        return response;
    }
} 