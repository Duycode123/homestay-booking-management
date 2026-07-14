package backend.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SchemaBootstrapSafetyTest {

    @Test
    void startupSchemaDoesNotRecreateAdminManagedCommonAmenities() throws IOException {
        try (InputStream stream = getClass().getResourceAsStream("/schema-postgresql.sql")) {
            assertNotNull(stream);
            String schema = new String(stream.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();

            assertFalse(schema.contains("insert into common_amenity"),
                    "Startup schema must not seed mutable common amenities");
        }
    }
}
