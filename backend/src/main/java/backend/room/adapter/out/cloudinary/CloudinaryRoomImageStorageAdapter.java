package backend.room.adapter.out.cloudinary;

import backend.config.CloudinaryProperties;
import backend.room.application.model.RoomImageFile;
import backend.room.application.model.RoomImageUploadResult;
import backend.room.application.port.out.RoomImageStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CloudinaryRoomImageStorageAdapter implements RoomImageStoragePort {

    private final CloudinaryProperties cloudinaryProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public RoomImageUploadResult uploadRoomImage(RoomImageFile imageFile) {
        assertConfigured();

        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put("timestamp", timestamp);

        String folder = normalizeOptional(cloudinaryProperties.getFolder());
        if (folder != null) {
            signedParams.put("folder", folder);
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", toFilePart(imageFile));
        body.add("api_key", cloudinaryProperties.getApiKey().trim());
        body.add("timestamp", timestamp);
        if (folder != null) {
            body.add("folder", folder);
        }
        body.add("signature", sign(signedParams));

        try {
            Map<String, Object> response = restClient.post()
                    .uri("https://api.cloudinary.com/v1_1/{cloudName}/image/upload",
                            cloudinaryProperties.getCloudName().trim())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            if (response == null) {
                throw new IllegalStateException("Cloudinary khong tra ve ket qua upload");
            }

            String secureUrl = stringValue(response.get("secure_url"));
            String publicId = stringValue(response.get("public_id"));
            if (secureUrl == null || publicId == null) {
                throw new IllegalStateException("Cloudinary response thieu secure_url hoac public_id");
            }

            return new RoomImageUploadResult(publicId, secureUrl);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Cloudinary upload that bai: HTTP " + exception.getStatusCode().value());
        }
    }

    private void assertConfigured() {
        if (isBlank(cloudinaryProperties.getCloudName())
                || isBlank(cloudinaryProperties.getApiKey())
                || isBlank(cloudinaryProperties.getApiSecret())) {
            throw new IllegalStateException("Chua cau hinh Cloudinary cloud name, api key hoac api secret");
        }
    }

    private HttpEntity<ByteArrayResource> toFilePart(RoomImageFile imageFile) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(imageFile.contentType()));

        ByteArrayResource resource = new ByteArrayResource(imageFile.content()) {
            @Override
            public String getFilename() {
                return normalizeFileName(imageFile.fileName());
            }
        };

        return new HttpEntity<>(resource, headers);
    }

    private String sign(Map<String, String> params) {
        String payload = params.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"))
                + cloudinaryProperties.getApiSecret().trim();

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Khong the tao chu ky Cloudinary");
        }
    }

    private String normalizeFileName(String fileName) {
        if (isBlank(fileName)) {
            return "room-image";
        }

        return fileName.trim().replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private String normalizeOptional(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }
}
