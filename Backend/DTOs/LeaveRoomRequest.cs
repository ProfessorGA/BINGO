using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class LeaveRoomRequest
    {
        [Required]
        public string RoomCode { get; set; } = string.Empty;

        [Required]
        public string PlayerId { get; set; } = string.Empty;
    }
}
