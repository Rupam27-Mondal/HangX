package com.HangX.HangX_backend.payload;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Body for PUT /api/v1/admin/rooms/{roomId} — admin room update.
 * newRoomId: rename the room.
 * newPassword: reset the room password (optional; omit to leave unchanged).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomRequest {
    private String newRoomId;
    private String newPassword;
}
