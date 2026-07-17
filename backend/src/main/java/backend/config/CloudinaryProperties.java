package backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

    private String url;
    private String cloudName;
    private String apiKey;
    private String apiSecret;
    private String folder = "homestay-booking-management/rooms";
    private String avatarFolder = "homestay-booking-management/avatars";
    private String refundProofFolder = "homestay-booking-management/refunds";
    private String reviewFolder = "homestay-booking-management/reviews";

    public String getCloudName() {
        return firstConfigured(cloudName, parseUrlCredentials().cloudName());
    }

    public String getApiKey() {
        return firstConfigured(apiKey, parseUrlCredentials().apiKey());
    }

    public String getApiSecret() {
        return firstConfigured(apiSecret, parseUrlCredentials().apiSecret());
    }

    public boolean hasValidCredentials() {
        return isRealValue(getCloudName()) && isRealValue(getApiKey()) && isRealValue(getApiSecret());
    }

    private CloudinaryCredentials parseUrlCredentials() {
        if (url == null || url.isBlank()) return CloudinaryCredentials.empty();
        try {
            URI uri = URI.create(url.trim());
            if (!"cloudinary".equalsIgnoreCase(uri.getScheme()) || uri.getRawUserInfo() == null) {
                return CloudinaryCredentials.empty();
            }
            String[] userInfo = uri.getRawUserInfo().split(":", 2);
            if (userInfo.length != 2) return CloudinaryCredentials.empty();
            return new CloudinaryCredentials(
                    decode(userInfo[0]),
                    decode(userInfo[1]),
                    uri.getHost()
            );
        } catch (IllegalArgumentException exception) {
            return CloudinaryCredentials.empty();
        }
    }

    private String firstConfigured(String explicitValue, String urlValue) {
        return isRealValue(explicitValue) ? explicitValue.trim() : urlValue;
    }

    private boolean isRealValue(String value) {
        if (value == null || value.isBlank()) return false;
        String normalized = value.trim().toLowerCase();
        return !normalized.startsWith("your_") && !normalized.startsWith("<");
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private record CloudinaryCredentials(String apiKey, String apiSecret, String cloudName) {
        private static CloudinaryCredentials empty() {
            return new CloudinaryCredentials(null, null, null);
        }
    }
}
