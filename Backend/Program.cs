using Backend.Services.Memory;
using Backend.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register the RoomService singleton
builder.Services.AddSingleton<RoomService>();

// Add SignalR
builder.Services.AddSignalR();

// Configure CORS for Angular frontend (allowing credentials for SignalR connection)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .SetIsOriginAllowed(origin => true) // Allow any origin dynamically to support both local and deployed hosts
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAngular");

app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub
app.MapHub<BingoHub>("/hubs/bingo");

app.Run();
