package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

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
}