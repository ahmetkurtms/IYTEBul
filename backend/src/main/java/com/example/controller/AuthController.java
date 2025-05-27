package com.example.controller;


import com.example.config.JwtProvider;
import com.example.models.Role;
import com.example.models.User;
import com.example.request.LoginRequest;
import com.example.repository.UserRepository;
import com.example.service.CustomUserDetailService;
import com.example.response.AuthResponse;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;
import com.example.service.EmailService;
import java.util.Random;

import java.time.LocalDateTime;


@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    //private final UserService userService;
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailService customUserDetail;
    private final EmailService emailService;


    @PostMapping("/signup")
    public AuthResponse createUser(@RequestBody User user) throws Exception{

        User isExist = userRepository.findUserByUniMail(user.getUniMail());
        if (isExist != null) {
            throw new Exception("This email already used with another account");
        }
        User nicknameExist = userRepository.findUserByNickname(user.getNickname());
        if (nicknameExist != null) {
            throw new Exception("This nickname already used with another account");
        }
        try {
            User newUser = new User();
            newUser.setUser_id(user.getUser_id());
            newUser.setName(capitalizeFirstLetter(user.getName()));
            newUser.setMiddle_name(user.getMiddle_name() != null ? capitalizeFirstLetter(user.getMiddle_name()) : null);
            newUser.setSurname(capitalizeFirstLetter(user.getSurname()));
            newUser.setNickname(user.getNickname());
            newUser.setBanned_status(false);
            newUser.setUniMail(user.getUniMail());
            newUser.setPassword(passwordEncoder.encode(user.getPassword()));
            newUser.setCreated_at(LocalDateTime.now());
            newUser.setRole(Role.USER);
            User savedUser = userRepository.save(newUser);
            Authentication authentication = new UsernamePasswordAuthenticationToken(savedUser.getUniMail(), savedUser.getPassword());

            String token = JwtProvider.generateToken(authentication);
            AuthResponse response = new AuthResponse(token, "Register Success");
            return response;
        } catch (Exception e) {
            log.error("Error occurred while registering user: ", e);
            throw new RuntimeException("Error occurred while registering user: " + e.getMessage());
        }


    }

    @PostMapping("/pre-register")
    public AuthResponse preRegister(@RequestBody User user) throws Exception {
        User isExist = userRepository.findUserByUniMail(user.getUniMail());
        if (isExist != null) {
            throw new Exception("This email already used with another account");
        }
        User nicknameExist = userRepository.findUserByNickname(user.getNickname());
        if (nicknameExist != null) {
            throw new Exception("This nickname already used with another account");
        }
        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(999999));
        User newUser = new User();
        newUser.setUser_id(user.getUser_id());
        newUser.setName(capitalizeFirstLetter(user.getName()));
        newUser.setMiddle_name(user.getMiddle_name() != null ? capitalizeFirstLetter(user.getMiddle_name()) : null);
        newUser.setSurname(capitalizeFirstLetter(user.getSurname()));
        newUser.setNickname(user.getNickname());
        newUser.setBanned_status(false);
        newUser.setUniMail(user.getUniMail());
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));
        newUser.setCreated_at(LocalDateTime.now());
        newUser.setRole(Role.USER);
        newUser.setIsVerified(false);
        newUser.setVerificationCode(code);
        userRepository.save(newUser);
        emailService.sendVerificationCode(user.getUniMail(), code);
        return new AuthResponse(null, "Verification code sent to your email.");
    }

    @PostMapping("/verify")
    public AuthResponse verify(@RequestBody VerifyRequest verifyRequest) {
        User user = userRepository.findUserByUniMail(verifyRequest.getEmail());
        if (user == null) {
            return new AuthResponse(null, "User not found.");
        }
        if (user.getIsVerified() != null && user.getIsVerified()) {
            return new AuthResponse(null, "User already verified.");
        }
        if (user.getVerificationCode() != null && user.getVerificationCode().equals(verifyRequest.getCode())) {
            user.setIsVerified(true);
            user.setVerificationCode(null);
            userRepository.save(user);
            return new AuthResponse(null, "Email verified. You can now log in.");
        } else {
            return new AuthResponse(null, "Invalid verification code.");
        }
    }

    @PostMapping("/login")
    public AuthResponse signin (@RequestBody LoginRequest loginRequest) {
        User user = userRepository.findUserByUniMail(loginRequest.getUniMail());
        if (user == null || user.getIsVerified() == null || !user.getIsVerified()) {
            throw new BadCredentialsException("Email is not verified.");
        }
        Authentication authentication = authenticate(loginRequest.getUniMail(), loginRequest.getPassword());
        String token = JwtProvider.generateToken(authentication);
        AuthResponse res = new AuthResponse(token, "Login Success");
        return res;
    }

    @PostMapping("/forgot-password")
    public AuthResponse forgotPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findUserByUniMail(email);
        if (user == null) {
            return new AuthResponse(null, "No user found with this email.");
        }
        // Generate 6-digit code
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setVerificationCode(code);
        userRepository.save(user);
        // Log: DB'ye yazıldı mı?
        User checkUser = userRepository.findUserByUniMail(email);
        System.out.println("[FORGOT-PASSWORD] Email: " + email + ", Code sent: " + code + ", Code in DB: " + checkUser.getVerificationCode());
        emailService.sendVerificationCode(email, code);
        return new AuthResponse(null, "Verification code sent to your email.");
    }

    @PostMapping("/reset-password")
    public AuthResponse resetPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");
        User user = userRepository.findUserByUniMail(email);
        if (user == null) {
            return new AuthResponse(null, "No user found with this email.");
        }
        String codeInDb = user.getVerificationCode() != null ? user.getVerificationCode().trim() : null;
        String codeFromUser = code != null ? code.trim() : null;
        System.out.println("[RESET-PASSWORD] Email: " + email + ", Code in DB: " + codeInDb + ", Code from user: " + codeFromUser);
        if (codeInDb != null && codeInDb.equals(codeFromUser)) {
            if (newPassword == null || newPassword.isEmpty()) {
                // Sadece kod doğrulama için istek geldi
                return new AuthResponse(null, "Code valid.");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setVerificationCode(null);
            userRepository.save(user);
            return new AuthResponse(null, "Password reset successful. You can now log in.");
        } else {
            return new AuthResponse(null, "Invalid verification code.");
        }
    }

    @PostMapping("/resend-verification")
    public AuthResponse resendVerification(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findUserByUniMail(email);
        if (user == null) {
            return new AuthResponse(null, "User not found.");
        }
        // Yeni kod üret ve gönder (verified olsa bile)
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setVerificationCode(code);
        userRepository.save(user);
        emailService.sendVerificationCode(email, code);
        return new AuthResponse(null, "Verification code sent again!");
    }

    private Authentication authenticate(String uniMail, String password) {
        UserDetails userDetails = customUserDetail.loadUserByUsername(uniMail);

        if(userDetails==null) {
            throw  new BadCredentialsException("Invalid Username!");
        }
        if(!passwordEncoder.matches(password, userDetails.getPassword())){
            throw  new BadCredentialsException("Password Mismatch!");
        }
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    private String capitalizeFirstLetter(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}

class VerifyRequest {
    private String email;
    private String code;
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
