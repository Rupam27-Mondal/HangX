package com.HangX.HangX_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Validates Bearer JWTs on every protected request.
 *
 * Public paths (no token required):
 *   POST /api/v1/rooms           — create room
 *   POST /api/v1/rooms/{id}/join — join room
 *   POST /api/v1/admin/login     — admin login
 *   /chat/**                     — SockJS / STOMP
 *
 * Admin paths (/api/v1/admin/**):
 *   Require a valid JWT with role=ADMIN.  No room-scope check.
 *
 * Room paths (/api/v1/rooms/{roomId}/...):
 *   Require a valid JWT whose roomId claim matches the path segment.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // ── Public paths ───────────────────────────────────────────────────
        if (isPublicPath(request)) {
            chain.doFilter(request, response);
            return;
        }

        // ── Extract Bearer token ───────────────────────────────────────────
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            sendUnauthorized(response, "Missing or malformed Authorization header");
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtUtil.validateAndGetClaims(token);
            String username = claims.getSubject();
            String role     = claims.get("role", String.class);

            // ── Admin route ────────────────────────────────────────────────
            if (path.startsWith("/api/v1/admin/")) {
                if (!JwtUtil.ROLE_ADMIN.equals(role)) {
                    sendUnauthorized(response, "Admin access required");
                    return;
                }
                // Admin token is valid — no room-scope check needed
                authenticate(username, role);
                chain.doFilter(request, response);
                return;
            }

            // ── Room-scoped route ──────────────────────────────────────────
            String pathRoomId = extractRoomIdFromPath(path);
            String tokenRoomId = claims.get("roomId", String.class);

            if (pathRoomId != null && !pathRoomId.equals(tokenRoomId)) {
                sendUnauthorized(response, "Token is not valid for this room");
                return;
            }

            authenticate(username, role);

        } catch (JwtException | IllegalArgumentException e) {
            sendUnauthorized(response, "Invalid or expired token");
            return;
        }

        chain.doFilter(request, response);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void authenticate(String username, String role) {
        var auth = new UsernamePasswordAuthenticationToken(
                username, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER"))));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private boolean isPublicPath(HttpServletRequest req) {
        String path   = req.getServletPath();
        String method = req.getMethod();
        if ("POST".equals(method) && "/api/v1/rooms".equals(path))               return true;
        if ("POST".equals(method) && path.matches("/api/v1/rooms/[^/]+/join"))    return true;
        if ("POST".equals(method) && "/api/v1/admin/login".equals(path))         return true;
        if (path.startsWith("/chat"))                                              return true;
        return false;
    }

    private String extractRoomIdFromPath(String path) {
        if (path.startsWith("/api/v1/rooms/")) {
            String remainder = path.substring("/api/v1/rooms/".length());
            int slash = remainder.indexOf('/');
            if (slash == -1) return remainder.isEmpty() ? null : remainder;
            return remainder.substring(0, slash);
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
