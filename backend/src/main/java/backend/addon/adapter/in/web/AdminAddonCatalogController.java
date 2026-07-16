package backend.addon.adapter.in.web;

import backend.addon.adapter.in.web.dto.*;
import backend.addon.application.port.in.AddonUseCase;
import backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/addons")
@RequiredArgsConstructor
public class AdminAddonCatalogController {
    private final AddonUseCase addonUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddonCatalogResponse>>> list() {
        var data = addonUseCase.listAllCatalogItems().stream().map(AddonCatalogResponse::from).toList();
        return ok("Lay danh sach dich vu thanh cong", data);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddonCatalogResponse>> create(@Valid @RequestBody AddonCatalogRequest request) {
        var data = AddonCatalogResponse.from(addonUseCase.createCatalogItem(request.toDomain()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response("Tao dich vu thanh cong", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddonCatalogResponse>> update(@PathVariable Long id,
                                                                     @Valid @RequestBody AddonCatalogRequest request) {
        return ok("Cap nhat dich vu thanh cong", AddonCatalogResponse.from(addonUseCase.updateCatalogItem(id, request.toDomain())));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<AddonCatalogResponse>> active(@PathVariable Long id, @RequestParam boolean value) {
        return ok("Cap nhat trang thai dich vu thanh cong", AddonCatalogResponse.from(addonUseCase.setCatalogItemActive(id, value)));
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) { return ResponseEntity.ok(response(message, data)); }
    private <T> ApiResponse<T> response(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
