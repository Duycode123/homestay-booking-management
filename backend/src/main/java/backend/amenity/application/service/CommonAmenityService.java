package backend.amenity.application.service;

import backend.amenity.application.port.in.ListCommonAmenitiesUseCase;
import backend.amenity.application.port.in.ManageCommonAmenitiesUseCase;
import backend.amenity.application.port.out.CommonAmenityCatalogPort;
import backend.amenity.domain.model.CommonAmenity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonAmenityService implements ListCommonAmenitiesUseCase, ManageCommonAmenitiesUseCase {

    private final CommonAmenityCatalogPort commonAmenityCatalogPort;

    @Override
    public List<CommonAmenity> listActiveAmenities(Integer roomId) {
        return commonAmenityCatalogPort.findActiveAmenities(roomId);
    }

    @Override
    public List<CommonAmenity> listAllAmenities() {
        return commonAmenityCatalogPort.findAllAmenities();
    }

    @Override
    @Transactional
    public CommonAmenity create(
            String name,
            String description,
            String iconName,
            String imageUrl,
            Integer displayOrder,
            List<Integer> roomIds
    ) {
        String normalizedName = required(name, "Tên tiện ích đi kèm không được để trống", 120);
        if (commonAmenityCatalogPort.existsByName(normalizedName)) {
            throw new IllegalArgumentException("Tên tiện ích đi kèm đã tồn tại");
        }
        List<Integer> normalizedRoomIds = validateRoomIds(roomIds);
        return commonAmenityCatalogPort.save(new CommonAmenity(
                null,
                normalizedName,
                required(description, "Mô tả tiện ích đi kèm không được để trống", 500),
                optional(iconName, 60, "facility"),
                optionalUrl(imageUrl),
                displayOrder == null ? 0 : displayOrder,
                true,
                normalizedRoomIds
        ));
    }

    @Override
    @Transactional
    public CommonAmenity update(
            Long id,
            String name,
            String description,
            String iconName,
            String imageUrl,
            Integer displayOrder,
            Boolean active,
            List<Integer> roomIds
    ) {
        CommonAmenity existing = commonAmenityCatalogPort.findById(id)
                .orElseThrow(() -> new backend.exception.ResourceNotFoundException("Không tìm thấy tiện ích đi kèm"));
        String normalizedName = required(name, "Tên tiện ích đi kèm không được để trống", 120);
        if (!existing.name().equalsIgnoreCase(normalizedName) && commonAmenityCatalogPort.existsByName(normalizedName)) {
            throw new IllegalArgumentException("Tên tiện ích đi kèm đã tồn tại");
        }
        List<Integer> normalizedRoomIds = validateRoomIds(roomIds);
        return commonAmenityCatalogPort.save(new CommonAmenity(
                id,
                normalizedName,
                required(description, "Mô tả tiện ích đi kèm không được để trống", 500),
                optional(iconName, 60, "facility"),
                optionalUrl(imageUrl),
                displayOrder == null ? existing.displayOrder() : displayOrder,
                active == null ? existing.active() : active,
                normalizedRoomIds
        ));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (commonAmenityCatalogPort.findById(id).isEmpty()) {
            throw new backend.exception.ResourceNotFoundException("Không tìm thấy tiện ích đi kèm");
        }
        commonAmenityCatalogPort.delete(id);
    }

    private List<Integer> validateRoomIds(List<Integer> roomIds) {
        if (roomIds == null || roomIds.isEmpty()) {
            throw new IllegalArgumentException("Tiện ích đi kèm phải được gắn cho ít nhất một homestay");
        }

        Set<Integer> normalizedIds = new LinkedHashSet<>();
        for (Integer roomId : roomIds) {
            if (roomId == null || roomId <= 0) {
                throw new IllegalArgumentException("Homestay được chọn không hợp lệ");
            }
            normalizedIds.add(roomId);
        }

        Set<Integer> existingIds = commonAmenityCatalogPort.findExistingRoomIds(normalizedIds);
        if (!existingIds.containsAll(normalizedIds)) {
            throw new IllegalArgumentException("Có homestay được chọn không tồn tại");
        }
        return List.copyOf(normalizedIds);
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
        if (normalized.length() > maxLength) throw new IllegalArgumentException("Dữ liệu vượt quá độ dài cho phép");
        return normalized;
    }

    private String optionalUrl(String value) {
        if (value == null || value.trim().isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > 500 || !normalized.matches("^https?://.+")) {
            throw new IllegalArgumentException("URL ảnh tiện ích không hợp lệ");
        }
        return normalized;
    }
}
