package backend.addon.adapter.in.web.dto;

import backend.addon.domain.model.AddonCatalogItem;
import java.math.BigDecimal;

public record AddonCatalogResponse(Long id, String name, String description, String imageUrl, BigDecimal price,
                                   String unit, Integer roomTierId, String roomTierName, boolean active) {
    public static AddonCatalogResponse from(AddonCatalogItem item) {
        return new AddonCatalogResponse(item.id(), item.name(), item.description(), item.imageUrl(), item.price(),
                item.unit(), item.roomTierId(), item.roomTierName(), item.active());
    }
}
