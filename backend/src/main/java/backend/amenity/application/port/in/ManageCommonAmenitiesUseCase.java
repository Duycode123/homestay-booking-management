package backend.amenity.application.port.in;

import backend.amenity.domain.model.CommonAmenity;

import java.util.List;

public interface ManageCommonAmenitiesUseCase {
    List<CommonAmenity> listAllAmenities();
    CommonAmenity create(String name, String description, String iconName, String imageUrl, Integer displayOrder);
    CommonAmenity update(Long id, String name, String description, String iconName, String imageUrl, Integer displayOrder, Boolean active);
    void delete(Long id);
}
