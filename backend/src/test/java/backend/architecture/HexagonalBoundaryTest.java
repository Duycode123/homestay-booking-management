package backend.architecture;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

class HexagonalBoundaryTest {

    private static final Path SOURCE_ROOT = Path.of("src", "main", "java", "backend");
    private static final List<String> FORBIDDEN_CORE_DEPENDENCIES = List.of(
            "import backend.entity.",
            "import backend.repository.",
            "import jakarta.persistence.",
            "import org.springframework.data."
    );

    @Test
    void migratedApplicationAndDomainCodeStayIndependentFromPersistence() throws IOException {
        assertNoForbiddenDependencies(SOURCE_ROOT.resolve("homepage/application"));
        assertNoForbiddenDependencies(SOURCE_ROOT.resolve("support/application"));
        assertNoForbiddenDependencies(SOURCE_ROOT.resolve("support/domain"));
    }

    @Test
    void migratedWebAdaptersDependOnUseCasePortsInsteadOfConcreteServices() throws IOException {
        assertNoImport(SOURCE_ROOT.resolve("homepage/adapter/in"), "import backend.homepage.application.service.");
        assertNoImport(SOURCE_ROOT.resolve("support/adapter/in"), "import backend.support.application.service.");
        assertNoImport(SOURCE_ROOT.resolve("payment/adapter/in"), "import backend.payment.application.service.");
    }

    private void assertNoForbiddenDependencies(Path root) throws IOException {
        for (String forbiddenDependency : FORBIDDEN_CORE_DEPENDENCIES) {
            assertNoImport(root, forbiddenDependency);
        }
    }

    private void assertNoImport(Path root, String forbiddenImport) throws IOException {
        try (var files = Files.walk(root)) {
            for (Path file : files.filter(path -> path.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file);
                assertFalse(
                        source.contains(forbiddenImport),
                        () -> file + " must not depend on " + forbiddenImport
                );
            }
        }
    }
}
