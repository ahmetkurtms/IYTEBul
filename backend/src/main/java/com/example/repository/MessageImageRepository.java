package com.example.repository;

import com.example.models.MessageImage;
import com.example.models.Messages;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageImageRepository extends JpaRepository<MessageImage, Long> {
    List<MessageImage> findByMessage(Messages message);
}