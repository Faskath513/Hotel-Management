using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HotelApi.Data;
using HotelApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HotelApi.Endpoints;

public static class AuthEndpoints
{
    public record LoginRequest(string Username, string Password);
    public record SignupRequest(string Username, string Password, string ConfirmPassword);

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app, IConfiguration config)
    {
        app.MapPost("/auth/signup", async (AppDbContext db, SignupRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest("Username and password are required.");

            if (req.Password != req.ConfirmPassword)
                return Results.BadRequest("Passwords do not match.");

            if (req.Password.Length < 6)
                return Results.BadRequest("Password must be at least 6 characters.");

            var exists = await db.Users.AnyAsync(u => u.Username == req.Username);
            if (exists) return Results.Conflict("Username already exists.");

            CreatePasswordHash(req.Password, out var hash, out var salt);
            var user = new User { Username = req.Username, PasswordHash = hash, PasswordSalt = salt };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/users/{user.Id}", new { user.Id, user.Username });
        });

        app.MapPost("/auth/login", async (AppDbContext db, LoginRequest req) =>
        {
            var user = await db.Users.SingleOrDefaultAsync(u => u.Username == req.Username);
            if (user is null || !VerifyPassword(req.Password, user.PasswordHash, user.PasswordSalt))
                return Results.Unauthorized();

            var secret = config["Jwt:Secret"] ?? "dev_secret_change_me_please_1234567890";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, req.Username),
                new Claim(ClaimTypes.Name, req.Username)
            };

            var token = new JwtSecurityToken(
                issuer: "HotelApi",
                audience: "HotelFrontend",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return Results.Ok(new { token = jwt, username = user.Username });
        });

        app.MapPost("/auth/logout", () => Results.Ok());

        static void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
        {
            using var hmac = new HMACSHA256();
            salt = hmac.Key;
            hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        static bool VerifyPassword(string password, byte[] hash, byte[] salt)
        {
            using var hmac = new HMACSHA256(salt);
            var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return CryptographicOperations.FixedTimeEquals(computed, hash);
        }
    }
}


