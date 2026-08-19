package com.HangX.HangX_backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@AllArgsConstructor
@NoArgsConstructor
@Data
public class Message {
    private String sender;
    private String content;
    private LocalDateTime timeStamp;

    private Message(String sender , String content){
        this.sender = sender;
        this.content = content;
        this.timeStamp = LocalDateTime.now();
    }

}
