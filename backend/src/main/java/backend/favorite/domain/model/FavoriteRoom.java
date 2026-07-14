package backend.favorite.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FavoriteRoom(
        Integer roomId,
        String roomName,
        String roomType,
        Integer maxPeople,
        BigDecimal pricePerHour,
        String imageUrl,
        LocalDateTime addedAt
) {
}
