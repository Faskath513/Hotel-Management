using HotelApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();
}