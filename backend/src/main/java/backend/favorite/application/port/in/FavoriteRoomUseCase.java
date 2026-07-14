package backend.favorite.application.port.in;

import backend.favorite.domain.model.FavoriteRoom;

import java.util.List;

public interface FavoriteRoomUseCase {
    List<FavoriteRoom> getFavorites(String accountEmail);

    FavoriteRoom addFavorite(String accountEmail, Integer roomId);

    void removeFavorite(String accountEmail, Integer roomId);
}
