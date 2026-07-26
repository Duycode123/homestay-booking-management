package backend.config;

import backend.entity.RoomType;
import backend.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DefaultRoomTypeSeeder implements ApplicationRunner {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roomTypeRepository.count() > 0) {
            return;
        }

        roomTypeRepository.saveAll(List.of(
                RoomType.builder()
                        .typeName("Standard")
                        .description("Căn lưu trú tiện nghi, phù hợp cho 1-2 khách.")
                        .pricePerHour(new BigDecimal("100000"))
                        .build(),
                RoomType.builder()
                        .typeName("Deluxe")
                        .description("Căn rộng rãi, có không gian riêng và tiện nghi nâng cấp.")
                        .pricePerHour(new BigDecimal("150000"))
                        .build(),
                RoomType.builder()
                        .typeName("Family")
                        .description("Căn nguyên căn cho gia đình, có khu sinh hoạt chung và sức chứa lớn.")
                        .pricePerHour(new BigDecimal("200000"))
                        .build()
        ));
    }
}
