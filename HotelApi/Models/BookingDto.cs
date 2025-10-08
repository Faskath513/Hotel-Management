namespace HotelApi.Models;

public record BookingDto(int RoomId, int GuestId, DateTime CheckIn, DateTime CheckOut);