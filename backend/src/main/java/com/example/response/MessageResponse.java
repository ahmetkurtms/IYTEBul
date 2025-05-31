package com.example.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
} 