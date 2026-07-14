package backend.amenity.application.service;

import backend.amenity.application.port.in.ListCommonAmenitiesUseCase;
import backend.amenity.application.port.in.ManageCommonAmenitiesUseCase;
import backend.amenity.application.port.out.CommonAmenityCatalogPort;
import backend.amenity.domain.model.CommonAmenity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonAmenityService implements ListCommonAmenitiesUseCase, ManageCommonAmenitiesUseCase {

    private final CommonAmenityCatalogPort commonAmenityCatalogPort;

    @Override
    public List<CommonAmenity> listActiveAmenities() {
        return commonAmenityCatalogPort.findActiveAmenities();
    }

    @Override
    public List<CommonAmenity> listAllAmenities() {
        return commonAmenityCatalogPort.findAllAmenities();
    }

    @Override
    @Transactional
    public CommonAmenity create(String name, String description, String iconName, String imageUrl, Integer displayOrder) {
        String normalizedName = required(name, "Ten tien ich chung khong duoc de trong", 120);
        if (commonAmenityCatalogPort.existsByName(normalizedName)) {
            throw new IllegalArgumentException("Ten tien ich chung da ton tai");
        }
        return commonAmenityCatalogPort.save(new CommonAmenity(
                null,
                normalizedName,
                required(description, "Mo ta tien ich chung khong duoc de trong", 500),
                optional(iconName, 60, "facility"),
                optionalUrl(imageUrl),
                displayOrder == null ? 0 : displayOrder,
                true
        ));
    }

    @Override
    @Transactional
    public CommonAmenity update(Long id, String name, String description, String iconName, String imageUrl, Integer displayOrder, Boolean active) {
        CommonAmenity existing = commonAmenityCatalogPort.findById(id)
                .orElseThrow(() -> new backend.exception.ResourceNotFoundException("Khong tim thay tien ich chung"));
        String normalizedName = required(name, "Ten tien ich chung khong duoc de trong", 120);
        if (!existing.name().equalsIgnoreCase(normalizedName) && commonAmenityCatalogPort.existsByName(normalizedName)) {
            throw new IllegalArgumentException("Ten tien ich chung da ton tai");
        }
        return commonAmenityCatalogPort.save(new CommonAmenity(
                id,
                normalizedName,
                required(description, "Mo ta tien ich chung khong duoc de trong", 500),
                optional(iconName, 60, "facility"),
                optionalUrl(imageUrl),
                displayOrder == null ? existing.displayOrder() : displayOrder,
                active == null ? existing.active() : active
        ));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (commonAmenityCatalogPort.findById(id).isEmpty()) {
            throw new backend.exception.ResourceNotFoundException("Khong tim thay tien ich chung");
        }
        commonAmenityCatalogPort.delete(id);
    }

    private String required(String value, String message, int maxLength) {
        if (value == null || value.trim().isBlank()) throw new IllegalArgumentException(message);
        String normalized = value.trim();
        if (normalized.length() > maxLength) throw new IllegalArgumentException(message);
        return normalized;
    }

    private String optional(String value, int maxLength, String fallback) {
        if (value == null || value.trim().isBlank()) return fallback;
        String normalized = value.trim();
        if (normalized.length() > maxLength) throw new IllegalArgumentException("Du lieu vuot qua do dai cho phep");
        return normalized;
    }

    private String optionalUrl(String value) {
        if (value == null || value.trim().isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > 500 || !normalized.matches("^https?://.+")) {
            throw new IllegalArgumentException("URL anh tien ich khong hop le");
        }
        return normalized;
    }
}
