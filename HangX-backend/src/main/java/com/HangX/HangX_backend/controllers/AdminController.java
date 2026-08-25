package com.HangX.HangX_backend.controllers;

import com.HangX.HangX_backend.entity.Message;
import com.HangX.HangX_backend.entity.Room;
import com.HangX.HangX_backend.payload.*;
import com.HangX.HangX_backend.repository.RoomRepository;
import com.HangX.HangX_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only REST controller.
 *
 * All endpoints except /login require a valid admin JWT
 * (role=ADMIN in the token), enforced by JwtAuthFilter.
 *
 * Endpoints:
 *   POST   /api/v1/admin/login                              — verify admin password, get JWT
 *   GET    /api/v1/admin/rooms                              — list all rooms (summary)
 *   GET    /api/v1/admin/rooms/{roomId}                     — full room detail + messages
 *   PUT    /api/v1/admin/rooms/{roomId}                     — rename room / reset password
 *   DELETE /api/v1/admin/rooms/{roomId}                     — delete entire room
 *   DELETE /api/v1/admin/rooms/{roomId}/messages/{msgId}    — delete any message
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final RoomRepository roomRepository;
    private final JwtUtil        jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${hangx.admin.password}")
    private String adminPassword;

    public AdminController(RoomRepository roomRepository,
                           JwtUtil jwtUtil,
                           PasswordEncoder passwordEncoder) {
        this.roomRepository  = roomRepository;
        this.jwtUtil         = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Admin Login ───────────────────────────────────────────────────────────

    /**
     * POST /api/v1/admin/login
     * Body: { "password": "..." }
     *
     * Returns an admin JWT on success; 401 on wrong password.
     */
    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody AdminLoginRequest req) {
        if (req.getPassword() == null || !req.getPassword().equals(adminPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid admin password"));
        }
        String token = jwtUtil.generateAdminToken();
        return ResponseEntity.ok(Map.of("token", token));
    }

    // ── List all rooms ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/rooms
     * Returns a summary of every room (id, roomId, messageCount).
     */
    @GetMapping("/rooms")
    public ResponseEntity<List<RoomSummary>> listRooms() {
        List<RoomSummary> summaries = roomRepository.findAll().stream()
                .map(r -> new RoomSummary(r.getId(), r.getRoomId(), r.getMessages().size()))
                .toList();
        return ResponseEntity.ok(summaries);
    }

    // ── Get room detail ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/rooms/{roomId}
     * Returns full room info including all messages.
     */
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<?> getRoomDetail(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }
        RoomDetail detail = new RoomDetail(
                room.getId(),
                room.getRoomId(),
                room.getMessages().size(),
                room.getMessages()
        );
        return ResponseEntity.ok(detail);
    }

    // ── Update room ───────────────────────────────────────────────────────────

    /**
     * PUT /api/v1/admin/rooms/{roomId}
     * Body: { "newRoomId": "...", "newPassword": "..." }
     *
     * - newRoomId: renames the room (must be unique).
     * - newPassword: resets the BCrypt hash (optional — omit to leave as-is).
     */
    @PutMapping("/rooms/{roomId}")
    public ResponseEntity<?> updateRoom(@PathVariable String roomId,
                                        @RequestBody UpdateRoomRequest req) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }

        // Rename
        if (req.getNewRoomId() != null && !req.getNewRoomId().isBlank()
                && !req.getNewRoomId().trim().equals(roomId)) {
            if (roomRepository.findByRoomId(req.getNewRoomId().trim()) != null) {
                return ResponseEntity.badRequest().body("A room with that ID already exists");
            }
            room.setRoomId(req.getNewRoomId().trim());
        }

        // Reset password
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            room.setPasswordHash(passwordEncoder.encode(req.getNewPassword().trim()));
        }

        roomRepository.save(room);
        return ResponseEntity.ok(new RoomSummary(room.getId(), room.getRoomId(), room.getMessages().size()));
    }

    // ── Delete room ───────────────────────────────────────────────────────────

    /**
     * DELETE /api/v1/admin/rooms/{roomId}
     * Permanently deletes the room and all its messages.
     */
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }
        roomRepository.delete(room);
        return ResponseEntity.noContent().build();
    }

    // ── Delete a single message (admin override) ──────────────────────────────

    /**
     * DELETE /api/v1/admin/rooms/{roomId}/messages/{messageId}
     * Admin can delete any message regardless of who sent it.
     */
    @DeleteMapping("/rooms/{roomId}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String roomId,
                                           @PathVariable String messageId) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found");
        }

        List<Message> messages = room.getMessages();
        Message target = messages.stream()
                .filter(m -> messageId.equals(m.getMessageId()))
                .findFirst()
                .orElse(null);

        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Message not found");
        }

        messages.remove(target);
        roomRepository.save(room);
        return ResponseEntity.noContent().build();
    }
}
