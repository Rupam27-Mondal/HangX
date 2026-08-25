package com.HangX.HangX_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by a client when their typing state changes.
 * Broadcast as-is to all other subscribers of the room's typing topic.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {
    private String sender;
    private boolean typing;
    private String roomId;
}
