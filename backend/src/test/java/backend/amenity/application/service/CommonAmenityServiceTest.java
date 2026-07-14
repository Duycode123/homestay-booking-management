package backend.amenity.application.service;

import backend.amenity.application.port.out.CommonAmenityCatalogPort;
import backend.amenity.domain.model.CommonAmenity;
import backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommonAmenityServiceTest {

    @Mock
    private CommonAmenityCatalogPort port;

    @Test
    void createsActiveCommonAmenityWithNormalizedData() {
        CommonAmenityService service = new CommonAmenityService(port);
        when(port.save(any())).thenAnswer(invocation -> {
            CommonAmenity value = invocation.getArgument(0);
            return new CommonAmenity(1L, value.name(), value.description(), value.iconName(), value.imageUrl(), value.displayOrder(), value.active());
        });

        CommonAmenity result = service.create(
                "  Hồ bơi vô cực  ",
                "  Sử dụng miễn phí cho khách lưu trú.  ",
                "pool",
                "https://res.cloudinary.com/demo/image/upload/pool.jpg",
                10
        );

        assertEquals("Hồ bơi vô cực", result.name());
        assertEquals(10, result.displayOrder());
        assertEquals(true, result.active());
    }

    @Test
    void rejectsDuplicateCommonAmenityName() {
        CommonAmenityService service = new CommonAmenityService(port);
        when(port.existsByName("Sân vườn")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(
                "Sân vườn", "Không gian xanh dùng chung.", "garden", null, 20
        ));
    }

    @Test
    void rejectsDeletingMissingCommonAmenity() {
        CommonAmenityService service = new CommonAmenityService(port);
        when(port.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(99L));
        verify(port).findById(99L);
    }
}
