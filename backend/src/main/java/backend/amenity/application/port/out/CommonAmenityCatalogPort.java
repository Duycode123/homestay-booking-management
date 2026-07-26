package backend.amenity.application.port.out;

import backend.amenity.domain.model.CommonAmenity;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CommonAmenityCatalogPort {
    List<CommonAmenity> findActiveAmenities(Integer roomId);
    List<CommonAmenity> findAllAmenities();
    Optional<CommonAmenity> findById(Long id);
    boolean existsByName(String name);
    Set<Integer> findExistingRoomIds(Set<Integer> roomIds);
    CommonAmenity save(CommonAmenity amenity);
    void delete(Long id);
}
