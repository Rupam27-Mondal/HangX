package com.HangX.HangX_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight room summary returned in the admin room list.
 * Never exposes the passwordHash.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummary {
    private String id;
    private String roomId;
    private int    messageCount;
}
