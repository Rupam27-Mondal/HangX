package com.HangX.HangX_backend.payload;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request body for POST /api/v1/rooms (create room).
 *
 * password is optional — if omitted the server generates one automatically.
 * The plaintext password is returned exactly once in the response and then
 * discarded; only the BCrypt hash is persisted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {
    private String roomId;
    private String userName;
    private String password;   // optional; null = auto-generate
}
