package com.example.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.Authentication;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;


public class jwtValidator extends OncePerRequestFilter {


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
             String jwt = request.getHeader(JwtConstant.JWT_HEADER);
             System.out.println("=== JWT VALIDATOR ===");
             System.out.println("Request URI: " + request.getRequestURI());
             System.out.println("JWT Header: " + jwt);
             
             if(jwt != null && jwt.startsWith("Bearer ")){
                 try{
                     String email = JwtProvider.getEmailFromJwtToken(jwt);
                     System.out.println("Extracted email from JWT: " + email);
                     
                     List<GrantedAuthority> authorities = new ArrayList<>();
                     authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                     
                     Authentication authentication = new UsernamePasswordAuthenticationToken(email, null, authorities);
                     SecurityContextHolder.getContext().setAuthentication(authentication);
                     System.out.println("Authentication set for user: " + email);

                 } catch (Exception e){
                     System.out.println("JWT validation failed: " + e.getMessage());
                     throw new BadCredentialsException("invalid token");
                 }
             } else {
                 System.out.println("No valid JWT found, proceeding without authentication");
             }

             filterChain.doFilter(request, response);
    }
}
