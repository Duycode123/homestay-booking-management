package backend.amenity.application.port.in;

import backend.amenity.domain.model.CommonAmenity;

import java.util.List;

public interface ListCommonAmenitiesUseCase {
    List<CommonAmenity> listActiveAmenities();
}
