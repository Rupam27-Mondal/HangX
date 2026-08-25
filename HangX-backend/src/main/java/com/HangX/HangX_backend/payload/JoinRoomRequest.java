package com.HangX.HangX_backend.payload;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request body for POST /api/v1/rooms/{roomId}/join.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinRoomRequest {
    private String userName;
    private String password;
}
