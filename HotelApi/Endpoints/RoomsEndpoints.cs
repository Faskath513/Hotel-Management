using HotelApi.Data;
using HotelApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelApi.Endpoints;

public static class RoomsEndpoints
{
    public static void MapRoomsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/rooms", async (AppDbContext db) =>
            await db.Rooms.OrderBy(r => r.Number).ToListAsync());

        app.MapGet("/rooms/{id:int}", async (AppDbContext db, int id) =>
            await db.Rooms.FindAsync(id) is Room r ? Results.Ok(r) : Results.NotFound());

        app.MapPost("/rooms", async (AppDbContext db, Room room) =>
        {
            db.Rooms.Add(room);
            await db.SaveChangesAsync();
            return Results.Created($"/rooms/{room.Id}", room);
        });

        app.MapPut("/rooms/{id:int}", async (AppDbContext db, int id, Room input) =>
        {
            var room = await db.Rooms.FindAsync(id);
            if (room is null) return Results.NotFound();
            room.Number = input.Number;
            room.Type = input.Type;
            room.PricePerNight = input.PricePerNight;
            await db.SaveChangesAsync();
            return Results.Ok(room);
        });

        app.MapDelete("/rooms/{id:int}", async (AppDbContext db, int id) =>
        {
            var room = await db.Rooms.FindAsync(id);
            if (room is null) return Results.NotFound();
            db.Rooms.Remove(room);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}


