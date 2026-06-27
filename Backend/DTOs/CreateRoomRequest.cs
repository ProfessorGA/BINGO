using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateRoomRequest
    {
        [Required]
        [StringLength(20, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 20 characters.")]
        public string HostName { get; set; } = string.Empty;
    }
}
