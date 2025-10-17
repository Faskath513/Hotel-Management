namespace HotelApi.Models;

public class Room
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string Number { get; set; } = default!;
    public string Type { get; set; } = "Standard"; // Standard, Deluxe, Suite...
    public decimal PricePerNight { get; set; }
}