package backend.config;

import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FlywayMigrationImmutabilityTest {

    @Test
    void appliedBootstrapMigrationsKeepTheirProductionChecksums() throws IOException {
        assertEquals(973202891, checksum("/db/migration/V1__canonical_schema.sql"));
        assertEquals(-1350722877, checksum("/db/migration/V2__runtime_additions.sql"));
    }

    private int checksum(String resourcePath) throws IOException {
        InputStream stream = getClass().getResourceAsStream(resourcePath);
        assertNotNull(stream, "Missing Flyway migration " + resourcePath);

        CRC32 crc32 = new CRC32();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line = reader.readLine();
            if (line != null) {
                line = stripBom(line);
                do {
                    crc32.update(line.getBytes(StandardCharsets.UTF_8));
                } while ((line = reader.readLine()) != null);
            }
        }
        return (int) crc32.getValue();
    }

    private String stripBom(String value) {
        return value.startsWith("\uFEFF") ? value.substring(1) : value;
    }
}
