package backend.equipment.application.service;

import backend.entity.Role;
import backend.equipment.application.port.in.CreateEquipmentUseCase;
import backend.equipment.application.port.in.DeleteEquipmentUseCase;
import backend.equipment.application.port.in.GetEquipmentDetailUseCase;
import backend.equipment.application.port.in.ListEquipmentUseCase;
import backend.equipment.application.port.in.ListPublicEquipmentUseCase;
import backend.equipment.application.port.in.UpdateEquipmentUseCase;
import backend.equipment.application.port.in.command.CreateEquipmentCommand;
import backend.equipment.application.port.in.command.DeleteEquipmentCommand;
import backend.equipment.application.port.in.command.UpdateEquipmentCommand;
import backend.equipment.application.port.in.query.GetEquipmentDetailQuery;
import backend.equipment.application.port.in.query.ListEquipmentQuery;
import backend.equipment.application.port.in.query.ListPublicEquipmentQuery;
import backend.equipment.application.port.out.EquipmentActorPort;
import backend.equipment.application.port.out.EquipmentCatalogPort;
import backend.equipment.application.port.out.EquipmentMutationPort;
import backend.equipment.domain.model.Equipment;
import backend.equipment.domain.model.EquipmentStatus;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentUseCaseService implements
        ListEquipmentUseCase,
        ListPublicEquipmentUseCase,
        GetEquipmentDetailUseCase,
        CreateEquipmentUseCase,
        UpdateEquipmentUseCase,
        DeleteEquipmentUseCase {

    private final EquipmentCatalogPort equipmentCatalogPort;
    private final EquipmentMutationPort equipmentMutationPort;
    private final EquipmentActorPort equipmentActorPort;

    @Override
    public List<Equipment> getEquipment(ListEquipmentQuery query) {
        checkManagementPermission(query.currentUserEmail());

        return equipmentCatalogPort.loadEquipment(query.roomId(), query.type(), query.status());
    }

    @Override
    public List<Equipment> getPublicEquipment(ListPublicEquipmentQuery query) {
        return equipmentCatalogPort.loadEquipment(query.roomId(), null, EquipmentStatus.GOOD);
    }

    @Override
    public Equipment getEquipmentDetail(GetEquipmentDetailQuery query) {
        checkManagementPermission(query.currentUserEmail());

        if (query.equipmentId() == null) {
            throw new IllegalArgumentException("equipmentId khong duoc de trong");
        }

        return equipmentCatalogPort.loadEquipment(query.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thiet bi"));
    }

    @Override
    @Transactional
    public Equipment createEquipment(CreateEquipmentCommand command) {
        checkManagementPermission(command.currentUserEmail());
        validateMutationInput(command.roomId(), command.type(), command.name());
        ensureRoomExists(command.roomId());

        Equipment equipment = Equipment.builder()
                .roomId(command.roomId())
                .type(command.type())
                .name(normalizeRequired(command.name(), "Ten thiet bi khong duoc de trong"))
                .status(command.status() == null ? EquipmentStatus.GOOD : command.status())
                .notes(normalizeOptional(command.notes()))
                .build();

        return equipmentMutationPort.save(equipment);
    }

    @Override
    @Transactional
    public Equipment updateEquipment(UpdateEquipmentCommand command) {
        checkManagementPermission(command.currentUserEmail());

        if (command.equipmentId() == null) {
            throw new IllegalArgumentException("equipmentId khong duoc de trong");
        }

        Equipment existingEquipment = equipmentCatalogPort.loadEquipment(command.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thiet bi"));

        validateMutationInput(command.roomId(), command.type(), command.name());
        ensureRoomExists(command.roomId());

        Equipment updatedEquipment = existingEquipment.toBuilder()
                .roomId(command.roomId())
                .type(command.type())
                .name(normalizeRequired(command.name(), "Ten thiet bi khong duoc de trong"))
                .status(command.status())
                .notes(normalizeOptional(command.notes()))
                .build();

        return equipmentMutationPort.save(updatedEquipment);
    }

    @Override
    @Transactional
    public void deleteEquipment(DeleteEquipmentCommand command) {
        checkManagementPermission(command.currentUserEmail());

        if (command.equipmentId() == null) {
            throw new IllegalArgumentException("equipmentId khong duoc de trong");
        }

        equipmentCatalogPort.loadEquipment(command.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thiet bi"));

        equipmentMutationPort.deleteEquipment(command.equipmentId());
    }

    private void validateMutationInput(Integer roomId, Object type, String name) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId khong duoc de trong");
        }

        if (type == null) {
            throw new IllegalArgumentException("Loai thiet bi khong duoc de trong");
        }

        normalizeRequired(name, "Ten thiet bi khong duoc de trong");
    }

    private void ensureRoomExists(Integer roomId) {
        if (!equipmentCatalogPort.existsRoom(roomId)) {
            throw new ResourceNotFoundException("Khong tim thay phong homestay");
        }
    }

    private void checkManagementPermission(String currentUserEmail) {
        String normalizedEmail = normalizeRequired(currentUserEmail, "Nguoi dung hien tai khong hop le");
        Role role = equipmentActorPort.loadRoleByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        if (role != Role.ADMIN && role != Role.STAFF) {
            throw new ForbiddenException("Ban khong co quyen quan ly thiet bi");
        }
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        return normalizedValue.isBlank() ? null : normalizedValue;
    }
}
