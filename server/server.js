
//Vi importerar express paketet, cors och sqlite3 paketen. 
//Vi importerar även path för att hantera fil och sökvägar.
//Vi sätter även serverns port till 3000.
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 3000;


//Här skickar frontend request sedan pratar API:t med SQL och sen skickar API:t JSON till frontend.
app.use(cors());
app.use(express.json());

//sökväg till databasen 
const dbPath = path.join(__dirname, "data", "books.db");

// Koppling till SQLite databas
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Databas anslutningsfel:", err.message);
  } else {
    console.log("Ansluten till SQLite databas");
  }
});



//Detta är metoden GET som hämtar alla böckerna från databasen books.db
app.get("/books", (req, res) => {
  db.all("SELECT * FROM books", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//Detta är metoden som hämtar ut EN bok (med hjälp av ID) från databasen
app.get("/books/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Boken hittades inte" });
    }
    res.json(row);
  });
});

//Detta är metoden POST som används för att lägga till en bok i databasen.
app.post("/books", (req, res) => {
  const { title, author, genre, year, pages } = req.body;

  const sql = `
    INSERT INTO books (title, author, genre, year, pages)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [title, author, genre, year, pages], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: "Bok skapad",
      id: this.lastID,
    });
  });
});

//Detta är metoden PUT som används för att uppdatera en vald bok i databasen.
app.put("/books/:id", (req, res) => {
  const id = req.params.id;
  const { title, author, genre, year, pages } = req.body;


  //Uppdaterar befintlig bok baserat på ID (WHERE).
  //Fälten som kan uppdateras är titel, författare, genre, år och antal sidor.
  const sql = `
    UPDATE books
    SET title = ?, author = ?, genre = ?, year = ?, pages = ?
    WHERE id = ?
  `;

  db.run(sql, [title, author, genre, year, pages, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Boken hittades inte" });
    }

    res.json({
      message: "Bok uppdaterad",
      updatedRows: this.changes,
    });
  });
});


//Detta är metoden DELETE som i sin tur används för att ta bort en bok från databasen.
app.delete("/books/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM books WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Boken hittades inte" });
    }

    res.json({
      message: "Bok borttagen",
      deletedRows: this.changes,
    });
  });
});




//Startar servern med vår valda port som vi skapade längst upp som är PORT = 3000.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
