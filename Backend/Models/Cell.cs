namespace Backend.Models
{
    public class Cell
    {
        public int Number { get; set; }
        public bool IsMarked { get; set; }
        public int Row { get; set; }
        public int Col { get; set; }

        public Cell() { }

        public Cell(int number, int row, int col)
        {
            Number = number;
            Row = row;
            Col = col;
            IsMarked = false;
        }
    }
}
