package com.HangX.HangX_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Broadcast to /topic/room/{roomId}/delete when a message is successfully deleted.
 * All connected clients use this to remove the message from their local state.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDeleteEvent {
    private String messageId;
    private String roomId;
    private String deletedBy;
}
