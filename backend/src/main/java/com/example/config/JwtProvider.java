package com.example.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import javax.crypto.SecretKey;
import java.util.Date;

public class JwtProvider {
    private static final String SECRET = "bu_64_karakterden_daha_uzun_bir_secret_key_olmalidir_bunu_degistiriniz_1234567890abcdef";
    private static final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
    public static String generateToken(Authentication auth){
        String email = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("USER");

        String jwt = Jwts.builder().setIssuer("Code").setIssuedAt(new Date())
                .setExpiration(new Date(new Date().getTime()+86400000))
                .claim("email",email).claim("role", role)
                .signWith(key).compact();
        return jwt;
    }
    public static String getEmailFromJwtToken(String jwt) {
        try {
            if (jwt.startsWith("Bearer ")) {
                jwt = jwt.substring(7); // Bearer kısmını kes
            }
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwt)
                    .getBody();

            return String.valueOf(claims.get("email"));
        } catch (Exception e) {
            e.printStackTrace();
            throw new BadCredentialsException("Invalid JWT token: " + e.getMessage());
        }
    }


}
