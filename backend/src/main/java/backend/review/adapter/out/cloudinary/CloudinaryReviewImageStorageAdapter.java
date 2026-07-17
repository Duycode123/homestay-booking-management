package backend.review.adapter.out.cloudinary;

import backend.config.CloudinaryProperties;
import backend.exception.ImageStorageUnavailableException;
import backend.review.application.model.ReviewImageFile;
import backend.review.application.model.ReviewImageUploadResult;
import backend.review.application.port.out.ReviewImageStoragePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class CloudinaryReviewImageStorageAdapter implements ReviewImageStoragePort {

    private final CloudinaryProperties properties;
    private final RestClient restClient = RestClient.create();

    @Override
    public ReviewImageUploadResult upload(ReviewImageFile imageFile) {
        assertConfigured();

        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String folder = reviewFolder();
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put("folder", folder);
        signedParams.put("timestamp", timestamp);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", toFilePart(imageFile));
        body.add("api_key", properties.getApiKey().trim());
        body.add("folder", folder);
        body.add("timestamp", timestamp);
        body.add("signature", sign(signedParams));

        try {
            Map<String, Object> response = restClient.post()
                    .uri("https://api.cloudinary.com/v1_1/{cloudName}/image/upload", properties.getCloudName().trim())
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
            return new ReviewImageUploadResult(publicId, secureUrl);
        } catch (RestClientResponseException exception) {
            log.warn("Cloudinary review upload rejected with status {}: {}",
                    exception.getStatusCode().value(), safeResponse(exception.getResponseBodyAsString()));
            throw new ImageStorageUnavailableException("Cloudinary review upload failed", exception);
        }
    }

    private HttpEntity<ByteArrayResource> toFilePart(ReviewImageFile imageFile) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(imageFile.contentType()));
        ByteArrayResource resource = new ByteArrayResource(imageFile.content()) {
            @Override
            public String getFilename() {
                if (imageFile.fileName() == null || imageFile.fileName().isBlank()) {
                    return "review-image";
                }
                return imageFile.fileName().trim().replaceAll("[^A-Za-z0-9._-]", "_");
            }
        };
        return new HttpEntity<>(resource, headers);
    }

    private String reviewFolder() {
        String configured = properties.getReviewFolder();
        return configured == null || configured.isBlank()
                ? "homestay-booking-management/reviews"
                : configured.trim().replaceAll("/+$", "");
    }

    private String sign(Map<String, String> params) {
        String payload = params.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"))
                + properties.getApiSecret().trim();
        try {
            byte[] hash = MessageDigest.getInstance("SHA-1").digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Khong the tao chu ky Cloudinary");
        }
    }

    private void assertConfigured() {
        if (!properties.hasValidCredentials()) {
            throw new ImageStorageUnavailableException("Cloudinary credentials are missing or invalid");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private String safeResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return "empty response";
        return responseBody.replaceAll("(?i)(api[_-]?secret|signature)\\s*[:=]\\s*[^,}]+", "$1=[redacted]");
    }
}
