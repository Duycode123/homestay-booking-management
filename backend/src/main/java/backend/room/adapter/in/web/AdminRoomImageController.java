package backend.room.adapter.in.web;

import backend.common.ApiResponse;
import backend.room.adapter.in.web.dto.RoomImageUploadResponse;
import backend.room.application.model.RoomImageUploadResult;
import backend.room.application.port.in.UploadRoomImageAssetUseCase;
import backend.room.application.port.in.command.UploadRoomImageAssetCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/room-images")
@RequiredArgsConstructor
public class AdminRoomImageController {

    private final UploadRoomImageAssetUseCase uploadRoomImageAssetUseCase;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RoomImageUploadResponse>> uploadRoomImage(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        byte[] content = readFile(file);
        RoomImageUploadResult result = uploadRoomImageAssetUseCase.uploadRoomImage(new UploadRoomImageAssetCommand(
                authentication == null ? null : authentication.getName(),
                file.getOriginalFilename(),
                file.getContentType(),
                content
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<RoomImageUploadResponse>builder()
                .success(true)
                .message("Tai anh phong len Cloudinary thanh cong")
                .data(RoomImageUploadResponse.from(result))
                .build());
    }

    private byte[] readFile(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the doc file anh tai len");
        }
    }
}
