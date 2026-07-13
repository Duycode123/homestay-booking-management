package backend.equipment.adapter.out.persistence;

import backend.entity.Role;
import backend.entity.Room;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import backend.equipment.application.port.out.EquipmentActorPort;
import backend.equipment.application.port.out.EquipmentCatalogPort;
import backend.equipment.application.port.out.EquipmentMutationPort;
import backend.equipment.domain.model.Equipment;
import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class EquipmentPersistenceAdapter implements
        EquipmentCatalogPort,
        EquipmentMutationPort,
        EquipmentActorPort {

    private final EquipmentRepository equipmentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EquipmentPersistenceMapper equipmentPersistenceMapper;

    @Override
    public List<Equipment> loadEquipment(Integer roomId, EquipmentType type, EquipmentStatus status) {
        List<EquipmentJpaEntity> equipment = roomId == null
                ? equipmentRepository.findAllWithRoom()
                : equipmentRepository.findAllByRoomIdWithRoom(roomId);

        return equipment.stream()
                .filter(entity -> type == null || entity.getType() == type)
                .filter(entity -> status == null || entity.getStatus() == status)
                .map(equipmentPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Equipment> loadEquipment(Integer equipmentId) {
        return equipmentRepository.findDetailById(equipmentId)
                .map(equipmentPersistenceMapper::toDomain);
    }

    @Override
    public boolean existsRoom(Integer roomId) {
        return roomRepository.existsById(roomId);
    }

    @Override
    public Equipment save(Equipment equipment) {
        Room room = roomRepository.findById(equipment.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong homestay"));

        EquipmentJpaEntity entity = equipment.getId() == null
                ? new EquipmentJpaEntity()
                : equipmentRepository.findById(equipment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thiet bi"));

        equipmentPersistenceMapper.updateEntity(entity, equipment, room);

        return equipmentPersistenceMapper.toDomain(equipmentRepository.save(entity));
    }

    @Override
    public void deleteEquipment(Integer equipmentId) {
        equipmentRepository.deleteById(equipmentId);
    }

    @Override
    public Optional<Role> loadRoleByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getRole());
    }
}
