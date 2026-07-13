package backend;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

class EncodingGuardTest {

    private static final byte[] UTF8_BOM = new byte[] {
            (byte) 0xEF,
            (byte) 0xBB,
            (byte) 0xBF
    };

    @Test
    void userFacingSourcesDoNotContainReplacementCharactersOrBom() throws IOException {
        List<String> violations = new ArrayList<>();

        inspectSources(Path.of("src", "main", "java"), List.of(".java"), violations);
        inspectSources(Path.of("..", "frontend", "app"), List.of(".ts", ".tsx"), violations);
        inspectSources(Path.of("..", "frontend", "components"), List.of(".ts", ".tsx"), violations);
        inspectSources(Path.of("..", "frontend", "lib"), List.of(".ts", ".tsx"), violations);

        assertTrue(
                violations.isEmpty(),
                () -> "Source encoding violations found:%n%s".formatted(String.join(System.lineSeparator(), violations))
        );
    }

    private void inspectSources(Path sourceRoot, List<String> extensions, List<String> violations) throws IOException {
        if (!Files.exists(sourceRoot)) {
            return;
        }

        try (Stream<Path> paths = Files.walk(sourceRoot)) {
            paths.filter(path -> hasExtension(path, extensions))
                    .forEach(path -> inspectSource(path, violations));
        }
    }

    private boolean hasExtension(Path path, List<String> extensions) {
        String fileName = path.getFileName().toString();
        return extensions.stream().anyMatch(fileName::endsWith);
    }

    private void inspectSource(Path path, List<String> violations) {
        try {
            byte[] bytes = Files.readAllBytes(path);
            if (startsWithBom(bytes)) {
                violations.add(path + " starts with UTF-8 BOM");
            }

            String text = new String(bytes, StandardCharsets.UTF_8);
            if (text.indexOf('\uFFFD') >= 0) {
                violations.add(path + " contains Unicode replacement character U+FFFD");
            }
        } catch (IOException ex) {
            violations.add(path + " could not be read: " + ex.getMessage());
        }
    }

    private boolean startsWithBom(byte[] bytes) {
        if (bytes.length < UTF8_BOM.length) {
            return false;
        }

        for (int i = 0; i < UTF8_BOM.length; i++) {
            if (bytes[i] != UTF8_BOM[i]) {
                return false;
            }
        }

        return true;
    }
}
