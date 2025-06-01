package com.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.models.Report;
import com.example.models.Report.ReportStatus;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<Report> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(r) FROM Report r WHERE r.post.item_id = :postId")
    long countByPostId(@Param("postId") Long postId);

    @Query("SELECT r FROM Report r WHERE r.reporter.user_id = :reporterId ORDER BY r.createdAt DESC")
    List<Report> findByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT r FROM Report r WHERE r.post.item_id = :postId ORDER BY r.createdAt DESC")
    List<Report> findByPostId(@Param("postId") Long postId);
} 