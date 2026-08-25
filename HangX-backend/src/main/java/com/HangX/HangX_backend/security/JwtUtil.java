package com.HangX.HangX_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Handles creation and validation of JWTs for both regular users and the admin.
 *
 * User token claims:   sub=username,  roomId=<id>,   role=USER
 * Admin token claims:  sub="admin",                  role=ADMIN
 */
@Component
public class JwtUtil {

    private static final long TOKEN_VALIDITY_MS = 24L * 60 * 60 * 1000; // 24 h

    public static final String ROLE_USER  = "USER";
    public static final String ROLE_ADMIN = "ADMIN";

    private final SecretKey signingKey;

    public JwtUtil(@Value("${hangx.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Issue ─────────────────────────────────────────────────────────────────

    /** Creates a JWT for a regular user scoped to a specific room. */
    public String generateToken(String username, String roomId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(username)
                .claim("roomId", roomId)
                .claim("role", ROLE_USER)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TOKEN_VALIDITY_MS))
                .signWith(signingKey)
                .compact();
    }

    /** Creates a JWT for the admin (no room scope, role=ADMIN). */
    public String generateAdminToken() {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject("admin")
                .claim("role", ROLE_ADMIN)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TOKEN_VALIDITY_MS))
                .signWith(signingKey)
                .compact();
    }

    // ── Validate ──────────────────────────────────────────────────────────────

    /** Parses and validates the token. Throws if invalid or expired. */
    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return validateAndGetClaims(token).getSubject();
    }

    public String extractRoomId(String token) {
        return validateAndGetClaims(token).get("roomId", String.class);
    }

    /** Returns true only if the token has role=ADMIN. */
    public boolean isAdminToken(String token) {
        try {
            Claims claims = validateAndGetClaims(token);
            return ROLE_ADMIN.equals(claims.get("role", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValidForRoom(String token, String roomId) {
        try {
            Claims claims = validateAndGetClaims(token);
            return roomId.equals(claims.get("roomId", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
