import { useState } from "react";
import { Plus } from "lucide-react";

const initialForm = { idea: "", price: "", type: "elämys" };

export function GiftIdeaForm({ onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ idea: form.idea.trim(), price: Number(form.price), type: form.type });
      setForm(initialForm);
    } catch {
      setError("Lahjaidean lisääminen epäonnistui.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="gift-form" onSubmit={handleSubmit} aria-label="Lisää uusi lahjaidea">
      <h2>Lisää uusi idea</h2>
      <div className="gift-form-fields">
        <label>
          Idea
          <input
            name="idea"
            value={form.idea}
            onChange={updateField}
            required
            maxLength={100}
            placeholder="esim. Elokuvaliput"
          />
        </label>
        <label>
          Hinta (€)
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={updateField}
            required
            min="0"
            step="1"
            placeholder="0"
          />
        </label>
        <label>
          Tyyppi
          <select name="type" value={form.type} onChange={updateField}>
            <option value="elämys">Elämys</option>
            <option value="tuote">Tuote</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>
          <Plus size={18} aria-hidden="true" />
          {submitting ? "Lisätään..." : "Lisää idea"}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
