package com.example.models;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "messages")
public class Messages {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;
    
    @ManyToOne
    @JoinColumn(name = "sender_id", referencedColumnName = "users_id", nullable = false)
    private User sender;
    
    @ManyToOne
    @JoinColumn(name = "receiver_id", referencedColumnName = "users_id", nullable = false)
    private User receiver;
    
    @Column(columnDefinition = "TEXT")
    private String messageText;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    // Item referansı - mesajın hangi post hakkında olduğunu belirtir
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "referenced_item_id", nullable = true)
    private Item referencedItem;
    
    // Reply referansı - bu mesajın hangi mesaja yanıt olduğunu belirtir
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reply_to_message_id", nullable = true)
    private Messages replyToMessage;
    
    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
