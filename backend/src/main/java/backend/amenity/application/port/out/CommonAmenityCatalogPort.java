package backend.amenity.application.port.out;

import backend.amenity.domain.model.CommonAmenity;

import java.util.List;
import java.util.Optional;

public interface CommonAmenityCatalogPort {
    List<CommonAmenity> findActiveAmenities();
    List<CommonAmenity> findAllAmenities();
    Optional<CommonAmenity> findById(Long id);
    boolean existsByName(String name);
    CommonAmenity save(CommonAmenity amenity);
    void delete(Long id);
}
