package backend.room.application.service;

import backend.entity.Role;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.room.application.model.RoomImageUploadResult;
import backend.room.application.port.in.command.UploadRoomImageAssetCommand;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomImageStoragePort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomImageUploadUseCaseServiceTest {

    @Mock
    private RoomActorPort roomActorPort;

    @Mock
    private RoomImageStoragePort roomImageStoragePort;

    @Test
    void uploadRoomImageStoresValidImageForAdmin() {
        RoomImageUploadUseCaseService service = new RoomImageUploadUseCaseService(
                roomActorPort,
                roomImageStoragePort
        );
        byte[] content = new byte[]{1, 2, 3};
        RoomImageUploadResult expected = new RoomImageUploadResult(
                "homestay-booking-management/rooms/studio-a",
                "https://res.cloudinary.com/lkkmflxm/image/upload/v1/studio-a.jpg"
        );

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(user(Role.ADMIN)));
        when(roomImageStoragePort.uploadRoomImage(any())).thenReturn(expected);

        RoomImageUploadResult result = service.uploadRoomImage(new UploadRoomImageAssetCommand(
                "admin@example.com",
                "studio-a.jpg",
                "image/jpeg",
                content
        ));

        ArgumentCaptor<backend.room.application.model.RoomImageFile> imageCaptor =
                ArgumentCaptor.forClass(backend.room.application.model.RoomImageFile.class);
        verify(roomImageStoragePort).uploadRoomImage(imageCaptor.capture());
        assertEquals(expected, result);
        assertEquals("studio-a.jpg", imageCaptor.getValue().fileName());
        assertEquals("image/jpeg", imageCaptor.getValue().contentType());
        assertArrayEquals(content, imageCaptor.getValue().content());
    }

    @Test
    void uploadRoomImageRejectsNonAdmin() {
        RoomImageUploadUseCaseService service = new RoomImageUploadUseCaseService(
                roomActorPort,
                roomImageStoragePort
        );

        when(roomActorPort.loadUserByEmail("staff@example.com")).thenReturn(Optional.of(user(Role.STAFF)));

        assertThrows(ForbiddenException.class, () -> service.uploadRoomImage(new UploadRoomImageAssetCommand(
                "staff@example.com",
                "studio-a.jpg",
                "image/jpeg",
                new byte[]{1}
        )));
        verify(roomImageStoragePort, never()).uploadRoomImage(any());
    }

    @Test
    void uploadRoomImageRejectsNonImageContentType() {
        RoomImageUploadUseCaseService service = new RoomImageUploadUseCaseService(
                roomActorPort,
                roomImageStoragePort
        );

        when(roomActorPort.loadUserByEmail("admin@example.com")).thenReturn(Optional.of(user(Role.ADMIN)));

        assertThrows(IllegalArgumentException.class, () -> service.uploadRoomImage(new UploadRoomImageAssetCommand(
                "admin@example.com",
                "notes.txt",
                "text/plain",
                new byte[]{1}
        )));
        verify(roomImageStoragePort, never()).uploadRoomImage(any());
    }

    private User user(Role role) {
        User user = new User();
        user.setEmail("admin@example.com");
        user.setRole(role);
        return user;
    }
}
