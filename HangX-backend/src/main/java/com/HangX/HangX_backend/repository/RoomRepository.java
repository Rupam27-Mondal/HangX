package com.HangX.HangX_backend.repository;

import com.HangX.HangX_backend.entity.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {

    Room findByRoomId(String id);
}
