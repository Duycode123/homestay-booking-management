package backend.repository;

import backend.entity.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {
    List<RoomType> findAllByActiveTrueOrderByTypeNameAsc();

    boolean existsByTypeName(String typeName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rt FROM RoomType rt WHERE rt.id = :id")
    Optional<RoomType> findByIdForUpdate(@Param("id") Integer id);
}
