package com.HangX.HangX_backend.controllers;

import com.HangX.HangX_backend.entity.Message;
import com.HangX.HangX_backend.entity.Room;
import com.HangX.HangX_backend.payload.MessageRequest;
import com.HangX.HangX_backend.payload.PresenceEvent;
import com.HangX.HangX_backend.payload.TypingEvent;
import com.HangX.HangX_backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;

@Controller
@RequestMapping
@CrossOrigin("http://localhost:5173")
public class ChatController {

    @Autowired
    private RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    /**
     * Handles an inbound chat message, persists it, and broadcasts it to all
     * subscribers of /topic/room/{roomId}.
     */
    @MessageMapping("/sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            MessageRequest request
    ) {
        Room room = roomRepository.findByRoomId(request.getRoomId());
        if (room == null) {
            throw new RuntimeException("Room not found: " + request.getRoomId());
        }

        Message message = new Message();
        message.setContent(request.getContent());
        message.setSender(request.getSender());
        message.setTimeStamp(LocalDateTime.now());

        room.getMessages().add(message);
        roomRepository.save(room);

        return message;
    }

    /**
     * Relays a typing event to all subscribers of /topic/room/{roomId}/typing.
     * Nothing is persisted — this is ephemeral signalling only.
     */
    @MessageMapping("/typing/{roomId}")
    @SendTo("/topic/room/{roomId}/typing")
    public TypingEvent handleTyping(
            @DestinationVariable String roomId,
            TypingEvent event
    ) {
        return event;
    }

    /**
     * Relays a presence (join/leave) event to all subscribers of
     * /topic/room/{roomId}/presence.
     * Nothing is persisted — presence is derived live from WebSocket connections.
     */
    @MessageMapping("/presence/{roomId}")
    @SendTo("/topic/room/{roomId}/presence")
    public PresenceEvent handlePresence(
            @DestinationVariable String roomId,
            PresenceEvent event
    ) {
        return event;
    }
}
