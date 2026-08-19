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

    private List<Message> messages = new ArrayList<>();
}
