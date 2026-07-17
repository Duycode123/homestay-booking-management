package backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloudinaryPropertiesTest {

    @Test
    void readsCredentialsFromCloudinaryUrl() {
        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setUrl("cloudinary://123456:secret%2Fvalue@serene-cloud");

        assertEquals("123456", properties.getApiKey());
        assertEquals("secret/value", properties.getApiSecret());
        assertEquals("serene-cloud", properties.getCloudName());
        assertTrue(properties.hasValidCredentials());
    }

    @Test
    void explicitVariablesOverrideCloudinaryUrl() {
        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setUrl("cloudinary://url-key:url-secret@url-cloud");
        properties.setApiKey("explicit-key");
        properties.setApiSecret("explicit-secret");
        properties.setCloudName("explicit-cloud");

        assertEquals("explicit-key", properties.getApiKey());
        assertEquals("explicit-secret", properties.getApiSecret());
        assertEquals("explicit-cloud", properties.getCloudName());
    }

    @Test
    void rejectsPlaceholderCredentialsBeforeCallingCloudinary() {
        CloudinaryProperties properties = new CloudinaryProperties();
        properties.setApiKey("your_api_key");
        properties.setApiSecret("your_api_secret");
        properties.setCloudName("your_cloud_name");

        assertFalse(properties.hasValidCredentials());
    }
}
