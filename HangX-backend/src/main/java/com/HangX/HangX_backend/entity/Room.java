package com.HangX.HangX_backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    private String id;

    private String roomId;

    /**
     * BCrypt hash of the room password.
     * The plaintext password is NEVER stored; it is returned once on creation
     * and then discarded.  All subsequent join attempts are verified with
     * BCryptPasswordEncoder.matches().
     */
    private String passwordHash;

    private List<Message> messages = new ArrayList<>();
}
