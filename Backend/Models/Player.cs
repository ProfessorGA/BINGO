using System;

namespace Backend.Models
{
    public class Player
    {
        public string PlayerId { get; set; } = string.Empty;
        public string? ConnectionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsHost { get; set; }
        public bool IsReady { get; set; }
        public Board Board { get; set; } = new Board();
        public bool IsConnected { get; set; } = true;
        public bool PlayAgainRequested { get; set; } = false;
        public DateTime? LastSeenDisconnect { get; set; }

        public Player() { }

        public Player(string playerId, string name, bool isHost)
        {
            PlayerId = playerId;
            Name = name;
            IsHost = isHost;
            IsConnected = true;
            IsReady = false;
        }
    }
}
