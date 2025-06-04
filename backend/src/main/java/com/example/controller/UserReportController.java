package com.example.controller;

import com.example.config.JwtProvider;
import com.example.models.User;
import com.example.models.UserReport;
import com.example.repository.UserReportRepository;
import com.example.repository.UserRepository;
import com.example.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user-reports")
public class UserReportController {

    private final UserReportRepository userReportRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse> createUserReport(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> reportRequest) {
        try {
            String email = JwtProvider.getEmailFromJwtToken(jwt.replace("Bearer ", ""));
            User reporter = userRepository.findUserByUniMail(email);

            if (reporter == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse("User not found", false));
            }

            // Get user ID from request
            Long userId = Long.valueOf(reportRequest.get("userId").toString());
            User reportedUser = userRepository.findById(userId).orElse(null);

            if (reportedUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("Reported user not found", false));
            }

            // Check if user is trying to report themselves
            if (reportedUser.getUser_id().equals(reporter.getUser_id())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse("You cannot report yourself", false));
            }

            // Create user report
            UserReport report = new UserReport();
            report.setUser(reportedUser);
            report.setReporter(reporter);
            report.setReason(reportRequest.get("reason").toString());

            if (reportRequest.get("description") != null) {
                report.setDescription(reportRequest.get("description").toString());
            }

            // Yeni eklenen alan: reportedMessageIds
            if (reportRequest.get("reportedMessageIds") != null) {
                Object idsObj = reportRequest.get("reportedMessageIds");
                java.util.List<Long> ids = new java.util.ArrayList<>();
                if (idsObj instanceof java.util.List<?>) {
                    for (Object id : (java.util.List<?>) idsObj) {
                        try {
                            ids.add(Long.valueOf(id.toString()));
                        } catch (Exception ignore) {}
                    }
                }
                report.setReportedMessageIds(ids);
            }

            userReportRepository.save(report);

            return ResponseEntity.ok(new ApiResponse("User report submitted successfully", true));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Failed to submit user report: " + e.getMessage(), false));
        }
    }
} 