package backend.equipment.application.service;

import backend.entity.Role;
import backend.equipment.application.port.in.command.CreateEquipmentCommand;
import backend.equipment.application.port.in.command.DeleteEquipmentCommand;
import backend.equipment.application.port.in.query.ListEquipmentQuery;
import backend.equipment.application.port.out.EquipmentActorPort;
import backend.equipment.application.port.out.EquipmentCatalogPort;
import backend.equipment.application.port.out.EquipmentMutationPort;
import backend.equipment.domain.model.Equipment;
import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentUseCaseServiceTest {

    @Mock
    private EquipmentCatalogPort equipmentCatalogPort;

    @Mock
    private EquipmentMutationPort equipmentMutationPort;

    @Mock
    private EquipmentActorPort equipmentActorPort;

    private EquipmentUseCaseService equipmentUseCaseService;

    @BeforeEach
    void setUp() {
        equipmentUseCaseService = new EquipmentUseCaseService(
                equipmentCatalogPort,
                equipmentMutationPort,
                equipmentActorPort
        );
    }

    @Test
    void createEquipmentDefaultsStatusAndNormalizesText() {
        when(equipmentActorPort.loadRoleByEmail("staff@example.com")).thenReturn(Optional.of(Role.STAFF));
        when(equipmentCatalogPort.existsRoom(3)).thenReturn(true);
        when(equipmentMutationPort.save(any(Equipment.class))).thenAnswer(invocation -> {
            Equipment equipment = invocation.getArgument(0);
            return equipment.toBuilder()
                    .id(11)
                    .roomName("Room Premium")
                    .build();
        });

        Equipment createdEquipment = equipmentUseCaseService.createEquipment(new CreateEquipmentCommand(
                3,
                EquipmentType.WIFI,
                "  Shure SM58  ",
                null,
                "  Vocal microphone  ",
                "staff@example.com"
        ));

        ArgumentCaptor<Equipment> equipmentCaptor = ArgumentCaptor.forClass(Equipment.class);
        verify(equipmentMutationPort).save(equipmentCaptor.capture());

        assertEquals(11, createdEquipment.getId());
        assertEquals(EquipmentStatus.GOOD, createdEquipment.getStatus());
        assertEquals("Shure SM58", equipmentCaptor.getValue().getName());
        assertEquals("Vocal microphone", equipmentCaptor.getValue().getNotes());
        assertNull(equipmentCaptor.getValue().getRoomName());
    }

    @Test
    void listEquipmentRejectsCustomerWithoutManagementPermission() {
        when(equipmentActorPort.loadRoleByEmail("customer@example.com")).thenReturn(Optional.of(Role.CUSTOMER));

        assertThrows(
                ForbiddenException.class,
                () -> equipmentUseCaseService.getEquipment(
                        new ListEquipmentQuery(null, null, null, "customer@example.com")
                )
        );
    }

    @Test
    void deleteEquipmentRejectsUnknownEquipment() {
        when(equipmentActorPort.loadRoleByEmail("admin@example.com")).thenReturn(Optional.of(Role.ADMIN));
        when(equipmentCatalogPort.loadEquipment(99)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> equipmentUseCaseService.deleteEquipment(new DeleteEquipmentCommand(99, "admin@example.com"))
        );
        verify(equipmentMutationPort, never()).deleteEquipment(99);
    }
}
