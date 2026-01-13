// Denna fil gör tre viktiga saker!

// Om Books.db inte finns så skapas den
// SKapar strukturen. här bestäms tabbelen och kolumner som ska finnas med
// Lägger in startdatan. Fyller Databasen med testdatan

//Ladda in bibliotek som behövs
const sqlite3 = require("sqlite3").verbose(); //verktyget för att prata med SQLite-databaser
const path = require("path"); // hantera sökvägar till filer på ett säkert sätt

// Vart vår databasfil ska sparas
const dbPath = path.resolve(__dirname, "data", "books.db");

//Öppna eller skapa databasen. ifall inte databasen är skapad än så skapar den öpp den för oss
const db = new sqlite3.Database(dbPath);

console.log("Skapar databas på:", dbPath); // Skriver ut i terminalen var filen hamnade.

// db.serialize gör att all kod inuti { } körs i tur och ordning.
// Utan denna skulle Node.js kunna försöka lägga in data innan tabellen ens är skapad.
db.serialize(() => {
  // Rensa gammal data.
  // Om tabellen books redan finns, ta bort den helt.
  // Detta gör att vi får en helt ren och fräsch databas varje gång vi kör det här scriptet.
  db.run("DROP TABLE IF EXISTS books", (err) => {
    if (err) console.error("Fel vid DROP TABLE:", err.message);
  });

  //Skapa tabellen
  //Unikt ID som räknas upp automatiskt
  db.run(
    `
    CREATE TABLE books (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      title TEXT,
      author TEXT,
      genre TEXT,
      year INTEGER,
      pages INTEGER
    )
    `,
    (err) => {
      // Callback-funktion: När skapandet är klart (eller misslyckades)
      if (err) console.error("Fel vid CREATE TABLE:", err.message);
      else console.log("Tabellen 'books' skapad!");
    }
  );
  //Förbered för att lägga in data
  // Vi skapar en "mall" för att lägga in böcker. Frågetecknen (?) är platshållare.
  const stmt = db.prepare(
    "INSERT INTO books (title, author, genre, year, pages) VALUES (?, ?, ?, ?, ?)"
  );

  // Lägg in testdata Seeding
  // Här byter vi ut frågetecknen (?) mot riktig data och kör kommandot.
  stmt.run("Harry Potter", "J.K. Rowling", "Fantasy", 1997, 300);
  stmt.run("Sherlock Holmes", "A.C. Doyle", "Deckare", 1890, 250);
  stmt.run("Guinness Rekordbok", "Okänd", "Fakta", 2024, 600);

  // Avsluta inmatningen .finalize() säger "Jag är färdig med den här mallen (stmt), städa upp minnet".
  stmt.finalize((err) => {
    if (err) console.error("Fel vid INSERT:", err.message);
    else console.log("Testdata inlagd!");

    //// 10. Stäng kopplingen till databasen
    db.close((closeErr) => {
      if (closeErr) console.error("Fel vid db.close():", closeErr.message);
      else console.log("Databasen stängd.");
    });
  });
});
