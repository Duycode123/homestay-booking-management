package backend.room.application.service;

import backend.entity.Role;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.dto.response.PagedResponse;
import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.room.application.model.PageResult;
import backend.room.application.port.in.command.DeleteRoomCommand;
import backend.room.application.port.in.command.CreateRoomTypeCommand;
import backend.room.application.port.in.command.DeleteRoomTypeCommand;
import backend.room.application.port.in.command.UpdateRoomTypeCommand;
import backend.room.application.port.in.command.UpdateRoomCommand;
import backend.room.application.port.in.command.UpdateRoomStatusCommand;
import backend.room.application.port.in.query.ListRoomsQuery;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomCatalogPort;
import backend.room.application.port.out.RoomMutationPort;
import backend.room.application.port.out.model.RoomSearchCriteria;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomUseCaseServiceTest {

    @Mock
    private RoomCatalogPort roomCatalogPort;

    @Mock
    private RoomMutationPort roomMutationPort;

    @Mock
    private RoomActorPort roomActorPort;

    @Test
    void updateRoomUpdatesNameTypeAndStatusForAdmin() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);
        Room room = existingRoom();
        RoomType updatedType = roomType(3, "Premium");

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(room));
        when(roomCatalogPort.existsRoomName("Deluxe Garden 201")).thenReturn(false);
        when(roomCatalogPort.loadRoomType(3)).thenReturn(Optional.of(updatedType));
        when(roomMutationPort.saveRoom(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateRoom(new UpdateRoomCommand(
                10,
                "Deluxe Garden 201",
                3,
                10,
                "https://res.cloudinary.com/lkkmflxm/image/upload/v1/rooms/deluxe-garden-201.jpg",
                RoomStatus.MAINTENANCE,
                "admin@example.com"
        ));

        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomMutationPort).saveRoom(roomCaptor.capture());
        assertEquals("Deluxe Garden 201", roomCaptor.getValue().getRoomName());
        assertEquals(updatedType, roomCaptor.getValue().getRoomType());
        assertEquals(10, roomCaptor.getValue().getMaxPeople());
        assertEquals(
                "https://res.cloudinary.com/lkkmflxm/image/upload/v1/rooms/deluxe-garden-201.jpg",
                roomCaptor.getValue().getImageUrl()
        );
        assertEquals(RoomStatus.MAINTENANCE, roomCaptor.getValue().getStatus());
    }

    @Test
    void updateRoomRejectsDuplicateNameWhenRenamed() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(existingRoom()));
        when(roomCatalogPort.existsRoomName("Deluxe Garden 201")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.updateRoom(new UpdateRoomCommand(
                10,
                "Deluxe Garden 201",
                2,
                6,
                null,
                RoomStatus.AVAILABLE,
                "admin@example.com"
        )));
        verify(roomMutationPort, never()).saveRoom(any(Room.class));
    }

    @Test
    void updateRoomStatusUpdatesOnlyStatus() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);
        Room room = existingRoom();

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(room));
        when(roomMutationPort.saveRoom(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateRoomStatus(new UpdateRoomStatusCommand(10, RoomStatus.IN_USE, "admin@example.com"));

        assertEquals(RoomStatus.IN_USE, room.getStatus());
        verify(roomMutationPort).saveRoom(room);
    }

    @Test
    void deleteRoomRejectsRoomThatHasBookings() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(existingRoom()));
        when(roomCatalogPort.existsBookingForRoom(10)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.deleteRoom(new DeleteRoomCommand(10, "admin@example.com")));
        verify(roomMutationPort, never()).deleteRoom(any(Room.class));
    }

    @Test
    void deleteRoomRejectsRoomThatStillHasEquipment() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(existingRoom()));
        when(roomCatalogPort.existsBookingForRoom(10)).thenReturn(false);
        when(roomCatalogPort.existsEquipmentForRoom(10)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.deleteRoom(new DeleteRoomCommand(10, "admin@example.com")));
        verify(roomMutationPort, never()).deleteRoom(any(Room.class));
    }

    @Test
    void deleteRoomDeletesRoomWithoutDependencies() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);
        Room room = existingRoom();

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomForUpdate(10)).thenReturn(Optional.of(room));
        when(roomCatalogPort.existsBookingForRoom(10)).thenReturn(false);
        when(roomCatalogPort.existsEquipmentForRoom(10)).thenReturn(false);

        service.deleteRoom(new DeleteRoomCommand(10, "admin@example.com"));

        verify(roomMutationPort).deleteRoom(room);
    }

    @Test
    void updateRoomRejectsNonAdminActor() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("staff@example.com")).thenReturn(Optional.of(staffUser()));

        assertThrows(ForbiddenException.class, () -> service.updateRoom(new UpdateRoomCommand(
                10,
                "Deluxe Garden 201",
                3,
                6,
                null,
                RoomStatus.AVAILABLE,
                "staff@example.com"
        )));
    }

    @Test
    void createRoomTypeNormalizesAndSavesForAdmin() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.existsRoomTypeName("Premium")).thenReturn(false);
        when(roomMutationPort.saveRoomType(any(RoomType.class))).thenAnswer(invocation -> {
            RoomType roomType = invocation.getArgument(0);
            roomType.setId(5);
            return roomType;
        });

        RoomTypeResponse response = service.createRoomType(new CreateRoomTypeCommand(
                "  Premium  ",
                "  Spacious family room  ",
                new BigDecimal("450000"),
                "admin@example.com"
        ));

        ArgumentCaptor<RoomType> roomTypeCaptor = ArgumentCaptor.forClass(RoomType.class);
        verify(roomMutationPort).saveRoomType(roomTypeCaptor.capture());
        assertEquals("Premium", roomTypeCaptor.getValue().getTypeName());
        assertEquals("Spacious family room", roomTypeCaptor.getValue().getDescription());
        assertEquals(new BigDecimal("450000"), roomTypeCaptor.getValue().getPricePerHour());
        assertEquals(5, response.getId());
    }

    @Test
    void createRoomTypeRejectsDuplicateName() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.existsRoomTypeName("Premium")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.createRoomType(new CreateRoomTypeCommand(
                "Premium",
                null,
                new BigDecimal("450000"),
                "admin@example.com"
        )));
        verify(roomMutationPort, never()).saveRoomType(any(RoomType.class));
    }

    @Test
    void updateRoomTypeRejectsDuplicateNameWhenRenamed() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomType(2)).thenReturn(Optional.of(roomType(2, "Deluxe")));
        when(roomCatalogPort.existsRoomTypeName("Premium")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.updateRoomType(new UpdateRoomTypeCommand(
                2,
                "Premium",
                null,
                new BigDecimal("450000"),
                "admin@example.com"
        )));
        verify(roomMutationPort, never()).saveRoomType(any(RoomType.class));
    }

    @Test
    void deleteRoomTypeRejectsTypeUsedByRoom() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomType(2)).thenReturn(Optional.of(roomType(2, "Deluxe")));
        when(roomCatalogPort.existsRoomForRoomType(2)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.deleteRoomType(
                new DeleteRoomTypeCommand(2, "admin@example.com")
        ));
        verify(roomMutationPort, never()).deleteRoomType(any(RoomType.class));
    }

    @Test
    void deleteRoomTypeDeletesUnusedType() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);
        RoomType roomType = roomType(2, "Deluxe");

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(adminUser()));
        when(roomCatalogPort.loadRoomType(2)).thenReturn(Optional.of(roomType));
        when(roomCatalogPort.existsRoomForRoomType(2)).thenReturn(false);

        service.deleteRoomType(new DeleteRoomTypeCommand(2, "admin@example.com"));

        verify(roomMutationPort).deleteRoomType(roomType);
    }

    @Test
    void getRoomsPassesNormalizedFiltersToCatalogPort() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomCatalogPort.loadRooms(any(RoomSearchCriteria.class))).thenReturn(List.of(existingRoom()));

        List<RoomResponse> rooms = service.getRooms(new ListRoomsQuery(
                2, RoomStatus.AVAILABLE, "  Garden  ", 4, null, null
        ));

        ArgumentCaptor<RoomSearchCriteria> criteriaCaptor = ArgumentCaptor.forClass(RoomSearchCriteria.class);
        verify(roomCatalogPort).loadRooms(criteriaCaptor.capture());
        assertEquals(2, criteriaCaptor.getValue().roomTypeId());
        assertEquals(RoomStatus.AVAILABLE, criteriaCaptor.getValue().status());
        assertEquals("Garden", criteriaCaptor.getValue().search());
        assertEquals(4, criteriaCaptor.getValue().minCapacity());
        assertEquals(1, rooms.size());
        assertEquals("Deluxe Balcony 201", rooms.get(0).getRoomName());
    }

    @Test
    void getRoomsTreatsBlankSearchAsNoFilter() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomCatalogPort.loadRooms(any(RoomSearchCriteria.class))).thenReturn(List.of());

        service.getRooms(new ListRoomsQuery(null, null, "   ", null, null, null));

        ArgumentCaptor<RoomSearchCriteria> criteriaCaptor = ArgumentCaptor.forClass(RoomSearchCriteria.class);
        verify(roomCatalogPort).loadRooms(criteriaCaptor.capture());
        assertNull(criteriaCaptor.getValue().search());
    }

    @Test
    void getRoomsRejectsMinCapacityBelowOne() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        assertThrows(IllegalArgumentException.class, () -> service.getRooms(new ListRoomsQuery(
                null, null, null, 0, null, null
        )));
        verify(roomCatalogPort, never()).loadRooms(any(RoomSearchCriteria.class));
    }

    @Test
    void getRoomsPageMapsPageResultAndAppliesDefaults() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        when(roomCatalogPort.searchRooms(any(RoomSearchCriteria.class)))
                .thenReturn(new PageResult<>(List.of(existingRoom()), 0, 10, 1, 1, true, true));

        PagedResponse<RoomResponse> pageResponse = service.getRoomsPage(new ListRoomsQuery(
                null, null, null, null, null, null
        ));

        ArgumentCaptor<RoomSearchCriteria> criteriaCaptor = ArgumentCaptor.forClass(RoomSearchCriteria.class);
        verify(roomCatalogPort).searchRooms(criteriaCaptor.capture());
        assertEquals(0, criteriaCaptor.getValue().page());
        assertEquals(10, criteriaCaptor.getValue().size());
        assertEquals(1, pageResponse.content().size());
        assertEquals(1, pageResponse.totalElements());
        assertTrue(pageResponse.first());
        assertTrue(pageResponse.last());
    }

    @Test
    void getRoomsPageRejectsInvalidPagination() {
        RoomUseCaseService service = new RoomUseCaseService(roomCatalogPort, roomMutationPort, roomActorPort);

        assertThrows(IllegalArgumentException.class, () -> service.getRoomsPage(new ListRoomsQuery(
                null, null, null, null, -1, 10
        )));
        assertThrows(IllegalArgumentException.class, () -> service.getRoomsPage(new ListRoomsQuery(
                null, null, null, null, 0, 0
        )));
        assertThrows(IllegalArgumentException.class, () -> service.getRoomsPage(new ListRoomsQuery(
                null, null, null, null, 0, 101
        )));
        verify(roomCatalogPort, never()).searchRooms(any(RoomSearchCriteria.class));
    }

    private User adminUser() {
        User user = new User();
        user.setRole(Role.ADMIN);
        user.setEmail("admin@example.com");
        return user;
    }

    private User staffUser() {
        User user = new User();
        user.setRole(Role.STAFF);
        user.setEmail("staff@example.com");
        return user;
    }

    private Room existingRoom() {
        return Room.builder()
                .id(10)
                .roomName("Deluxe Balcony 201")
                .roomType(roomType(2, "Deluxe"))
                .maxPeople(6)
                .status(RoomStatus.AVAILABLE)
                .build();
    }

    private RoomType roomType(Integer id, String typeName) {
        RoomType roomType = new RoomType();
        roomType.setId(id);
        roomType.setTypeName(typeName);
        roomType.setCapacity(6);
        roomType.setPricePerHour(new BigDecimal("300000"));
        return roomType;
    }
}
