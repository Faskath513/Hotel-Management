using HotelApi.Data;
using HotelApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelApi.Endpoints;

public static class BookingsEndpoints
{
    public static void MapBookingsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/bookings", async (AppDbContext db) =>
            await db.Bookings.Include(b => b.Room).Include(b => b.Guest)
                .OrderByDescending(b => b.CheckIn).ToListAsync());

        app.MapPost("/bookings", async (AppDbContext db, BookingDto dto) =>
        {
            if (dto.CheckOut <= dto.CheckIn)
                return Results.BadRequest("Check-out must be after check-in.");

            var room = await db.Rooms.FindAsync(dto.RoomId);
            var guest = await db.Guests.FindAsync(dto.GuestId);
            if (room is null || guest is null)
                return Results.NotFound("Room or guest not found.");

            var overlaps = await db.Bookings.AnyAsync(b =>
                b.RoomId == dto.RoomId && dto.CheckIn < b.CheckOut && dto.CheckOut > b.CheckIn);

            if (overlaps) return Results.Conflict("That room is already booked for the selected dates.");

            var nights = (dto.CheckOut.Date - dto.CheckIn.Date).TotalDays;
            var total = (decimal)nights * room!.PricePerNight;

            var booking = new Booking
            {
                RoomId = dto.RoomId,
                GuestId = dto.GuestId,
                CheckIn = dto.CheckIn.Date,
                CheckOut = dto.CheckOut.Date,
                TotalPrice = total,
                Status = "Confirmed"
            };

            db.Bookings.Add(booking);
            await db.SaveChangesAsync();
            return Results.Created($"/bookings/{booking.Id}", booking);
        });

        app.MapPut("/bookings/{id:int}", async (AppDbContext db, int id, Booking input) =>
        {
            var booking = await db.Bookings.FindAsync(id);
            if (booking is null) return Results.NotFound();
            booking.RoomId = input.RoomId;
            booking.GuestId = input.GuestId;
            booking.CheckIn = input.CheckIn;
            booking.CheckOut = input.CheckOut;
            booking.TotalPrice = input.TotalPrice;
            booking.Status = input.Status;
            await db.SaveChangesAsync();
            return Results.Ok(booking);
        });

        app.MapDelete("/bookings/{id:int}", async (AppDbContext db, int id) =>
        {
            var booking = await db.Bookings.FindAsync(id);
            if (booking is null) return Results.NotFound();
            db.Bookings.Remove(booking);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        app.MapPost("/bookings/{id:int}/checkin", async (AppDbContext db, int id) =>
        {
            var booking = await db.Bookings.Include(b => b.Room).Include(b => b.Guest).FirstOrDefaultAsync(b => b.Id == id);
            if (booking is null) return Results.NotFound();
            if (booking.Status == "CheckedOut") return Results.BadRequest("Booking already checked out.");
            booking.Status = "CheckedIn";
            await db.SaveChangesAsync();
            return Results.Ok(booking);
        });

        app.MapPost("/bookings/{id:int}/checkout", async (AppDbContext db, int id) =>
        {
            var booking = await db.Bookings.Include(b => b.Room).Include(b => b.Guest).FirstOrDefaultAsync(b => b.Id == id);
            if (booking is null) return Results.NotFound();
            if (booking.Status != "CheckedIn") return Results.BadRequest("Booking must be CheckedIn first.");
            booking.Status = "CheckedOut";
            await db.SaveChangesAsync();
            return Results.Ok(booking);
        });
    }
}


