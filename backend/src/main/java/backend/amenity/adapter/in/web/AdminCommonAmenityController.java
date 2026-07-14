package backend.amenity.adapter.in.web;

import backend.amenity.application.port.in.ManageCommonAmenitiesUseCase;
import backend.amenity.domain.model.CommonAmenity;
import backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/common-amenities")
@RequiredArgsConstructor
public class AdminCommonAmenityController {
    private final ManageCommonAmenitiesUseCase useCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonAmenity>>> list() {
        return ResponseEntity.ok(success("Lay tien ich chung thanh cong", useCase.listAllAmenities()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommonAmenity>> create(@Valid @RequestBody CommonAmenityRequest request) {
        CommonAmenity result = useCase.create(request.name(), request.description(), request.iconName(), request.imageUrl(), request.displayOrder());
        return ResponseEntity.status(201).body(success("Them tien ich chung thanh cong", result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonAmenity>> update(@PathVariable Long id, @Valid @RequestBody CommonAmenityRequest request) {
        return ResponseEntity.ok(success("Cap nhat tien ich chung thanh cong", useCase.update(
                id, request.name(), request.description(), request.iconName(), request.imageUrl(), request.displayOrder(), request.active()
        )));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        useCase.delete(id);
        return ResponseEntity.ok(success("Xoa tien ich chung thanh cong", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
