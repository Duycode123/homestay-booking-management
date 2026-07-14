package backend.refund.application.service;

import backend.refund.application.model.RefundProofFile;
import backend.refund.application.model.RefundProofUploadResult;
import backend.refund.application.port.in.UploadRefundProofUseCase;
import backend.refund.application.port.out.RefundProofStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class RefundProofUploadService implements UploadRefundProofUseCase {

    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final RefundProofStoragePort storagePort;

    @Override
    public RefundProofUploadResult upload(
            String adminEmail,
            String fileName,
            String contentType,
            byte[] content
    ) {
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new IllegalArgumentException("Khong xac dinh duoc admin tai bien lai");
        }
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Anh bien lai khong duoc de trong");
        }
        if (content.length > MAX_BYTES) {
            throw new IllegalArgumentException("Anh bien lai khong duoc vuot qua 5MB");
        }
        String normalizedType = contentType == null ? "" : contentType.trim().toLowerCase();
        if (!ALLOWED_TYPES.contains(normalizedType)) {
            throw new IllegalArgumentException("Anh bien lai chi ho tro JPG, PNG hoac WebP");
        }
        if (!hasValidImageSignature(normalizedType, content)) {
            throw new IllegalArgumentException("Noi dung tep khong khop voi dinh dang anh bien lai");
        }
        return storagePort.upload(new RefundProofFile(fileName, normalizedType, content));
    }

    private boolean hasValidImageSignature(String contentType, byte[] content) {
        return switch (contentType) {
            case "image/jpeg" -> content.length >= 3
                    && unsigned(content[0]) == 0xFF
                    && unsigned(content[1]) == 0xD8
                    && unsigned(content[2]) == 0xFF;
            case "image/png" -> content.length >= 8
                    && unsigned(content[0]) == 0x89
                    && content[1] == 'P'
                    && content[2] == 'N'
                    && content[3] == 'G'
                    && unsigned(content[4]) == 0x0D
                    && unsigned(content[5]) == 0x0A
                    && unsigned(content[6]) == 0x1A
                    && unsigned(content[7]) == 0x0A;
            case "image/webp" -> content.length >= 12
                    && content[0] == 'R'
                    && content[1] == 'I'
                    && content[2] == 'F'
                    && content[3] == 'F'
                    && content[8] == 'W'
                    && content[9] == 'E'
                    && content[10] == 'B'
                    && content[11] == 'P';
            default -> false;
        };
    }

    private int unsigned(byte value) {
        return Byte.toUnsignedInt(value);
    }
}
