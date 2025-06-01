package com.example.request;

import lombok.Data;
import java.util.List;

@Data
public class SendMessageRequest {
    private Long receiverId;
    private String messageText;
    private List<String> imageBase64List;
} 