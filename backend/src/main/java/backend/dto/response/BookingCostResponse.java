package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookingCostResponse {

    private Integer roomId;
    private String roomName;
    private String typeName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private BigDecimal totalHours;
    private BigDecimal pricePerHour;
    private BigDecimal originalAmount;
    private String couponCode;
    private BigDecimal discountAmount;
    private BigDecimal addonAmount;
    private BigDecimal totalAmount;

    public BookingCostResponse(Integer roomId, String roomName, String typeName, LocalDateTime startTime,
                               LocalDateTime endTime, BigDecimal totalHours, BigDecimal pricePerHour,
                               BigDecimal originalAmount, String couponCode, BigDecimal discountAmount,
                               BigDecimal totalAmount) {
        this(roomId, roomName, typeName, startTime, endTime, totalHours, pricePerHour, originalAmount,
                couponCode, discountAmount, BigDecimal.ZERO.setScale(2), totalAmount);
    }
}
