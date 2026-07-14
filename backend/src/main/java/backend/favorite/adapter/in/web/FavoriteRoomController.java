package backend.favorite.adapter.in.web;

import backend.common.ApiResponse;
import backend.favorite.application.port.in.FavoriteRoomUseCase;
import backend.favorite.domain.model.FavoriteRoom;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteRoomController {

    private final FavoriteRoomUseCase favoriteRoomUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteRoom>>> getFavorites(Authentication authentication) {
        return ResponseEntity.ok(success(
                "Lay danh sach phong yeu thich thanh cong",
                favoriteRoomUseCase.getFavorites(authentication.getName())
        ));
    }

    @PostMapping("/{roomId}")
    public ResponseEntity<ApiResponse<FavoriteRoom>> addFavorite(
            @PathVariable Integer roomId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(success(
                "Da them phong vao danh sach yeu thich",
                favoriteRoomUseCase.addFavorite(authentication.getName(), roomId)
        ));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable Integer roomId,
            Authentication authentication
    ) {
        favoriteRoomUseCase.removeFavorite(authentication.getName(), roomId);
        return ResponseEntity.ok(success("Da xoa phong khoi danh sach yeu thich", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
