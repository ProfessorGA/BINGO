using System.Linq;
using Backend.Models;

namespace Backend.DTOs
{
    public static class DtoExtensions
    {
        public static RoomResponseDto ToDto(this GameRoom room)
        {
            return new RoomResponseDto
            {
                RoomCode = room.RoomCode,
                State = room.State.ToString(),
                SelectedNumbers = room.SelectedNumbers,
                WinnerId = room.WinnerId,
                CurrentTurnPlayerId = room.CurrentTurnPlayerId,
                Players = room.Players.Select(p => p.ToDto()).ToList(),
                ChatMessages = room.ChatMessages.Select(m => new ChatMessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.SenderName,
                    Text = m.Text,
                    TimestampIso = m.Timestamp.ToString("o"),
                    SeenBy = m.SeenBy.ToList()
                }).ToList()
            };
        }

        public static PlayerResponseDto ToDto(this Player player)
        {
            return new PlayerResponseDto
            {
                PlayerId = player.PlayerId,
                Name = player.Name,
                IsHost = player.IsHost,
                IsReady = player.IsReady,
                Board = player.Board.ToDto(),
                IsConnected = player.IsConnected,
                PlayAgainRequested = player.PlayAgainRequested,
                NumbersPlaced = player.NumbersPlaced,
                IsIdle = player.IsConnected && (System.DateTime.UtcNow - player.LastActive).TotalSeconds > 60
            };
        }

        public static BoardResponseDto ToDto(this Board board)
        {
            return new BoardResponseDto
            {
                Cells = board.Cells.Select(c => c.ToDto()).ToList(),
                CompletedLinesCount = board.GetCompletedLinesCount()
            };
        }

        public static CellResponseDto ToDto(this Cell cell)
        {
            return new CellResponseDto
            {
                Number = cell.Number,
                IsMarked = cell.IsMarked,
                Row = cell.Row,
                Col = cell.Col
            };
        }
    }
}
