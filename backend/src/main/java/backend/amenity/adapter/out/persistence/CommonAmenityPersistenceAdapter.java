package backend.amenity.adapter.out.persistence;

import backend.amenity.application.port.out.CommonAmenityCatalogPort;
import backend.amenity.domain.model.CommonAmenity;
import backend.entity.Room;
import backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
class CommonAmenityPersistenceAdapter implements CommonAmenityCatalogPort {
    private final CommonAmenityJpaRepository repository;
    private final RoomRepository roomRepository;

    @Override
    public List<CommonAmenity> findActiveAmenities(Integer roomId) {
        List<CommonAmenityEntity> amenities = roomId == null
                ? repository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc()
                : repository.findActiveByRoomId(roomId);
        return amenities.stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<CommonAmenity> findAllAmenities() {
        return repository.findAllByOrderByDisplayOrderAscNameAsc().stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<CommonAmenity> findById(Long id) {
        return repository.findWithRoomsById(id).map(this::toDomain);
    }

    @Override
    public boolean existsByName(String name) {
        return repository.existsByNameIgnoreCase(name);
    }

    @Override
    public Set<Integer> findExistingRoomIds(Set<Integer> roomIds) {
        return roomRepository.findAllById(roomIds).stream()
                .map(Room::getId)
                .collect(Collectors.toSet());
    }

    @Override
    public CommonAmenity save(CommonAmenity amenity) {
        CommonAmenityEntity entity = amenity.id() == null
                ? new CommonAmenityEntity()
                : repository.findWithRoomsById(amenity.id()).orElseGet(CommonAmenityEntity::new);
        entity.setName(amenity.name());
        entity.setDescription(amenity.description());
        entity.setIconName(amenity.iconName());
        entity.setImageUrl(amenity.imageUrl());
        entity.setDisplayOrder(amenity.displayOrder());
        entity.setActive(amenity.active());
        entity.setRooms(new LinkedHashSet<>(roomRepository.findAllById(amenity.roomIds())));
        return toDomain(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private CommonAmenity toDomain(CommonAmenityEntity entity) {
        return new CommonAmenity(
                entity.getId(), entity.getName(), entity.getDescription(), entity.getIconName(),
                entity.getImageUrl(), entity.getDisplayOrder(), entity.isActive(),
                entity.getRooms().stream().map(Room::getId).sorted().toList()
        );
    }
}
