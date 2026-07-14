package backend.repository;

import backend.entity.Room;
import backend.entity.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer>, JpaSpecificationExecutor<Room> {

    boolean existsByRoomName(String roomName);

    boolean existsByRoomType_Id(Integer roomTypeId);

    boolean existsByRoomType_IdAndStatusNot(Integer roomTypeId, RoomStatus status);

    @EntityGraph(attributePaths = "roomType")
    List<Room> findAllByOrderByRoomNameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "roomType")
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Integer id);
}
