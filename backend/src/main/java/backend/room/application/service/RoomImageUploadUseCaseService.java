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

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoomImageUploadUseCaseService implements UploadRoomImageAssetUseCase {

    private static final int MAX_IMAGE_BYTES = 12 * 1024 * 1024;
    private static final int MIN_IMAGE_WIDTH_PIXELS = 1200;
    private static final int MIN_IMAGE_HEIGHT_PIXELS = 900;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

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
            throw new IllegalArgumentException("Anh phong homestay khong duoc vuot qua 12MB");
        }

        String contentType = normalizeRequired(command.contentType(), "File tai len phai la anh").toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Anh phong chi ho tro JPG, PNG hoac WebP");
        }

        ImageDimensions dimensions = readDimensions(content, contentType);
        if (dimensions == null) {
            throw new IllegalArgumentException("File anh phong bi loi hoac khong dung dinh dang");
        }

        if (dimensions.width() < MIN_IMAGE_WIDTH_PIXELS || dimensions.height() < MIN_IMAGE_HEIGHT_PIXELS) {
            throw new IllegalArgumentException(
                    "Anh phong qua nho (" + dimensions.width() + "x" + dimensions.height()
                            + "). Toi thieu 1200x900, khuyen nghi 1600x1200 (ty le 4:3)"
            );
        }
    }

    private ImageDimensions readDimensions(byte[] content, String contentType) {
        if ("image/webp".equals(contentType)) {
            return readWebpDimensions(content);
        }

        try (ByteArrayInputStream input = new ByteArrayInputStream(content)) {
            BufferedImage image = ImageIO.read(input);
            return image == null ? null : new ImageDimensions(image.getWidth(), image.getHeight());
        } catch (IOException exception) {
            return null;
        }
    }

    private ImageDimensions readWebpDimensions(byte[] content) {
        if (content.length < 30
                || !hasAscii(content, 0, "RIFF")
                || !hasAscii(content, 8, "WEBP")) {
            return null;
        }

        if (hasAscii(content, 12, "VP8X")) {
            return validDimensions(1 + readUnsigned24LittleEndian(content, 24),
                    1 + readUnsigned24LittleEndian(content, 27));
        }

        if (hasAscii(content, 12, "VP8 ")
                && content.length >= 30
                && unsigned(content[23]) == 0x9D
                && unsigned(content[24]) == 0x01
                && unsigned(content[25]) == 0x2A) {
            int width = readUnsigned16LittleEndian(content, 26) & 0x3FFF;
            int height = readUnsigned16LittleEndian(content, 28) & 0x3FFF;
            return validDimensions(width, height);
        }

        if (hasAscii(content, 12, "VP8L") && unsigned(content[20]) == 0x2F) {
            int bits = unsigned(content[21])
                    | (unsigned(content[22]) << 8)
                    | (unsigned(content[23]) << 16)
                    | (unsigned(content[24]) << 24);
            return validDimensions(1 + (bits & 0x3FFF), 1 + ((bits >>> 14) & 0x3FFF));
        }

        return null;
    }

    private ImageDimensions validDimensions(int width, int height) {
        return width > 0 && height > 0 ? new ImageDimensions(width, height) : null;
    }

    private boolean hasAscii(byte[] content, int offset, String expected) {
        byte[] value = expected.getBytes(StandardCharsets.US_ASCII);
        if (offset < 0 || offset + value.length > content.length) {
            return false;
        }
        for (int index = 0; index < value.length; index++) {
            if (content[offset + index] != value[index]) {
                return false;
            }
        }
        return true;
    }

    private int readUnsigned16LittleEndian(byte[] content, int offset) {
        return unsigned(content[offset]) | (unsigned(content[offset + 1]) << 8);
    }

    private int readUnsigned24LittleEndian(byte[] content, int offset) {
        return unsigned(content[offset])
                | (unsigned(content[offset + 1]) << 8)
                | (unsigned(content[offset + 2]) << 16);
    }

    private int unsigned(byte value) {
        return value & 0xFF;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private record ImageDimensions(int width, int height) {
    }
}
