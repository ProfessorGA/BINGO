using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class JoinRoomRequest
    {
        [Required]
        [RegularExpression(@"^[a-zA-Z0-9]{4}$", ErrorMessage = "Room Code must be exactly 4 alphanumeric characters.")]
        public string RoomCode { get; set; } = string.Empty;

        [Required]
        [StringLength(20, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 20 characters.")]
        public string PlayerName { get; set; } = string.Empty;
    }
}
