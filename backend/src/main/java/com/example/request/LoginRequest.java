package com.example.request;

public class LoginRequest {
    private String uniMail;
    private String password;

    public LoginRequest(){
        // TODO Auto-generated constructor stub
    }

    public LoginRequest (String uniMail, String password) {
        super();
        this.uniMail = uniMail;
        this.password = password;
    }
    public String getUniMail(){
        return uniMail;
    }
    public String getPassword(){
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
    public void setUniMail(String uniMail) {
        this.uniMail = uniMail;
    }
}
