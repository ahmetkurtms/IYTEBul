package com.example.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
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
             if(jwt!=null){
                 try{
                     String email = JwtProvider.getEmailFromJwtToken(jwt);
                     List<GrantedAuthority> authorities = new ArrayList<>();
                     Authentication authentication = new UsernamePasswordAuthenticationToken(email, authorities);
                     SecurityContextHolder.getContext().setAuthentication(authentication);


                 } catch (Exception e){
                    throw new BadCredentialsException("invalid token");
                 }
             }

             filterChain.doFilter(request, response);
    }
}
