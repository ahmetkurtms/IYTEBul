package com.example.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long messageId;
    private Long senderId;
    private String senderName;
    private String senderNickname;
    private String senderProfilePhoto;
    private Long receiverId;
    private String receiverName;
    private String receiverNickname;
    private String receiverProfilePhoto;
    private String messageText;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private List<String> imageBase64List;
    
    // Referenced item/post information
    private Long referencedItemId;
    private String referencedItemTitle;
    private String referencedItemImage;
    private String referencedItemCategory;
    private String referencedItemType;
    
    // Reply fields
    private Long replyToMessageId;
    private String replyToMessageText;
    private String replyToSenderName;
    private List<String> replyToMessageImages;
} 