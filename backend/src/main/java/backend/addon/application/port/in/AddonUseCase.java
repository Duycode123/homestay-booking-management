package backend.addon.application.port.in;

import backend.addon.domain.model.AddonCatalogItem;
import backend.addon.domain.model.AddonQuote;
import backend.addon.domain.model.AddonSelection;
import backend.addon.domain.model.BookingAddonItem;
import backend.addon.domain.model.BookingAddonStatus;

import java.math.BigDecimal;
import java.util.List;

public interface AddonUseCase {
    List<AddonCatalogItem> listAvailableForRoom(Integer roomId);

    List<AddonCatalogItem> listAllCatalogItems();

    AddonCatalogItem createCatalogItem(AddonCatalogItem item);

    AddonCatalogItem updateCatalogItem(Long id, AddonCatalogItem item);

    AddonCatalogItem setCatalogItemActive(Long id, boolean active);

    AddonQuote quote(Integer roomId, List<AddonSelection> selections);

    void attachInitialAddons(Integer bookingId, AddonQuote quote);

    List<BookingAddonItem> listForBookingInternal(Integer bookingId);

    List<BookingAddonItem> listForManagement(Integer bookingId, String managementEmail);

    List<BookingAddonItem> listForCustomer(Integer bookingId, String customerEmail);

    List<BookingAddonItem> requestDuringStay(Integer bookingId, String customerEmail, List<AddonSelection> selections);

    BookingAddonItem cancelCustomerRequest(Integer bookingId, Long bookingAddonId, String customerEmail);

    BookingAddonItem updateStatus(
            Integer bookingId,
            Long bookingAddonId,
            BookingAddonStatus status,
            String managementEmail
    );

    void confirmInitialAddons(Integer bookingId);

    void cancelUndeliveredAddons(Integer bookingId);

    BigDecimal getIncludedAddonAmount(Integer bookingId);
}
