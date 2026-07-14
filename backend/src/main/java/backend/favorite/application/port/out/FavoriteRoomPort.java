package backend.favorite.application.port.out;

import backend.favorite.domain.model.FavoriteRoom;

import java.util.List;
import java.util.Optional;

public interface FavoriteRoomPort {
    List<FavoriteRoom> findByAccountEmail(String accountEmail);

    Optional<FavoriteRoom> findByAccountEmailAndRoomId(String accountEmail, Integer roomId);

    FavoriteRoom save(String accountEmail, Integer roomId);

    boolean delete(String accountEmail, Integer roomId);
}
