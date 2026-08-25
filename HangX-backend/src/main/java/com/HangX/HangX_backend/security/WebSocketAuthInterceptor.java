package com.HangX.HangX_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * STOMP channel interceptor that validates the JWT on every CONNECT frame.
 *
 * Flow:
 *  1. Client connects to /chat with header  "Authorization: Bearer <token>"
 *  2. This interceptor fires on CONNECT, extracts the token, validates it.
 *  3. On success it sets the Principal on the STOMP session so subsequent
 *     SEND / SUBSCRIBE frames are associated with the authenticated user.
 *  4. On failure it throws an exception which closes the WebSocket connection
 *     before any subscription can be made.
 *
 * Non-CONNECT frames (SEND, SUBSCRIBE, etc.) are passed through — the session
 * is already authenticated by the time they arrive.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // Only validate on the initial CONNECT frame
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing Authorization header in STOMP CONNECT");
            }

            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateAndGetClaims(token);
                String username = claims.getSubject();

                // Attach the authenticated principal to the STOMP session
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                username, null, Collections.emptyList());
                accessor.setUser(auth);
                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (JwtException | IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid or expired JWT: " + e.getMessage());
            }
        }

        return message;
    }
}
