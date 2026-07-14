package backend.refund.adapter.out.cloudinary;

import backend.config.CloudinaryProperties;
import backend.refund.application.model.RefundProofFile;
import backend.refund.application.model.RefundProofUploadResult;
import backend.refund.application.port.out.RefundProofStoragePort;
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
public class CloudinaryRefundProofStorageAdapter implements RefundProofStoragePort {

    private final CloudinaryProperties properties;
    private final RestClient restClient = RestClient.create();

    @Override
    public RefundProofUploadResult upload(RefundProofFile file) {
        assertConfigured();
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String folder = refundFolder();
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put("folder", folder);
        signedParams.put("timestamp", timestamp);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", filePart(file));
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
                    .body(new ParameterizedTypeReference<>() {});
            if (response == null || !(response.get("secure_url") instanceof String secureUrl)
                    || !(response.get("public_id") instanceof String publicId)) {
                throw new IllegalStateException("Cloudinary khong tra ve anh bien lai hop le");
            }
            return new RefundProofUploadResult(publicId, secureUrl);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Cloudinary upload bien lai that bai: HTTP " + exception.getStatusCode().value());
        }
    }

    private HttpEntity<ByteArrayResource> filePart(RefundProofFile file) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.contentType()));
        ByteArrayResource resource = new ByteArrayResource(file.content()) {
            @Override
            public String getFilename() {
                return file.fileName() == null || file.fileName().isBlank()
                        ? "refund-proof"
                        : file.fileName().trim().replaceAll("[^A-Za-z0-9._-]", "_");
            }
        };
        return new HttpEntity<>(resource, headers);
    }

    private String refundFolder() {
        String configured = properties.getRefundProofFolder();
        if (configured != null && !configured.isBlank()) return configured.trim().replaceAll("/+$", "");
        String base = properties.getFolder();
        return base == null || base.isBlank() ? "homestay/refunds" : base.trim().replaceAll("/+$", "") + "/refunds";
    }

    private String sign(Map<String, String> params) {
        String payload = params.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&")) + properties.getApiSecret().trim();
        try {
            byte[] hash = MessageDigest.getInstance("SHA-1").digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(hash.length * 2);
            for (byte value : hash) result.append(String.format("%02x", value));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Khong the tao chu ky Cloudinary");
        }
    }

    private void assertConfigured() {
        if (blank(properties.getCloudName()) || blank(properties.getApiKey()) || blank(properties.getApiSecret())) {
            throw new IllegalStateException("Chua cau hinh Cloudinary de tai anh bien lai");
        }
    }

    private boolean blank(String value) {
        return value == null || value.trim().isBlank();
    }
}
