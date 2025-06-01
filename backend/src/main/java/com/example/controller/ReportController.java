package com.example.controller;

import com.example.config.JwtProvider;
import com.example.models.Item;
import com.example.models.Report;
import com.example.models.User;
import com.example.repository.ItemRepository;
import com.example.repository.ReportRepository;
import com.example.repository.UserRepository;
import com.example.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;

    @PostMapping
    public ResponseEntity<ApiResponse> createReport(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> reportRequest) {
        try {
            String email = JwtProvider.getEmailFromJwtToken(jwt.replace("Bearer ", ""));
            User reporter = userRepository.findUserByUniMail(email);
            
            if (reporter == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }

            // Get post ID from request
            Long postId = Long.valueOf(reportRequest.get("postId").toString());
            Item post = itemRepository.findById(postId).orElse(null);
            
            if (post == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("Post not found", false));
            }

            // Check if user is trying to report their own post
            if (post.getUser().getUser_id().equals(reporter.getUser_id())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse("You cannot report your own post", false));
            }

            // Create report
            Report report = new Report();
            report.setPost(post);
            report.setReporter(reporter);
            report.setReason(reportRequest.get("reason").toString());
            
            if (reportRequest.get("description") != null) {
                report.setDescription(reportRequest.get("description").toString());
            }

            reportRepository.save(report);

            return ResponseEntity.ok(new ApiResponse("Report submitted successfully", true));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Failed to submit report: " + e.getMessage(), false));
        }
    }
} 