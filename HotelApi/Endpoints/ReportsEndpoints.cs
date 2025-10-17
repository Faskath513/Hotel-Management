using HotelApi.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelApi.Endpoints;

public static class ReportsEndpoints
{
    public static void MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/reports/available-rooms", async (AppDbContext db, DateTime? from, DateTime? to) =>
        {
            var start = (from ?? DateTime.UtcNow.Date).Date;
            var end = (to ?? start.AddDays(1)).Date;

            var occupiedRoomIds = await db.Bookings
                .Where(b => start < b.CheckOut && end > b.CheckIn)
                .Select(b => b.RoomId)
                .Distinct()
                .ToListAsync();

            var available = await db.Rooms
                .Where(r => !occupiedRoomIds.Contains(r.Id))
                .OrderBy(r => r.Number)
                .ToListAsync();
            return Results.Ok(available);
        });

        app.MapGet("/reports/occupied-rooms", async (AppDbContext db, DateTime? on) =>
        {
            var day = (on ?? DateTime.UtcNow.Date).Date;
            var occupied = await db.Bookings
                .Where(b => day >= b.CheckIn.Date && day < b.CheckOut.Date)
                .Include(b => b.Room)
                .ToListAsync();
            return Results.Ok(occupied);
        });

        app.MapGet("/reports/upcoming-checkouts", async (AppDbContext db, DateTime? until) =>
        {
            var end = (until ?? DateTime.UtcNow.Date.AddDays(1)).Date;
            var upcoming = await db.Bookings
                .Where(b => b.Status == "CheckedIn" && b.CheckOut.Date <= end)
                .OrderBy(b => b.CheckOut)
                .Include(b => b.Room)
                .Include(b => b.Guest)
                .ToListAsync();
            return Results.Ok(upcoming);
        });

        app.MapGet("/reports/daily-revenue", async (AppDbContext db, DateTime? day) =>
        {
            var date = (day ?? DateTime.UtcNow.Date).Date;
            var revenue = await db.Bookings
                .Where(b => b.Status == "CheckedOut" && b.CheckOut.Date == date)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
            return Results.Ok(new { date, revenue });
        });
    }
}


