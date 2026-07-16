package backend.addon.adapter.in.web;

import backend.addon.adapter.in.web.dto.AddonCatalogResponse;
import backend.addon.application.port.in.AddonUseCase;
import backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addons")
@RequiredArgsConstructor
public class PublicAddonController {
    private final AddonUseCase addonUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddonCatalogResponse>>> list(@RequestParam Integer roomId) {
        var data = addonUseCase.listAvailableForRoom(roomId).stream().map(AddonCatalogResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.<List<AddonCatalogResponse>>builder().success(true)
                .message("Lay danh sach dich vu thanh cong").data(data).build());
    }
}
