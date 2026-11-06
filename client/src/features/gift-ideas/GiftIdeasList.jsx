import { BookOpen, Coffee, Flame, Gift, Music, Shirt, Trash2, Utensils } from "lucide-react";

const priceFormat = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const icons = { 1: Utensils, 2: Flame, 3: Music, 4: Coffee, 5: BookOpen, 6: Shirt };

export function GiftIdeasList({ giftIdeas, onDelete }) {
  return (
    <ul className="gift-grid" aria-label="Lahjaideat">
      {giftIdeas.map((giftIdea) => {
        const Icon = icons[giftIdea.id] ?? Gift;
        const experience = giftIdea.type === "el\u00e4mys";
        return (
          <li key={giftIdea.id} className={`gift-item ${experience ? "experience" : "product"}`}>
            <Icon className="gift-icon" size={32} strokeWidth={1.5} aria-hidden="true" />
            <span className="gift-type">{experience ? "El\u00e4mys" : "Tuote"}</span>
            <h2>{giftIdea.idea}</h2>
            <p className="gift-price">{priceFormat.format(giftIdea.price)}</p>
            {onDelete && (
              <button
                type="button"
                className="gift-delete"
                aria-label={`Poista ${giftIdea.idea}`}
                title={`Poista ${giftIdea.idea}`}
                onClick={() => onDelete(giftIdea.id)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}