package backend.amenity.adapter.in.web;

import backend.amenity.application.port.in.ListCommonAmenitiesUseCase;
import backend.amenity.domain.model.CommonAmenity;
import backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms/common-amenities")
@RequiredArgsConstructor
public class CommonAmenityController {
    private final ListCommonAmenitiesUseCase listCommonAmenitiesUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonAmenity>>> listCommonAmenities(
            @RequestParam(required = false) Integer roomId
    ) {
        return ResponseEntity.ok(ApiResponse.<List<CommonAmenity>>builder()
                .success(true)
                .message("Lấy danh sách tiện ích đi kèm thành công")
                .data(listCommonAmenitiesUseCase.listActiveAmenities(roomId))
                .build());
    }
}
