package backend.room.adapter.in.web.dto;

import backend.room.application.model.RoomImageUploadResult;
import lombok.Builder;

@Builder
public record RoomImageUploadResponse(
        String publicId,
        String secureUrl
) {
    public static RoomImageUploadResponse from(RoomImageUploadResult result) {
        return RoomImageUploadResponse.builder()
                .publicId(result.publicId())
                .secureUrl(result.secureUrl())
                .build();
    }
}
