using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Services.Memory
{
    public class RoomService
    {
        private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
        private readonly ConcurrentDictionary<string, CancellationTokenSource> _disconnectTimers = new();

        public GameRoom? CreateRoom(string hostName, out string playerId)
        {
            playerId = Guid.NewGuid().ToString("N");
            string roomCode = GenerateRoomCode();

            var room = new GameRoom(roomCode)
            {
                State = GameState.Waiting
            };
            var host = new Player(playerId, hostName, isHost: true);
            room.Players.Add(host);

            if (_rooms.TryAdd(roomCode, room))
            {
                return room;
            }

            return null;
        }

        public GameRoom? JoinRoom(string roomCode, string playerName, out string playerId, out string? errorMessage)
        {
            playerId = string.Empty;
            errorMessage = null;

            roomCode = roomCode.ToUpperInvariant();
            if (!_rooms.TryGetValue(roomCode, out var room))
            {
                errorMessage = "Room code does not exist.";
                return null;
            }

            if (room.State != GameState.Waiting)
            {
                errorMessage = "Game has already started setup or is active.";
                return null;
            }

            if (room.Players.Count >= 5)
            {
                errorMessage = "Room is full (max 5 players).";
                return null;
            }

            playerId = Guid.NewGuid().ToString("N");
            var player = new Player(playerId, playerName, isHost: false);
            room.Players.Add(player);

            return room;
        }

        public GameRoom? GetRoom(string roomCode)
        {
            roomCode = roomCode.ToUpperInvariant();
            _rooms.TryGetValue(roomCode, out var room);
            return room;
        }

        public bool RemoveRoom(string roomCode)
        {
            roomCode = roomCode.ToUpperInvariant();
            
            // Cancel any pending disconnect timers for this room
            var timerKeys = _disconnectTimers.Keys.Where(k => k.StartsWith(roomCode + "_")).ToList();
            foreach (var key in timerKeys)
            {
                if (_disconnectTimers.TryRemove(key, out var cts))
                {
                    cts.Cancel();
                    cts.Dispose();
                }
            }

            return _rooms.TryRemove(roomCode, out _);
        }

        public void RegisterDisconnect(string roomCode, string playerId, Func<Task> onTimeout)
        {
            roomCode = roomCode.ToUpperInvariant();
            if (!_rooms.TryGetValue(roomCode, out var room)) return;

            var player = room.GetPlayer(playerId);
            if (player == null) return;

            player.IsConnected = false;
            player.LastSeenDisconnect = DateTime.UtcNow;

            string timerKey = $"{roomCode}_{playerId}";

            // Cancel any existing timer just in case
            if (_disconnectTimers.TryRemove(timerKey, out var existingCts))
            {
                existingCts.Cancel();
                existingCts.Dispose();
            }

            var cts = new CancellationTokenSource();
            _disconnectTimers[timerKey] = cts;

            // Run a background task to wait 30 seconds
            Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), cts.Token);
                    
                    // Check if player is still disconnected
                    if (!player.IsConnected)
                    {
                        // Clean up room and trigger callback
                        await onTimeout();
                    }
                }
                catch (TaskCanceledException)
                {
                    // Player reconnected, ignore
                }
                finally
                {
                    _disconnectTimers.TryRemove(timerKey, out _);
                }
            });
        }

        public bool CancelDisconnect(string roomCode, string playerId)
        {
            roomCode = roomCode.ToUpperInvariant();
            string timerKey = $"{roomCode}_{playerId}";

            if (_rooms.TryGetValue(roomCode, out var room))
            {
                var player = room.GetPlayer(playerId);
                if (player != null)
                {
                    player.IsConnected = true;
                    player.LastSeenDisconnect = null;
                }
            }

            if (_disconnectTimers.TryRemove(timerKey, out var cts))
            {
                cts.Cancel();
                cts.Dispose();
                return true;
            }

            return false;
        }

        public (GameRoom? Room, Player? Player) GetRoomAndPlayerByConnectionId(string connectionId)
        {
            foreach (var room in _rooms.Values)
            {
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null) return (room, player);
            }
            return (null, null);
        }

        private string GenerateRoomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            string code;
            do
            {
                code = new string(Enumerable.Repeat(chars, 4)
                    .Select(s => s[random.Next(s.Length)]).ToArray());
            } while (_rooms.ContainsKey(code));

            return code;
        }
    }
}
