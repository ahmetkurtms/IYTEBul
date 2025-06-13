package com.example.repository;

import com.example.models.UserReport;
import com.example.models.UserReport.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);
    List<UserReport> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(r) FROM UserReport r WHERE r.user.user_id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM UserReport r WHERE r.reporter.user_id = :reporterId ORDER BY r.createdAt DESC")
    List<UserReport> findByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT r FROM UserReport r WHERE r.user.user_id = :userId ORDER BY r.createdAt DESC")
    List<UserReport> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(r) > 0 FROM UserReport r WHERE :messageId MEMBER OF r.reportedMessageIds")
    boolean existsByReportedMessageId(@Param("messageId") Long messageId);
} 