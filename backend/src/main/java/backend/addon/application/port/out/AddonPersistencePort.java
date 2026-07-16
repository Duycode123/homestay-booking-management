package backend.addon.application.port.out;

import backend.addon.domain.model.AddonCatalogItem;
import backend.addon.domain.model.BookingAddonItem;
import backend.addon.domain.model.BookingAddonStatus;
import backend.addon.domain.model.QuotedAddon;

import java.util.List;
import java.util.Optional;

public interface AddonPersistencePort {
    List<AddonCatalogItem> findAllCatalogItems();

    List<AddonCatalogItem> findActiveCatalogItems(Integer roomTierId);

    Optional<AddonCatalogItem> findCatalogItem(Long id);

    AddonCatalogItem saveCatalogItem(AddonCatalogItem item);

    void saveInitialBookingAddons(Integer bookingId, List<QuotedAddon> items);

    void saveDuringStayRequests(Integer bookingId, Integer requestedByUserId, List<QuotedAddon> items);

    List<BookingAddonItem> findBookingAddons(Integer bookingId);

    Optional<BookingAddonItem> findBookingAddonForUpdate(Integer bookingId, Long bookingAddonId);

    BookingAddonItem updateBookingAddon(
            BookingAddonItem item,
            BookingAddonStatus status,
            Integer confirmedByUserId,
            boolean markDelivered
    );

    void updateStatuses(Integer bookingId, BookingAddonStatus from, BookingAddonStatus to);

    void cancelUndelivered(Integer bookingId);
}
