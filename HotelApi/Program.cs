using HotelApi.Data;
using HotelApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// EF Core with SQLite
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// If you previously had UseHttpsRedirection but no https profile, either trust dev certs
// or comment this in/out as you prefer.
// app.UseHttpsRedirection();

app.MapGet("/", () => Results.Redirect("/swagger"));

// ---------- Rooms ----------
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
    return Results.NoContent();
});

app.MapDelete("/rooms/{id:int}", async (AppDbContext db, int id) =>
{
    var room = await db.Rooms.FindAsync(id);
    if (room is null) return Results.NotFound();
    db.Rooms.Remove(room);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---------- Guests ----------
app.MapGet("/guests", async (AppDbContext db) =>
    await db.Guests.OrderBy(g => g.FullName).ToListAsync());

app.MapPost("/guests", async (AppDbContext db, Guest guest) =>
{
    db.Guests.Add(guest);
    await db.SaveChangesAsync();
    return Results.Created($"/guests/{guest.Id}", guest);
});

// ---------- Bookings ----------
app.MapGet("/bookings", async (AppDbContext db) =>
    await db.Bookings.Include(b => b.Room).Include(b => b.Guest)
        .OrderByDescending(b => b.CheckIn)
        .ToListAsync());

app.MapPost("/bookings", async (AppDbContext db, BookingDto dto) =>
{
    if (dto.CheckOut <= dto.CheckIn)
        return Results.BadRequest("Check-out must be after check-in.");

    var room = await db.Rooms.FindAsync(dto.RoomId);
    var guest = await db.Guests.FindAsync(dto.GuestId);
    if (room is null || guest is null)
        return Results.NotFound("Room or guest not found.");

    var overlaps = await db.Bookings.AnyAsync(b =>
        b.RoomId == dto.RoomId &&
        dto.CheckIn < b.CheckOut &&
        dto.CheckOut > b.CheckIn);

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

app.Run();

