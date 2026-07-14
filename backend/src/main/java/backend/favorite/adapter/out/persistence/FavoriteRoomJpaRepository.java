package backend.favorite.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface FavoriteRoomJpaRepository extends JpaRepository<FavoriteRoomEntity, Long> {

    @Query("""
            select favorite
            from FavoriteRoomEntity favorite
            join fetch favorite.room room
            join fetch room.roomType
            where lower(favorite.account.email) = lower(:email)
            order by favorite.createdAt desc
            """)
    List<FavoriteRoomEntity> findAllByAccountEmail(@Param("email") String email);

    @Query("""
            select favorite
            from FavoriteRoomEntity favorite
            join fetch favorite.room room
            join fetch room.roomType
            where lower(favorite.account.email) = lower(:email) and room.id = :roomId
            """)
    Optional<FavoriteRoomEntity> findByAccountEmailAndRoomId(
            @Param("email") String email,
            @Param("roomId") Integer roomId
    );

    long deleteByAccount_EmailIgnoreCaseAndRoom_Id(String email, Integer roomId);
}
