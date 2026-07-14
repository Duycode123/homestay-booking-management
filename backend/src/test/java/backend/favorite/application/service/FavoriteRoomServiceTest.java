package backend.favorite.application.service;

import backend.exception.ResourceNotFoundException;
import backend.favorite.application.port.out.FavoriteRoomPort;
import backend.favorite.domain.model.FavoriteRoom;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteRoomServiceTest {

    @Mock
    private FavoriteRoomPort favoriteRoomPort;

    @Test
    void addingExistingFavoriteIsIdempotent() {
        FavoriteRoom favorite = favoriteRoom(3);
        when(favoriteRoomPort.findByAccountEmailAndRoomId("guest@example.com", 3))
                .thenReturn(Optional.of(favorite));

        FavoriteRoomService service = new FavoriteRoomService(favoriteRoomPort);
        FavoriteRoom result = service.addFavorite("guest@example.com", 3);

        assertEquals(favorite, result);
        verify(favoriteRoomPort, never()).save(anyString(), anyInt());
    }

    @Test
    void removingMissingFavoriteReturnsNotFound() {
        when(favoriteRoomPort.delete("guest@example.com", 8)).thenReturn(false);
        FavoriteRoomService service = new FavoriteRoomService(favoriteRoomPort);

        assertThrows(ResourceNotFoundException.class, () -> service.removeFavorite("guest@example.com", 8));
    }

    @Test
    void listsFavoritesFromPort() {
        when(favoriteRoomPort.findByAccountEmail("guest@example.com")).thenReturn(List.of(favoriteRoom(5)));
        FavoriteRoomService service = new FavoriteRoomService(favoriteRoomPort);

        assertEquals(1, service.getFavorites("guest@example.com").size());
    }

    private FavoriteRoom favoriteRoom(int roomId) {
        return new FavoriteRoom(
                roomId,
                "Deluxe Balcony",
                "Deluxe",
                3,
                new BigDecimal("550000.00"),
                "/images/room.png",
                LocalDateTime.of(2026, 7, 14, 10, 0)
        );
    }
}
