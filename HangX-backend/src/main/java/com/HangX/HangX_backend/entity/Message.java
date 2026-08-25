package com.HangX.HangX_backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Message {

    /**
     * Unique identifier for this message.
     * Generated automatically on construction so it is always set when a message
     * is first created and persisted as part of the Room document.
     */
    private String messageId = UUID.randomUUID().toString();

    private String sender;
    private String content;
    private LocalDateTime timeStamp;
}
