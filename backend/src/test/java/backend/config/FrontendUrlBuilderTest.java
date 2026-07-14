package backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FrontendUrlBuilderTest {

    @Test
    void blankConfigurationFallsBackToLocalFrontend() {
        FrontendUrlBuilder builder = new FrontendUrlBuilder("  ");

        assertEquals(
                "http://localhost:3000/verify-email?token=abc",
                builder.linkTo("/verify-email?token=abc")
        );
    }

    @Test
    void removesTrailingSlashesBeforeJoiningPath() {
        FrontendUrlBuilder builder = new FrontendUrlBuilder("https://stay.example.com///");

        assertEquals(
                "https://stay.example.com/verify-email?token=abc",
                builder.linkTo("/verify-email?token=abc")
        );
    }

    @Test
    void rejectsMalformedOrNonHttpBaseUrl() {
        assertThrows(IllegalStateException.class, () -> new FrontendUrlBuilder("http:///missing-host"));
        assertThrows(IllegalStateException.class, () -> new FrontendUrlBuilder("javascript:alert(1)"));
    }

    @Test
    void rejectsProtocolRelativeTargetPath() {
        FrontendUrlBuilder builder = new FrontendUrlBuilder("https://stay.example.com");

        assertThrows(IllegalArgumentException.class, () -> builder.linkTo("//malicious.example.com"));
    }
}
