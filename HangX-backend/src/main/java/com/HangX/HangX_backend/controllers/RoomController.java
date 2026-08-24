package com.HangX.HangX_backend.controllers;


import com.HangX.HangX_backend.entity.Message;
import com.HangX.HangX_backend.entity.Room;
import com.HangX.HangX_backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RequestMapping("/api/v1/rooms")
@RestController
@CrossOrigin("http://localhost:5173")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    //create room

    @PostMapping()
    public ResponseEntity<?> createRoom(@RequestBody String roomId) {
        if(roomRepository.findByRoomId(roomId) != null) {
            return ResponseEntity.badRequest().body("Room already exists");
        }
        Room room = new Room();
        room.setRoomId(roomId);
        Room saveroom = roomRepository.save(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(saveroom);
    }

    //get room:join

    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found");
        }
        return ResponseEntity.ok().body(room);
    }

    //get messages of room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId ,
            @RequestParam(value = "page", defaultValue = "0" , required = false) int page ,
            @RequestParam(value = "size", defaultValue = "20" , required = false) int size
                                         ) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.badRequest().build() ;
        }

        List< Message> messages = room.getMessages();
        int start = Math.max(0 , messages.size() - (page + 1) * size);
        int end = Math.min(start + size, messages.size());
        List<Message> paginatedMessages = messages.subList(start, end);
        return ResponseEntity.ok(paginatedMessages);
    }

    //
}
