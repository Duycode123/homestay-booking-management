package backend.favorite.application.service;

import backend.exception.ResourceNotFoundException;
import backend.favorite.application.port.in.FavoriteRoomUseCase;
import backend.favorite.application.port.out.FavoriteRoomPort;
import backend.favorite.domain.model.FavoriteRoom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteRoomService implements FavoriteRoomUseCase {

    private final FavoriteRoomPort favoriteRoomPort;

    @Override
    public List<FavoriteRoom> getFavorites(String accountEmail) {
        return favoriteRoomPort.findByAccountEmail(accountEmail);
    }

    @Override
    @Transactional
    public FavoriteRoom addFavorite(String accountEmail, Integer roomId) {
        if (roomId == null || roomId <= 0) {
            throw new IllegalArgumentException("roomId khong hop le");
        }

        return favoriteRoomPort.findByAccountEmailAndRoomId(accountEmail, roomId)
                .orElseGet(() -> favoriteRoomPort.save(accountEmail, roomId));
    }

    @Override
    @Transactional
    public void removeFavorite(String accountEmail, Integer roomId) {
        if (!favoriteRoomPort.delete(accountEmail, roomId)) {
            throw new ResourceNotFoundException("Phong khong nam trong danh sach yeu thich");
        }
    }
}
