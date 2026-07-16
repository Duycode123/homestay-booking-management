package backend.addon.adapter.in.web.dto;

import backend.addon.domain.model.AddonSelection;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddonSelectionRequest(
        @NotNull Long serviceId,
        @Min(1) @Max(20) int quantity,
        @Size(max = 300) String note
) {
    public AddonSelection toDomain() { return new AddonSelection(serviceId, quantity, note); }
}
