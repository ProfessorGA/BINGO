using System.Collections.Generic;
using System.Linq;

namespace Backend.Models
{
    public class Board
    {
        public List<Cell> Cells { get; set; } = new List<Cell>();

        public void Populate(List<int> numbers)
        {
            Cells.Clear();
            if (numbers == null || numbers.Count != 25) return;

            for (int i = 0; i < 25; i++)
            {
                int row = i / 5;
                int col = i % 5;
                Cells.Add(new Cell(numbers[i], row, col));
            }
        }

        public bool MarkNumber(int number)
        {
            var cell = Cells.FirstOrDefault(c => c.Number == number);
            if (cell != null)
            {
                cell.IsMarked = true;
                return true;
            }
            return false;
        }

        public int GetCompletedLinesCount()
        {
            if (Cells.Count != 25) return 0;

            int completed = 0;

            // 1. Check Rows (0 to 4)
            for (int row = 0; row < 5; row++)
            {
                if (Cells.Where(cell => cell.Row == row).All(cell => cell.IsMarked))
                {
                    completed++;
                }
            }

            // 2. Check Cols (0 to 4)
            for (int col = 0; col < 5; col++)
            {
                if (Cells.Where(cell => cell.Col == col).All(cell => cell.IsMarked))
                {
                    completed++;
                }
            }

            // 3. Check Main Diagonal (row == col)
            if (Cells.Where(cell => cell.Row == cell.Col).All(cell => cell.IsMarked))
            {
                completed++;
            }

            // 4. Check Anti-Diagonal (row + col == 4)
            if (Cells.Where(cell => cell.Row + cell.Col == 4).All(cell => cell.IsMarked))
            {
                completed++;
            }

            return completed;
        }
    }
}
