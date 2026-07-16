package backend.addon.adapter.in.web.dto;

import backend.addon.domain.model.BookingAddonStatus;
import jakarta.validation.constraints.NotNull;

public record AddonStatusRequest(@NotNull BookingAddonStatus status) {}
