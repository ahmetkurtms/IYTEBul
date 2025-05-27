package com.example.response;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AuthResponse {

    private String token;
    private String message;
    public AuthResponse (){
        // TODO Auto—generated constructor stub
    }

    public AuthResponse (String token,String message){
        this.token = token;
        this.message = message;
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
}
