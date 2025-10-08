using System.ComponentModel.DataAnnotations.Schema;

namespace HotelApi.Models;

public class Booking
{
    public int Id { get; set; }

    public int RoomId { get; set; }
    public Room? Room { get; set; }

    public int GuestId { get; set; }
    public Guest? Guest { get; set; }

    public DateTime CheckIn { get; set; }    // Use only the Date part in requests
    public DateTime CheckOut { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    public string Status { get; set; } = "Confirmed";
}