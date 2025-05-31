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
    
    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
