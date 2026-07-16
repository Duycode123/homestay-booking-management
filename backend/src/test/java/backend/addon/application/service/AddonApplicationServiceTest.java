package backend.addon.application.service;

import backend.addon.application.model.AddonActor;
import backend.addon.application.port.out.AddonBookingContextPort;
import backend.addon.application.port.out.AddonPersistencePort;
import backend.addon.domain.model.AddonCatalogItem;
import backend.addon.domain.model.AddonQuote;
import backend.addon.domain.model.AddonSelection;
import backend.addon.domain.model.AddonSource;
import backend.addon.domain.model.BookingAddonItem;
import backend.addon.domain.model.BookingAddonStatus;
import backend.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddonApplicationServiceTest {
    @Mock
    private AddonPersistencePort persistencePort;
    @Mock
    private AddonBookingContextPort bookingContextPort;
    @InjectMocks
    private AddonApplicationService service;

    @Test
    void quoteUsesCatalogPriceAndQuantityInsteadOfTrustingClientAmount() {
        when(bookingContextPort.findRoomTierId(7)).thenReturn(Optional.of(2));
        when(persistencePort.findCatalogItem(11L)).thenReturn(Optional.of(catalogItem(11L, 2, "150000")));

        AddonQuote quote = service.quote(7, List.of(new AddonSelection(11L, 3, "It cay")));

        assertThat(quote.totalAmount()).isEqualByComparingTo("450000.00");
        assertThat(quote.items()).singleElement().satisfies(item -> {
            assertThat(item.unitPrice()).isEqualByComparingTo("150000.00");
            assertThat(item.quantity()).isEqualTo(3);
        });
    }

    @Test
    void staffCannotProcessAddonOutsideTheirAssignedShift() {
        when(bookingContextPort.findActor("staff@serene.vn"))
                .thenReturn(Optional.of(new AddonActor(9, "staff@serene.vn", "STAFF")));
        when(bookingContextPort.canStaffAccessBooking("staff@serene.vn", 21)).thenReturn(false);

        assertThatThrownBy(() -> service.updateStatus(
                21, 31L, BookingAddonStatus.CONFIRMED, "staff@serene.vn"
        )).isInstanceOf(ForbiddenException.class);

        verify(persistencePort, never()).findBookingAddonForUpdate(21, 31L);
    }

    @Test
    void deliveredDuringStayAddonIncreasesBookingTotalExactlyOnce() {
        BookingAddonItem requested = bookingAddon(31L, BookingAddonStatus.PREPARED);
        BookingAddonItem delivered = bookingAddon(31L, BookingAddonStatus.DELIVERED);
        when(bookingContextPort.findActor("admin@serene.vn"))
                .thenReturn(Optional.of(new AddonActor(1, "admin@serene.vn", "ADMIN")));
        when(persistencePort.findBookingAddonForUpdate(21, 31L)).thenReturn(Optional.of(requested));
        when(persistencePort.updateBookingAddon(requested, BookingAddonStatus.DELIVERED, 1, true))
                .thenReturn(delivered);

        BookingAddonItem result = service.updateStatus(
                21, 31L, BookingAddonStatus.DELIVERED, "admin@serene.vn"
        );

        assertThat(result.status()).isEqualTo(BookingAddonStatus.DELIVERED);
        verify(bookingContextPort).addDeliveredAddonAmount(21, new BigDecimal("300000.00"));
    }

    @Test
    void deliveredAddonCannotBeDeliveredOrCancelledAgain() {
        BookingAddonItem delivered = bookingAddon(31L, BookingAddonStatus.DELIVERED);
        when(bookingContextPort.findActor("admin@serene.vn"))
                .thenReturn(Optional.of(new AddonActor(1, "admin@serene.vn", "ADMIN")));
        when(persistencePort.findBookingAddonForUpdate(21, 31L)).thenReturn(Optional.of(delivered));

        assertThatThrownBy(() -> service.updateStatus(
                21, 31L, BookingAddonStatus.CANCELLED, "admin@serene.vn"
        )).isInstanceOf(IllegalStateException.class);

        verify(bookingContextPort, never()).addDeliveredAddonAmount(21, delivered.totalAmount());
    }

    private AddonCatalogItem catalogItem(Long id, Integer tierId, String price) {
        return new AddonCatalogItem(
                id, "Set BBQ", "Bep va than", null, new BigDecimal(price), "set",
                tierId, "Deluxe", true, null, null
        );
    }

    private BookingAddonItem bookingAddon(Long id, BookingAddonStatus status) {
        return new BookingAddonItem(
                id, 21, 11L, "Set BBQ", "set", new BigDecimal("300000.00"), 1,
                new BigDecimal("300000.00"), AddonSource.DURING_STAY, status, null, null, null
        );
    }
}
