using HotelApi.Data;
using HotelApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelApi.Endpoints;

public static class GuestsEndpoints
{
    public static void MapGuestsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/guests", async (AppDbContext db) =>
            await db.Guests.OrderBy(g => g.FullName).ToListAsync());

        app.MapPost("/guests", async (AppDbContext db, Guest guest) =>
        {
            db.Guests.Add(guest);
            await db.SaveChangesAsync();
            return Results.Created($"/guests/{guest.Id}", guest);
        });

        app.MapPut("/guests/{id:int}", async (AppDbContext db, int id, Guest input) =>
        {
            var guest = await db.Guests.FindAsync(id);
            if (guest is null) return Results.NotFound();
            guest.FullName = input.FullName;
            guest.Email = input.Email;
            guest.Phone = input.Phone;
            await db.SaveChangesAsync();
            return Results.Ok(guest);
        });

        app.MapDelete("/guests/{id:int}", async (AppDbContext db, int id) =>
        {
            var guest = await db.Guests.FindAsync(id);
            if (guest is null) return Results.NotFound();
            db.Guests.Remove(guest);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}


