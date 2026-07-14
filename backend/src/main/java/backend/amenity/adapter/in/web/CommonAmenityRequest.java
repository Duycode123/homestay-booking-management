package backend.amenity.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommonAmenityRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 500) String description,
        @Size(max = 60) String iconName,
        @Size(max = 500) String imageUrl,
        @Min(0) @Max(10000) Integer displayOrder,
        Boolean active
) {
}
