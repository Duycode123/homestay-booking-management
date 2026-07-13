package backend.room.application.service;

import backend.entity.Role;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.room.application.model.RoomImageFile;
import backend.room.application.model.RoomImageUploadResult;
import backend.room.application.port.in.UploadRoomImageAssetUseCase;
import backend.room.application.port.in.command.UploadRoomImageAssetCommand;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomImageStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomImageUploadUseCaseService implements UploadRoomImageAssetUseCase {

    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final RoomActorPort roomActorPort;
    private final RoomImageStoragePort roomImageStoragePort;

    @Override
    public RoomImageUploadResult uploadRoomImage(UploadRoomImageAssetCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chi admin co quyen tai anh phong homestay");
        }

        validateImage(command);

        return roomImageStoragePort.uploadRoomImage(new RoomImageFile(
                command.fileName(),
                command.contentType(),
                command.content()
        ));
    }

    private User getCurrentUser(String email) {
        String normalizedEmail = normalizeRequired(email, "Nguoi dung hien tai khong hop le");

        return roomActorPort.loadUserByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
    }

    private void validateImage(UploadRoomImageAssetCommand command) {
        byte[] content = command.content();
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Vui long chon anh phong homestay");
        }
        if (content.length > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Anh phong homestay khong duoc vuot qua 5MB");
        }

        String contentType = normalizeRequired(command.contentType(), "File tai len phai la anh");
        if (!contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("File tai len phai la anh");
        }
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }
}
