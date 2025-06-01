package com.example.response;

import com.example.models.User;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AuthResponse {

    private String token;
    private String message;
    private User user;
    
    public AuthResponse (){
        // TODO Auto—generated constructor stub
    }

    public AuthResponse (String token,String message){
        this.token = token;
        this.message = message;
    }
    
    public AuthResponse (String token, String message, User user){
        this.token = token;
        this.message = message;
        this.user = user;
    }
    
    public void setToken (String token){
        this.token = token;
    }
    public String getToken(){
        return token;
    }
    public String getMessage(){
        return message;
    }
    public void setMessage (String message){
        this. message = message;
    }
    public User getUser(){
        return user;
    }
    public void setUser(User user){
        this.user = user;
    }
}
