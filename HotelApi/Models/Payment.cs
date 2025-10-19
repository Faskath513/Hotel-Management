using System.ComponentModel.DataAnnotations.Schema;

namespace HotelApi.Models;

public class Payment
{
    public int Id { get; set; }
    
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Check
    
    public string? TransactionId { get; set; } // For card payments
    
    public string? CheckNumber { get; set; } // For check payments
    
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    
    public string Status { get; set; } = "Completed"; // Completed, Pending, Failed, Refunded
    
    public string? Notes { get; set; }
}

public class PaymentDto
{
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionId { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }
}

public class ReceiptDto
{
    public int PaymentId { get; set; }
    public int BookingId { get; set; }
    public string GuestName { get; set; } = default!;
    public string RoomNumber { get; set; } = default!;
    public string RoomType { get; set; } = default!;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = default!;
    public string? TransactionId { get; set; }
    public string? CheckNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Notes { get; set; }
}
