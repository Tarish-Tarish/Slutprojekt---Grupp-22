// script.js

// variabel för adressen till servern (API-endpoint)
const URL = "http://localhost:3000/books";

// Variabler för användarens input
const bookForm = document.getElementById("bookForm");
const bookIdInput = document.getElementById("bookId");
const authorInput = document.getElementById("author");
const titleInput = document.getElementById("title");
const genreInput = document.getElementById("genre");
const yearInput = document.getElementById("year");
const pagesInput = document.getElementById("pages");

//  -- visar popup-rutan vid DELETE, PUT, POST, EDIT
function showMessage(text, type = "success") {
  const box = document.getElementById("messageBox");
  if (!box) return;

  box.textContent = text;

  // tar bort gamla färger och gör rutan synlig
  box.classList.remove(
    "d-none",
    "alert-success",
    "alert-danger",
    "alert-warning",
    "alert-info"
  );
  // sätter bakgrundsfärg på meddelanderutan (Grönt för rätt och rött för fel)
  box.classList.add("alert", `alert-${type}`);

  // Timer för hur länge popup-rutan ska visas (3 sekunder)
  clearTimeout(window.__msgTimer);
  window.__msgTimer = setTimeout(() => box.classList.add("d-none"), 3000);
}

// -- Fetch: hämtar alla böcker
async function fetchBooks() {
  try {
    const response = await fetch(URL);
    if (!response.ok) {
      showMessage("Kunde inte hämta böcker från servern.", "danger");
      return;
    }

    const books = await response.json();
    renderBooks(books);
  } catch (err) {
    console.error("Fetch error (GET /books):", err);
    showMessage("Nätverksfel vid hämtning av böcker.", "danger");
  }
}

// funktion för att koppla färg på ramen till bokgenre
function getGenreClass(genre) {
  if (!genre) return "border-secondary";

  switch (genre.toLowerCase()) {
    case "fantasy":
      return "border-primary";
    case "deckare":
      return "border-danger";
    case "fakta":
      return "border-success";
    default:
      return "border-secondary";
  }
}

//  Renderar hela listan av alla böcker
function renderBooks(books) {
  const list = document.getElementById("bookList"); // hitta behållaren i HTML där vi ska lägga in böckerna
  if (!list) return; // om listan  (behållaren) inte hittas, return (gå tillbaka)

  // tömmer listan för att inte skapa dubletter
  list.innerHTML = "";

  // forEach-loop för att skapa listan dynamiskt med aktuella böcker som finns
  books.forEach((book) => {
    const div = document.createElement("div");
    const genreClass = getGenreClass(book.genre);

    div.className = `card mb-3 glass-card ${genreClass}`;

    div.innerHTML = `
      <div class="card-body">
        <h4 class="card-title">${book.title ?? ""}</h4>
        <p><strong>Författare:</strong> ${book.author ?? ""}</p>
        <p><strong>Genre:</strong> ${book.genre ?? ""}</p>
        <p><strong>År:</strong> ${book.year ?? ""}</p>
        <p><strong>Sidor:</strong> ${book.pages ?? ""}</p>

        <button type="button" class="btn btn-primary btn-sm me-2" onclick="onEditClick(${
          book.id
        })">
          Ändra
        </button>
        <button type="button" class="btn btn-danger btn-sm" onclick="onDeleteClick(${
          book.id
        })">
          Ta bort
        </button>
      </div>
    `;

    list.appendChild(div);
  });
}

// Create och Update

// eventlyssnare som förhindrar sidan från att ladda om vid POST och PUT
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // validering för kontroll att alla input-fält är ifylda och i korrekt format
  if (!bookForm.checkValidity()) {
    bookForm.classList.add("was-validated");
    showMessage("Fyll i alla fält korrekt.", "warning");
    return;
  }
  bookForm.classList.remove("was-validated");

  // skapar upp ett bokobjekt med tillhörande attributes
  const book = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    genre: genreInput.value,
    year: Number(yearInput.value),
    pages: Number(pagesInput.value),
  };

  // variabel för att spara bokens id
  const id = bookIdInput.value;

  try {
    //if-sats för att kontrollera om boken redan är befintlig (har ett id)
    if (!id) {
      // CREATE (POST)- om id:t inte finns = ny bok skapas och tilldelas ett nytt id
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // JSON-format
        body: JSON.stringify(book), // konverterar till en textsträng för överföring till server.js (Backend)
      });

      // väntar på nedladdning och omvandlar JSON-text till ett JS-objekt
      // Läs svar som text först (så vi inte kraschar om servern inte skickar JSON)
          const text = await response.text();
let data = {};
try { data = text ? JSON.parse(text) : {}; } catch {}

if (!response.ok) {
  showMessage(data.error || data.message || "Fel vid skapande av bok.", "danger");
  return;
}


      showMessage(data.message); // meddelande vid lyckat försök att lägga till ny bok
      bookForm.reset(); // återställer alla textrutor
      bookIdInput.value = ""; // Nollställning av id, för att återgå till att skapa nya böcker
      await fetchBooks(); // körs vid sidladdning för att hämta och visa alla böcker
      return;
    }

    // UPDATE (PUT) - id i body (enligt er backend)
    book.id = Number(id);

    const response = await fetch(`${URL}/${id}`, {
         method: "PUT",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify(book),
         });
    // väntar på nedladdning och omvandlar JSON-text till ett JS-objekt
    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Fel vid uppdatering av bok.", "danger"); // felhantering och meddelande om servern inte svarar, vid försök att uppdatera befintlig bok
      return;
    }

    showMessage(data.message); // meddelande vid lyckat försök att uppdatera befintlig bok
    bookForm.reset(); // återställer alla textrutor
    bookIdInput.value = ""; // Nollställning av id, för att återgå till att skapa nya böcker
    await fetchBooks(); // körs vid sidladdning för att hämta och visa alla böcker
  } catch (err) {
    // felemeddelande om servern ligger nere
    console.error("Submit error (POST/PUT):", err);
    showMessage("Nätverksfel vid spara/uppdatera.", "danger");
  }
});

// -- DELETE (Ta bort bok) --
async function onDeleteClick(id) {
  if (!confirm("Bekräfta att du vill ta bort boken")) return; // kontrollfråga till användaren om den vill ta bort boken, om inte: gå tillbaka (return)

  try {
    // identisk kodstruktur för API-anrop och felhantering som PUT och POST

    // servern anropas för att ta bort boken med angivet ID
    const response = await fetch(`${URL}/${id}`, {
      method: "DELETE", // Metodanropp till servern
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Fel vid borttagning.", "danger");
      return;
    }

    showMessage(data.message);
    bookForm.reset();
    bookIdInput.value = "";
    await fetchBooks();
  } catch (err) {
    console.error("Delete error (DELETE /books/:id):", err);
    showMessage("Nätverksfel vid borttagning.", "danger");
  }
}

//  Funktion för att kunna ändra bok (EDIT )
async function onEditClick(id) {
  try {
    // Anropar servern för att hämta bok med matchande ID som vi vill göra ändringar i
    const response = await fetch(`${URL}/${id}`);
    const book = await response.json();

    // felhantering om servern med fel ( t.ex error 404 eller 500)
    if (!response.ok) {
      showMessage(book.error || "Kunde inte hämta boken.", "danger");
      return;
    }

    // fyller i bokens data i input-fälten så användaren kan göra ändringar i vald bok
    bookIdInput.value = book.id;
    titleInput.value = book.title ?? "";
    authorInput.value = book.author ?? "";
    genreInput.value = book.genre ?? "";
    yearInput.value = book.year ?? "";
    pagesInput.value = book.pages ?? "";

    showMessage("Redigeringsläge: ändra och tryck Spara.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Edit error (GET /books/:id):", err);
    showMessage("Nätverksfel vid hämtning av bok.", "danger");
  }
}

// Gör funktionerna tillgängliga för onclick i HTML
window.onDeleteClick = onDeleteClick;
window.onEditClick = onEditClick;

// hämtar och visar alla böcker direkt när sidan laddas
fetchBooks();
