import { useState } from "react";
import { Gift, RefreshCw } from "lucide-react";
import { GiftIdeaForm } from "./features/gift-ideas/GiftIdeaForm.jsx";
import { GiftIdeasList } from "./features/gift-ideas/GiftIdeasList.jsx";
import { useGiftIdeas } from "./features/gift-ideas/useGiftIdeas.js";

export default function App() {
  const { giftIdeas, loading, error, retry, addGiftIdea, removeGiftIdea } = useGiftIdeas();
  const [deleteError, setDeleteError] = useState(null);

  async function handleDelete(id) {
    setDeleteError(null);
    try {
      await removeGiftIdea(id);
    } catch {
      setDeleteError("Lahjaidean poistaminen ep\u00e4onnistui.");
    }
  }

  return (
    <>
      <header className="masthead">
        <div className="page-width brand"><Gift size={24} aria-hidden="true" /><span>Lahjaideat</span></div>
      </header>
      <main className="page-width">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Pieni ajatus, suuri ilo</p>
            <h1 id="page-title">Lahjaideat</h1>
          </div>
          <img className="gift-photo" src="/gift-wrap.jpg" alt="" width="192" height="128" />
        </section>
        <section aria-label="Lahjavalikoima" aria-busy={loading}>
          <div className="list-heading">
            <h2>Kaikki ideat</h2>
            {!loading && !error && <span>{giftIdeas.length} ideaa</span>}
          </div>
          {loading && <p className="state-message" role="status">Ladataan lahjaideoita...</p>}
          {error && (
            <div className="error-state">
              <p role="alert">Lahjaideoita ei voitu ladata.</p>
              <button onClick={retry}><RefreshCw size={18} aria-hidden="true" />Yrit&auml; uudelleen</button>
            </div>
          )}
          {!loading && !error && giftIdeas.length === 0 && (
            <p className="state-message" role="status">Ei lahjaideoita saatavilla.</p>
          )}
          {!loading && !error && deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          {!loading && !error && giftIdeas.length > 0 && (
            <GiftIdeasList giftIdeas={giftIdeas} onDelete={handleDelete} />
          )}
        </section>
        {!loading && !error && <GiftIdeaForm onCreate={addGiftIdea} />}
      </main>
      <footer className="page-width">Ajatuksella valittu.</footer>
    </>
  );
}