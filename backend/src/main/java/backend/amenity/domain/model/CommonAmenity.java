package backend.amenity.domain.model;

import java.util.List;

public record CommonAmenity(
        Long id,
        String name,
        String description,
        String iconName,
        String imageUrl,
        Integer displayOrder,
        boolean active,
        List<Integer> roomIds
) {
}
