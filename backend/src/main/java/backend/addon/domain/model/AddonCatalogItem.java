package backend.addon.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AddonCatalogItem(
        Long id,
        String name,
        String description,
        String imageUrl,
        BigDecimal price,
        String unit,
        Integer roomTierId,
        String roomTierName,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
