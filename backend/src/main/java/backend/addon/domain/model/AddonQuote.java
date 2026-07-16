package backend.addon.domain.model;

import java.math.BigDecimal;
import java.util.List;

public record AddonQuote(List<QuotedAddon> items, BigDecimal totalAmount) {
    public static AddonQuote empty() {
        return new AddonQuote(List.of(), BigDecimal.ZERO.setScale(2));
    }
}
