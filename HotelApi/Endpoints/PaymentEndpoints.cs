using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HotelApi.Data;
using HotelApi.Models;

namespace HotelApi.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        // Get all payments
        app.MapGet("/payments", async (AppDbContext db) =>
        {
            var payments = await db.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Room)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Guest)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
            
            return Results.Ok(payments);
        });

        // Get payment by ID
        app.MapGet("/payments/{id}", async (int id, AppDbContext db) =>
        {
            var payment = await db.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Room)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Guest)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (payment == null)
                return Results.NotFound();
            
            return Results.Ok(payment);
        });

        // Create payment
        app.MapPost("/payments", async (AppDbContext db, PaymentDto dto) =>
        {
            // Verify booking exists
            var booking = await db.Bookings
                .Include(b => b.Room)
                .Include(b => b.Guest)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId);
            
            if (booking == null)
                return Results.BadRequest("Booking not found");
            
            // Validate payment amount
            if (dto.Amount <= 0)
                return Results.BadRequest("Payment amount must be greater than 0");
            
            // Check if payment amount doesn't exceed booking total
            var existingPayments = await db.Payments
                .Where(p => p.BookingId == dto.BookingId && p.Status == "Completed")
                .SumAsync(p => p.Amount);
            
            if (existingPayments + dto.Amount > booking.TotalPrice)
                return Results.BadRequest("Payment amount exceeds remaining balance");
            
            var payment = new Payment
            {
                BookingId = dto.BookingId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                TransactionId = dto.TransactionId,
                CheckNumber = dto.CheckNumber,
                Notes = dto.Notes,
                PaymentDate = DateTime.UtcNow
            };
            
            db.Payments.Add(payment);
            await db.SaveChangesAsync();
            
            // Load the payment with related data
            var createdPayment = await db.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Room)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Guest)
                .FirstAsync(p => p.Id == payment.Id);
            
            return Results.Created($"/payments/{payment.Id}", createdPayment);
        });

        // Generate receipt
        app.MapGet("/payments/{id}/receipt", async (int id, AppDbContext db) =>
        {
            var payment = await db.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Room)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Guest)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (payment == null)
                return Results.NotFound();
            
            var receipt = new ReceiptDto
            {
                PaymentId = payment.Id,
                BookingId = payment.BookingId,
                GuestName = payment.Booking!.Guest!.FullName,
                RoomNumber = payment.Booking.Room!.Number,
                RoomType = payment.Booking.Room.Type,
                CheckIn = payment.Booking.CheckIn,
                CheckOut = payment.Booking.CheckOut,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                TransactionId = payment.TransactionId,
                CheckNumber = payment.CheckNumber,
                PaymentDate = payment.PaymentDate,
                Notes = payment.Notes
            };
            
            return Results.Ok(receipt);
        });

        // Get payments by booking
        app.MapGet("/bookings/{bookingId}/payments", async (int bookingId, AppDbContext db) =>
        {
            var payments = await db.Payments
                .Where(p => p.BookingId == bookingId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
            
            return Results.Ok(payments);
        });

        // Update payment status
        app.MapPut("/payments/{id}/status", async (int id, AppDbContext db, [FromBody] string status) =>
        {
            var payment = await db.Payments.FindAsync(id);
            if (payment == null)
                return Results.NotFound();
            
            payment.Status = status;
            await db.SaveChangesAsync();
            
            return Results.Ok(payment);
        });

        // Delete payment
        app.MapDelete("/payments/{id}", async (int id, AppDbContext db) =>
        {
            var payment = await db.Payments.FindAsync(id);
            if (payment == null)
                return Results.NotFound();
            
            db.Payments.Remove(payment);
            await db.SaveChangesAsync();
            
            return Results.NoContent();
        });
    }
}

