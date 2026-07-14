package backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

@Component
public class FrontendUrlBuilder {

    static final String DEFAULT_FRONTEND_BASE_URL = "http://localhost:3000";

    private final String frontendBaseUrl;

    public FrontendUrlBuilder(
            @Value("${app.frontend.base-url:http://localhost:3000}") String configuredFrontendBaseUrl
    ) {
        this.frontendBaseUrl = normalizeBaseUrl(configuredFrontendBaseUrl);
    }

    public String linkTo(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Duong dan frontend khong duoc de trong");
        }

        String normalizedPath = path.trim();
        if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
            throw new IllegalArgumentException("Duong dan frontend phai bat dau bang mot dau /");
        }

        return frontendBaseUrl + normalizedPath;
    }

    static String normalizeBaseUrl(String configuredFrontendBaseUrl) {
        String candidate = configuredFrontendBaseUrl == null || configuredFrontendBaseUrl.isBlank()
                ? DEFAULT_FRONTEND_BASE_URL
                : configuredFrontendBaseUrl.trim();

        URI uri;
        try {
            uri = new URI(candidate);
        } catch (URISyntaxException ex) {
            throw invalidBaseUrl(ex);
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!("http".equals(scheme) || "https".equals(scheme))
                || uri.getHost() == null
                || uri.getHost().isBlank()
                || uri.getRawQuery() != null
                || uri.getRawFragment() != null
                || uri.getRawUserInfo() != null) {
            throw invalidBaseUrl(null);
        }

        return candidate.replaceAll("/+$", "");
    }

    private static IllegalStateException invalidBaseUrl(Exception cause) {
        String message = "app.frontend.base-url phai la URL HTTP/HTTPS hop le, vi du http://localhost:3000";
        return cause == null ? new IllegalStateException(message) : new IllegalStateException(message, cause);
    }
}
