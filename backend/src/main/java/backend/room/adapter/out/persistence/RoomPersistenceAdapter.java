package backend.room.adapter.out.persistence;

import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.entity.Room;
import backend.entity.RoomType;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.repository.RoomTypeRepository;
import backend.repository.UserRepository;
import backend.room.application.model.PageResult;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomCatalogPort;
import backend.room.application.port.out.RoomMutationPort;
import backend.room.application.port.out.model.RoomSearchCriteria;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomPersistenceAdapter implements
        RoomCatalogPort,
        RoomMutationPort,
        RoomActorPort {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;

    @Override
    public List<Room> loadRooms(RoomSearchCriteria criteria) {
        return roomRepository.findAll(toSpecification(criteria), roomNameAscending());
    }

    @Override
    public PageResult<Room> searchRooms(RoomSearchCriteria criteria) {
        Page<Room> roomPage = roomRepository.findAll(
                toSpecification(criteria),
                PageRequest.of(criteria.page(), criteria.size(), roomNameAscending())
        );

        return new PageResult<>(
                roomPage.getContent(),
                roomPage.getNumber(),
                roomPage.getSize(),
                roomPage.getTotalElements(),
                roomPage.getTotalPages(),
                roomPage.isFirst(),
                roomPage.isLast()
        );
    }

    private Sort roomNameAscending() {
        return Sort.by(Sort.Direction.ASC, "roomName");
    }

    private Specification<Room> toSpecification(RoomSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.roomTypeId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("roomType").get("id"), criteria.roomTypeId()));
            }
            if (criteria.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), criteria.status()));
            }
            if (criteria.search() != null) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("roomName")),
                        "%" + escapeLikePattern(criteria.search().toLowerCase()) + "%",
                        '\\'
                ));
            }
            if (criteria.minCapacity() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("maxPeople"), criteria.minCapacity()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String escapeLikePattern(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    @Override
    public Optional<Room> loadRoom(Integer roomId) {
        return roomRepository.findById(roomId);
    }

    @Override
    public Optional<Room> loadRoomForUpdate(Integer roomId) {
        return roomRepository.findByIdForUpdate(roomId);
    }

    @Override
    public boolean existsRoomName(String roomName) {
        return roomRepository.existsByRoomName(roomName);
    }

    @Override
    public boolean existsBookingForRoom(Integer roomId) {
        return bookingRepository.existsByRoom_Id(roomId);
    }

    @Override
    public boolean existsEquipmentForRoom(Integer roomId) {
        return equipmentRepository.existsByRoom_Id(roomId);
    }

    @Override
    public boolean existsRoomTypeName(String typeName) {
        return roomTypeRepository.existsByTypeName(typeName);
    }

    @Override
    public boolean existsRoomForRoomType(Integer roomTypeId) {
        return roomRepository.existsByRoomType_Id(roomTypeId);
    }

    @Override
    public List<RoomType> loadRoomTypes() {
        return roomTypeRepository.findAllByOrderByTypeNameAsc();
    }

    @Override
    public Optional<RoomType> loadRoomType(Integer roomTypeId) {
        return roomTypeRepository.findById(roomTypeId);
    }

    @Override
    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    @Override
    public void deleteRoom(Room room) {
        roomRepository.delete(room);
    }

    @Override
    public RoomType saveRoomType(RoomType roomType) {
        return roomTypeRepository.save(roomType);
    }

    @Override
    public void deleteRoomType(RoomType roomType) {
        roomTypeRepository.delete(roomType);
    }

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
