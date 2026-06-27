using System.Collections.Generic;
using Backend.Models;

namespace Backend.DTOs
{
    public class CellResponseDto
    {
        public int Number { get; set; }
        public bool IsMarked { get; set; }
        public int Row { get; set; }
        public int Col { get; set; }
    }

    public class BoardResponseDto
    {
        public List<CellResponseDto> Cells { get; set; } = new();
        public int CompletedLinesCount { get; set; }
    }

    public class PlayerResponseDto
    {
        public string PlayerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsHost { get; set; }
        public bool IsReady { get; set; }
        public BoardResponseDto Board { get; set; } = new();
        public bool IsConnected { get; set; }
        public bool PlayAgainRequested { get; set; }
    }

    public class RoomResponseDto
    {
        public string RoomCode { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public List<int> SelectedNumbers { get; set; } = new();
        public string? WinnerId { get; set; }
        public string? CurrentTurnPlayerId { get; set; }
        public List<PlayerResponseDto> Players { get; set; } = new();
    }
}
