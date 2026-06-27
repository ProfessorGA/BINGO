namespace Backend.Models
{
    public enum GameState
    {
        Waiting,          // Waiting for second player to join
        SelectingNumbers, // Both players joined, arranging their boards
        Playing,          // Active game, calling numbers
        Finished          // Game over, winner decided
    }
}
