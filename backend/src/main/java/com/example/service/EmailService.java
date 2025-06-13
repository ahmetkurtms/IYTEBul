package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("IYTEBul Email Verification Code");
            int year = java.time.Year.now().getValue();
            String htmlContent =
                "<div style='background:#f4f4f4;padding:40px 0;font-family:sans-serif;'>" +
                "  <div style='max-width:420px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px 24px;text-align:center;'>" +
                "    <img src='https://ceng.iyte.edu.tr/wp-content/uploads/sites/124/2017/11/iztech-logo-1.png' alt='IYTE Logo' style='width:90px;margin-bottom:16px;'>" +
                "    <h1 style='font-size:2.2rem;color:#9a0e20;margin:0 0 8px 0;font-weight:800;letter-spacing:1px;'>IYTEBul</h1>" +
                "    <h2 style='font-size:1.2rem;color:#222;margin:0 0 18px 0;font-weight:600;'>Email Verification Code</h2>" +
                "    <p style='color:#444;font-size:1rem;margin-bottom:24px;'>Please use the code below to verify your email address:</p>" +
                "    <div style='display:inline-block;background:#f8f8f8;border:2px solid #9a0e20;border-radius:12px;padding:18px 32px;margin-bottom:24px;'>" +
                "      <span style='font-size:2.1rem;letter-spacing:0.35em;font-family:monospace;color:#9a0e20;font-weight:bold;'>" + code + "</span>" +
                "    </div>" +
                "    <p style='color:#888;font-size:0.95rem;margin-top:24px;'>If you did not request this, you can ignore this email.</p>" +
                "  </div>" +
                "  <div style='text-align:center;color:#aaa;font-size:0.85rem;margin-top:32px;'>" +
                "    &copy; " + year + " IYTEBul" +
                "  </div>" +
                "</div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    public void sendBanNotification(String to, String nickname, String reason, String banExpiryStr) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("IYTEBul Account Suspension Notice");
            
            int year = java.time.Year.now().getValue();
            boolean isPermanent = "Kalıcı".equals(banExpiryStr);
            String banDuration = isPermanent ? "permanently" : "temporarily";
            
            String reasonText = reason != null && !reason.trim().isEmpty() 
                ? reason 
                : "Violation of community guidelines";
            
            String htmlContent =
                "<div style='background:#f4f4f4;padding:40px 0;font-family:sans-serif;'>" +
                "  <div style='max-width:500px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px 24px;'>" +
                "    <div style='text-align:center;margin-bottom:24px;'>" +
                "      <img src='https://ceng.iyte.edu.tr/wp-content/uploads/sites/124/2017/11/iztech-logo-1.png' alt='IYTE Logo' style='width:70px;margin-bottom:12px;'>" +
                "      <h1 style='font-size:2rem;color:#9a0e20;margin:0 0 6px 0;font-weight:800;letter-spacing:1px;'>IYTEBul</h1>" +
                "    </div>" +
                "    " +
                "    <div style='background:#fee2e2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;'>" +
                "      <h2 style='font-size:1.4rem;color:#dc2626;margin:0 0 12px 0;font-weight:700;'>⚠️ Account Suspended</h2>" +
                "      <p style='color:#7f1d1d;font-size:1.1rem;margin:0;font-weight:600;'>Your account has been " + banDuration + " suspended.</p>" +
                (isPermanent ? "" : "      <p style='color:#7f1d1d;font-size:1rem;margin:8px 0 0 0;font-weight:500;'>Suspension expires: <strong>" + banExpiryStr + "</strong></p>") +
                "    </div>" +
                "    " +
                "    <div style='margin-bottom:24px;'>" +
                "      <h3 style='color:#374151;font-size:1.1rem;margin:0 0 8px 0;font-weight:600;'>Hello " + nickname + ",</h3>" +
                "      <p style='color:#4b5563;font-size:1rem;line-height:1.6;margin:0 0 16px 0;'>Your IYTEBul account has been suspended due to the following reason:</p>" +
                "      " +
                "      <div style='background:#f9fafb;border-left:4px solid #9a0e20;padding:16px;margin:16px 0;'>" +
                "        <p style='color:#374151;font-size:1rem;margin:0;font-weight:500;'><strong>Reason:</strong> " + reasonText + "</p>" +
                "      </div>" +
                "    </div>" +
                "    " +
                "    <div style='background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:24px;'>" +
                "      <h4 style='color:#92400e;font-size:1rem;margin:0 0 8px 0;font-weight:600;'>⚠️ Important Warning</h4>" +
                "      <p style='color:#92400e;font-size:0.95rem;margin:0;line-height:1.5;'>If you violate our community guidelines again after this suspension, you will be banned for a longer period or permanently removed from the platform.</p>" +
                "    </div>" +
                "    " +
                "    <div style='text-align:center;margin-top:24px;'>" +
                "      <p style='color:#6b7280;font-size:0.9rem;line-height:1.5;margin:0;'>If you believe this suspension was made in error, please contact our administrators.</p>" +
                "    </div>" +
                "  </div>" +
                "  " +
                "  <div style='text-align:center;color:#9ca3af;font-size:0.85rem;margin-top:32px;'>" +
                "    &copy; " + year + " IYTEBul - İzmir Institute of Technology" +
                "  </div>" +
                "</div>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send ban notification email", e);
        }
    }

    public void sendPostMessageNotification(String to, String senderNickname, String postTitle, String messageText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("IYTEBul - New Message About Your Post");
            
            int year = java.time.Year.now().getValue();
            String truncatedMessage = messageText.length() > 100 ? messageText.substring(0, 100) + "..." : messageText;
            
            String htmlContent =
                "<div style='background:#f4f4f4;padding:40px 0;font-family:sans-serif;'>" +
                "  <div style='max-width:500px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px 24px;'>" +
                "    <div style='text-align:center;margin-bottom:24px;'>" +
                "      <img src='https://ceng.iyte.edu.tr/wp-content/uploads/sites/124/2017/11/iztech-logo-1.png' alt='IYTE Logo' style='width:70px;margin-bottom:12px;'>" +
                "      <h1 style='font-size:2rem;color:#9a0e20;margin:0 0 6px 0;font-weight:800;letter-spacing:1px;'>IYTEBul</h1>" +
                "    </div>" +
                "    " +
                "    <div style='background:#e1f5fe;border:1px solid #29b6f6;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;'>" +
                "      <h2 style='font-size:1.4rem;color:#0277bd;margin:0 0 12px 0;font-weight:700;'>📨 New Message About Your Post</h2>" +
                "      <p style='color:#0288d1;font-size:1.1rem;margin:0;font-weight:600;'>Someone sent a message about your post!</p>" +
                "    </div>" +
                "    " +
                "    <div style='margin-bottom:24px;'>" +
                "      <h3 style='color:#374151;font-size:1.1rem;margin:0 0 8px 0;font-weight:600;'>Hello!</h3>" +
                "      <p style='color:#4b5563;font-size:1rem;line-height:1.6;margin:0 0 16px 0;'><strong>" + senderNickname + "</strong> sent you a message about your post:</p>" +
                "      " +
                "      <div style='background:#f9fafb;border-left:4px solid #9a0e20;padding:16px;margin:16px 0;'>" +
                "        <p style='color:#374151;font-size:1rem;margin:0 0 8px 0;font-weight:600;'><strong>Post:</strong> " + postTitle + "</p>" +
                "        <p style='color:#374151;font-size:1rem;margin:0;font-weight:500;'><strong>Message:</strong> " + truncatedMessage + "</p>" +
                "      </div>" +
                "    </div>" +
                "    " +
                "    <div style='text-align:center;margin:24px 0;'>" +
                "      <a href='http://localhost:3000/messages' style='display:inline-block;background:#9a0e20;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;'>" +
                "        View Messages" +
                "      </a>" +
                "    </div>" +
                "    " +
                "    <div style='background:#fef3c7;border:1px solid:#fbbf24;border-radius:8px;padding:16px;margin-bottom:24px;'>" +
                "      <h4 style='color:#92400e;font-size:1rem;margin:0 0 8px 0;font-weight:600;'>💡 Tip</h4>" +
                "      <p style='color:#92400e;font-size:0.95rem;margin:0;line-height:1.5;'>You can disable these notifications in your profile settings if you prefer not to receive them.</p>" +
                "    </div>" +
                "    " +
                "    <div style='text-align:center;margin-top:24px;'>" +
                "      <p style='color:#6b7280;font-size:0.9rem;line-height:1.5;margin:0;'>You received this email because someone contacted you about your post on IYTEBul.</p>" +
                "    </div>" +
                "  </div>" +
                "  " +
                "  <div style='text-align:center;color:#9ca3af;font-size:0.85rem;margin-top:32px;'>" +
                "    &copy; " + year + " IYTEBul - İzmir Institute of Technology" +
                "  </div>" +
                "</div>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send post message notification email", e);
        }
    }
}