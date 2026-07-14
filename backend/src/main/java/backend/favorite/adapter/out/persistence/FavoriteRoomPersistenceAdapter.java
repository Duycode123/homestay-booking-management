package backend.favorite.adapter.out.persistence;

import backend.entity.Room;
import backend.entity.User;
import backend.exception.ResourceNotFoundException;
import backend.favorite.application.port.out.FavoriteRoomPort;
import backend.favorite.domain.model.FavoriteRoom;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
class FavoriteRoomPersistenceAdapter implements FavoriteRoomPort {

    private final FavoriteRoomJpaRepository favoriteRoomJpaRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    @Override
    public List<FavoriteRoom> findByAccountEmail(String accountEmail) {
        requireAccount(accountEmail);
        return favoriteRoomJpaRepository.findAllByAccountEmail(accountEmail).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<FavoriteRoom> findByAccountEmailAndRoomId(String accountEmail, Integer roomId) {
        requireAccount(accountEmail);
        return favoriteRoomJpaRepository.findByAccountEmailAndRoomId(accountEmail, roomId)
                .map(this::toDomain);
    }

    @Override
    public FavoriteRoom save(String accountEmail, Integer roomId) {
        User account = requireAccount(accountEmail);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong homestay"));

        FavoriteRoomEntity entity = new FavoriteRoomEntity();
        entity.setAccount(account);
        entity.setRoom(room);
        return toDomain(favoriteRoomJpaRepository.save(entity));
    }

    @Override
    public boolean delete(String accountEmail, Integer roomId) {
        requireAccount(accountEmail);
        return favoriteRoomJpaRepository.deleteByAccount_EmailIgnoreCaseAndRoom_Id(accountEmail, roomId) > 0;
    }

    private User requireAccount(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai khoan"));
    }

    private FavoriteRoom toDomain(FavoriteRoomEntity entity) {
        Room room = entity.getRoom();
        return new FavoriteRoom(
                room.getId(),
                room.getRoomName(),
                room.getRoomType() == null ? null : room.getRoomType().getTypeName(),
                room.getMaxPeople(),
                room.getRoomType() == null ? null : room.getRoomType().getPricePerHour(),
                room.getImageUrl(),
                entity.getCreatedAt()
        );
    }
}
