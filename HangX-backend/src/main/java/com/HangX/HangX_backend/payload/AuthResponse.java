package com.HangX.HangX_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Returned by both create-room and join-room on success.
 *
 * token        — signed JWT the client must attach as "Authorization: Bearer <token>"
 *                on every subsequent REST call and in the STOMP connect headers.
 * roomId       — confirmed room identifier.
 * userName     — confirmed username.
 * generatedPassword — present ONLY on room creation if the password was
 *                     auto-generated.  Null on join responses and on create
 *                     responses where the caller supplied their own password.
 *                     The client must show this to the user and warn that it
 *                     will not be shown again.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String roomId;
    private String userName;
    private String generatedPassword;   // non-null only on auto-generate
}
