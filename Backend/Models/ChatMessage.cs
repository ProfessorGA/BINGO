using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class ChatMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string SenderId { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<string> SeenBy { get; set; } = new List<string>();
    }
}
