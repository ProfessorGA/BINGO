using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Backend.Services.Memory;
using Backend.DTOs;
using Backend.SignalR;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("room")]
    public class RoomController : ControllerBase
    {
        private readonly RoomService _roomService;
        private readonly IHubContext<BingoHub> _hubContext;

        public RoomController(RoomService roomService, IHubContext<BingoHub> hubContext)
        {
            _roomService = roomService;
            _hubContext = hubContext;
        }

        [HttpPost("create")]
        public IActionResult CreateRoom([FromBody] CreateRoomRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var room = _roomService.CreateRoom(request.HostName, out var playerId);
            if (room == null)
            {
                return StatusCode(500, new { Error = "Failed to create room. Please try again." });
            }

            return Ok(new
            {
                Room = room.ToDto(),
                PlayerId = playerId
            });
        }

        [HttpPost("join")]
        public IActionResult JoinRoom([FromBody] JoinRoomRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var room = _roomService.JoinRoom(request.RoomCode, request.PlayerName, out var playerId, out var errorMessage);
            if (room == null)
            {
                return BadRequest(new { Error = errorMessage });
            }

            // Notify the room that a player has joined via SignalR
            _hubContext.Clients.Group(room.RoomCode).SendAsync("UpdateBoard", room.ToDto());

            return Ok(new
            {
                Room = room.ToDto(),
                PlayerId = playerId
            });
        }

        [HttpGet("{code}")]
        public IActionResult GetRoom(string code)
        {
            var room = _roomService.GetRoom(code);
            if (room == null)
            {
                return NotFound(new { Error = "Room not found." });
            }

            return Ok(room.ToDto());
        }

        [HttpPost("leave")]
        public async Task<IActionResult> LeaveRoom([FromBody] LeaveRoomRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var room = _roomService.GetRoom(request.RoomCode);
            if (room == null)
            {
                return Ok(new { Message = "Room already closed or does not exist." });
            }

            var leavingPlayer = room.GetPlayer(request.PlayerId);
            if (leavingPlayer == null)
            {
                return BadRequest(new { Error = "Player not in room." });
            }

            room.Players.Remove(leavingPlayer);

            // Reassign host if the leaving player was the host
            if (leavingPlayer.IsHost && room.Players.Any())
            {
                room.Players[0].IsHost = true;
            }

            // If remaining connected players is less than 2, close the room
            int activePlayersCount = room.Players.Count(p => p.IsConnected);
            if (activePlayersCount < 2)
            {
                _roomService.RemoveRoom(request.RoomCode);
                await _hubContext.Clients.Group(request.RoomCode).SendAsync("RoomClosed");
            }
            else
            {
                await _hubContext.Clients.Group(request.RoomCode).SendAsync("PlayerLeft", request.PlayerId);

                // If it was the leaving player's turn, advance turn
                if (room.CurrentTurnPlayerId == request.PlayerId)
                {
                    int nextIndex = 0;
                    room.CurrentTurnPlayerId = room.Players[nextIndex].PlayerId;
                }

                await _hubContext.Clients.Group(request.RoomCode).SendAsync("UpdateBoard", room.ToDto());
            }

            return Ok(new { Message = "Successfully left room." });
        }
    }
}
