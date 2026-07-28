package backend.validation;

import backend.dto.request.CreateRoomRequest;
import backend.dto.request.CreateRoomTypeRequest;
import backend.entity.AccommodationType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoomPriceValidationTest {

    @Test
    void acceptsArbitraryPositiveNightlyRateWithoutThousandStepRestriction() {
        CreateRoomRequest request = validRoomRequest();
        request.setBaseNightlyRate(new BigDecimal("2345678"));

        assertTrue(isValid(request));
    }

    @Test
    void acceptsArbitraryPositiveHourlyRateWithoutThousandStepRestriction() {
        CreateRoomTypeRequest request = new CreateRoomTypeRequest();
        request.setTypeName("Hạng linh hoạt");
        request.setPricePerHour(new BigDecimal("123457"));

        assertTrue(isValid(request));
    }

    @Test
    void stillRejectsNonPositiveRoomPrices() {
        CreateRoomRequest room = validRoomRequest();
        room.setBaseNightlyRate(BigDecimal.ZERO);

        CreateRoomTypeRequest roomType = new CreateRoomTypeRequest();
        roomType.setTypeName("Hạng không hợp lệ");
        roomType.setPricePerHour(BigDecimal.ZERO);

        assertFalse(isValid(room));
        assertFalse(isValid(roomType));
    }

    private CreateRoomRequest validRoomRequest() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setRoomName("Căn thử nghiệm");
        request.setRoomTypeId(1);
        request.setMaxPeople(4);
        request.setBedroomCount(2);
        request.setBedCount(2);
        request.setBathroomCount(1);
        request.setAccommodationType(AccommodationType.HOMESTAY);
        request.setAddressLine("123 Đường Kiểm Thử");
        request.setDistrict("Ba Vì");
        request.setCity("Hà Nội");
        request.setLatitude(new BigDecimal("21.0285"));
        request.setLongitude(new BigDecimal("105.8542"));
        request.setCheckInRadiusMeters(100);
        request.setBaseNightlyRate(BigDecimal.ONE);
        return request;
    }

    private boolean isValid(Object request) {
        try (ValidatorFactory validatorFactory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = validatorFactory.getValidator();
            return validator.validate(request).isEmpty();
        }
    }
}
