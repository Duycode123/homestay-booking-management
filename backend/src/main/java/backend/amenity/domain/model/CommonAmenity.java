package backend.amenity.domain.model;

public record CommonAmenity(
        Long id,
        String name,
        String description,
        String iconName,
        String imageUrl,
        Integer displayOrder,
        boolean active
) {
}
