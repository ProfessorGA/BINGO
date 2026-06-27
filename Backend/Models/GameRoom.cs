using System;
using System.Collections.Generic;
using System.Linq;

namespace Backend.Models
{
    public class GameRoom
    {
        public string RoomCode { get; set; } = string.Empty;
        public List<Player> Players { get; set; } = new List<Player>();
        public Player? Host => Players.FirstOrDefault(p => p.IsHost);
        public GameState State { get; set; } = GameState.Waiting;
        public List<int> SelectedNumbers { get; set; } = new List<int>();
        public string? WinnerId { get; set; }
        public string? CurrentTurnPlayerId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

        public GameRoom() { }

        public GameRoom(string roomCode)
        {
            RoomCode = roomCode;
            State = GameState.Waiting;
        }

        public Player? GetPlayer(string playerId)
        {
            return Players.FirstOrDefault(p => p.PlayerId == playerId);
        }
    }
}
