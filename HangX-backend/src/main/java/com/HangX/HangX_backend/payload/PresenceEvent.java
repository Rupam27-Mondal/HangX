package com.HangX.HangX_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by a client when they join or leave a room.
 * Broadcast to all subscribers of the room's presence topic.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresenceEvent {
    private String sender;
    private boolean online;
    private String roomId;
}
