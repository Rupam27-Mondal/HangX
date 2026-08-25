package com.HangX.HangX_backend.payload;

import com.HangX.HangX_backend.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Full room detail returned for the admin panel room view.
 * Never exposes the passwordHash.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomDetail {
    private String         id;
    private String         roomId;
    private int            messageCount;
    private List<Message>  messages;
}
