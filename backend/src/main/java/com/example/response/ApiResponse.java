package com.example.response;

import lombok.Getter;

@Getter
public class ApiResponse {

    private String message;
    private boolean status;

    public ApiResponse(String message, boolean status) {
        super();
        this.message = message;
        this.status = status;
    }

    public void setMessage(String message) {
        this.message = message;
    }


    public void setStatus(boolean status) {
        this.status = status;
    }
}