package backend.addon.adapter.in.web.dto;

import backend.addon.domain.model.AddonCatalogItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AddonCatalogRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 500) String description,
        @Size(max = 500) String imageUrl,
        @DecimalMin(value = "0", inclusive = false) BigDecimal price,
        @NotBlank @Size(max = 60) String unit,
        Integer roomTierId,
        boolean active
) {
    public AddonCatalogItem toDomain() {
        return new AddonCatalogItem(null, name, description, imageUrl, price, unit, roomTierId, null,
                active, null, null);
    }
}
