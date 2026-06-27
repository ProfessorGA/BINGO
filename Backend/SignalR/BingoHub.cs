using Microsoft.AspNetCore.SignalR;
using Backend.Services.Memory;
using Backend.DTOs;
using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.SignalR
{
    public class BingoHub : Hub
    {
        private readonly RoomService _roomService;
        private readonly IHubContext<BingoHub> _hubContext;

        public BingoHub(RoomService roomService, IHubContext<BingoHub> hubContext)
        {
            _roomService = roomService;
            _hubContext = hubContext;
        }

        public async Task JoinRoomHub(string roomCode, string playerId)
        {
            roomCode = roomCode.ToUpperInvariant();
            var room = _roomService.GetRoom(roomCode);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Error", "Room does not exist.");
                return;
            }

            var player = room.GetPlayer(playerId);
            if (player == null)
            {
                await Clients.Caller.SendAsync("Error", "Player is not registered in this room.");
                return;
            }

            // Cancel any pending disconnect countdown
            bool wasDisconnected = !player.IsConnected;
            _roomService.CancelDisconnect(roomCode, playerId);

            player.ConnectionId = Context.ConnectionId;
            player.IsConnected = true;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

            // Notify everyone in the room
            if (wasDisconnected)
            {
                await Clients.Group(roomCode).SendAsync("OpponentReconnected", playerId);
            }
            
            await Clients.Group(roomCode).SendAsync("UpdateBoard", room.ToDto());
        }

        public async Task StartSetup(string roomCode, string playerId)
        {
            roomCode = roomCode.ToUpperInvariant();
            var room = _roomService.GetRoom(roomCode);
            if (room == null) return;

            var player = room.GetPlayer(playerId);
            if (player == null || !player.IsHost)
            {
                await Clients.Caller.SendAsync("ValidationError", "Only the host can start board setup.");
                return;
            }

            if (room.Players.Count < 2)
            {
                await Clients.Caller.SendAsync("ValidationError", "Need at least 2 players to start setup.");
                return;
            }

            room.State = GameState.SelectingNumbers;
            await Clients.Group(roomCode).SendAsync("StartGameSetup", room.ToDto());
        }

        public async Task PlayerReady(string roomCode, string playerId, List<int> numbers)
        {
            roomCode = roomCode.ToUpperInvariant();
            var room = _roomService.GetRoom(roomCode);
            if (room == null) return;

            var player = room.GetPlayer(playerId);
            if (player == null) return;

            if (numbers == null || numbers.Count != 25)
            {
                await Clients.Caller.SendAsync("ValidationError", "Invalid board numbers layout.");
                return;
            }

            player.Board.Populate(numbers);
            player.IsReady = true;

            await Clients.Group(roomCode).SendAsync("UpdateBoard", room.ToDto());

            // If all players in the room are ready, automatically start the game
            if (room.Players.Count >= 2 && room.Players.All(p => p.IsReady))
            {
                room.State = GameState.Playing;
                // Host starts the game
                var hostPlayer = room.Players.FirstOrDefault(p => p.IsHost);
                room.CurrentTurnPlayerId = hostPlayer?.PlayerId ?? room.Players[0].PlayerId;
                room.WinnerId = null;
                room.SelectedNumbers.Clear();

                await Clients.Group(roomCode).SendAsync("StartGame", room.ToDto());
            }
        }

        public async Task SubmitNumber(string roomCode, string playerId, int number)
        {
            roomCode = roomCode.ToUpperInvariant();
            var room = _roomService.GetRoom(roomCode);
            if (room == null) return;

            if (room.State != GameState.Playing)
            {
                await Clients.Caller.SendAsync("ValidationError", "Game has not started yet or is already finished.");
                return;
            }

            if (room.CurrentTurnPlayerId != playerId)
            {
                await Clients.Caller.SendAsync("ValidationError", "It's not your turn.");
                return;
            }

            if (number < 1 || number > 25)
            {
                await Clients.Caller.SendAsync("ValidationError", "Called number must be between 1 and 25.");
                return;
            }

            if (room.SelectedNumbers.Contains(number))
            {
                await Clients.Caller.SendAsync("ValidationError", "Number already called.");
                return;
            }

            // Mark the number on all boards
            room.SelectedNumbers.Add(number);
            foreach (var p in room.Players)
            {
                p.Board.MarkNumber(number);
            }

            // Send standard event containing the called number
            await Clients.Group(roomCode).SendAsync("ReceiveNumber", number);

            // Check Bingo condition (first to 5 completed lines)
            var winners = room.Players.Where(p => p.Board.GetCompletedLinesCount() >= 5).ToList();

            if (winners.Any())
            {
                room.State = GameState.Finished;
                
                // If caller is one of the winners, caller wins. Otherwise, first winner in the list wins.
                var callerWinner = winners.FirstOrDefault(w => w.PlayerId == playerId);
                if (callerWinner != null)
                {
                    room.WinnerId = callerWinner.PlayerId;
                }
                else
                {
                    room.WinnerId = winners[0].PlayerId;
                }

                await Clients.Group(roomCode).SendAsync("PlayerWon", room.ToDto());
            }
            else
            {
                // Cycle turn to next connected player
                int currentIndex = room.Players.FindIndex(p => p.PlayerId == playerId);
                int nextIndex = (currentIndex + 1) % room.Players.Count;
                int attempts = 0;
                while (!room.Players[nextIndex].IsConnected && attempts < room.Players.Count)
                {
                    nextIndex = (nextIndex + 1) % room.Players.Count;
                    attempts++;
                }

                room.CurrentTurnPlayerId = room.Players[nextIndex].PlayerId;
                await Clients.Group(roomCode).SendAsync("UpdateBoard", room.ToDto());
            }
        }

        public async Task PlayAgain(string roomCode, string playerId)
        {
            roomCode = roomCode.ToUpperInvariant();
            var room = _roomService.GetRoom(roomCode);
            if (room == null) return;

            var player = room.GetPlayer(playerId);
            if (player == null) return;

            player.PlayAgainRequested = true;

            // Update board state so other players see "Play Again Requested" status
            await Clients.Group(roomCode).SendAsync("UpdateBoard", room.ToDto());

            // If all connected players request to play again, reset room to number selection phase
            var connectedPlayers = room.Players.Where(p => p.IsConnected).ToList();
            if (connectedPlayers.Count >= 2 && connectedPlayers.All(p => p.PlayAgainRequested))
            {
                room.State = GameState.SelectingNumbers;
                room.WinnerId = null;
                room.CurrentTurnPlayerId = null;
                room.SelectedNumbers.Clear();
                
                foreach (var p in room.Players)
                {
                    p.IsReady = false;
                    p.PlayAgainRequested = false;
                    p.Board = new Board();
                }

                await Clients.Group(roomCode).SendAsync("StartGameSetup", room.ToDto());
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var (room, player) = _roomService.GetRoomAndPlayerByConnectionId(Context.ConnectionId);
            if (room != null && player != null)
            {
                string roomCode = room.RoomCode;
                string playerId = player.PlayerId;

                // Notify opponent of disconnection and start 30s timer
                await Clients.Group(roomCode).SendAsync("OpponentDisconnected", playerId);

                _roomService.RegisterDisconnect(roomCode, playerId, async () =>
                {
                    // Timer expired, player did not reconnect.
                    var activeRoom = _roomService.GetRoom(roomCode);
                    if (activeRoom != null)
                    {
                        var p = activeRoom.GetPlayer(playerId);
                        if (p != null && !p.IsConnected)
                        {
                            activeRoom.Players.Remove(p);

                            // Reassign host if disconnected player was the host
                            if (p.IsHost && activeRoom.Players.Any())
                            {
                                activeRoom.Players[0].IsHost = true;
                            }

                            // If connected players < 2, close the room
                            if (activeRoom.Players.Count(pl => pl.IsConnected) < 2)
                            {
                                _roomService.RemoveRoom(roomCode);
                                await _hubContext.Clients.Group(roomCode).SendAsync("RoomClosed");
                            }
                            else
                            {
                                await _hubContext.Clients.Group(roomCode).SendAsync("PlayerLeft", playerId);

                                // If it was their turn, advance turn
                                if (activeRoom.CurrentTurnPlayerId == playerId)
                                {
                                    int nextIndex = 0;
                                    activeRoom.CurrentTurnPlayerId = activeRoom.Players[nextIndex].PlayerId;
                                }

                                await _hubContext.Clients.Group(roomCode).SendAsync("UpdateBoard", activeRoom.ToDto());
                            }
                        }
                    }
                });
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
