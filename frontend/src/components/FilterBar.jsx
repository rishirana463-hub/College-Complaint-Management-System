import { Search, SlidersHorizontal } from "lucide-react";
import { categories } from "../lib/navigation";
export default function FilterBar({ filters, onChange, isFaculty }) {
  return (
    <div className="filter-bar">
      <div className="search-input">
        <Search size={17} />
        <input
          aria-label="Search tickets"
          maxLength={200}
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
        />
      </div>
      <SlidersHorizontal size={17} className="filter-icon" />
      {!isFaculty && (
        <select
          className="input filter-select"
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => onChange("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      )}
      <select
        className="input filter-select"
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => onChange("priority", e.target.value)}
      >
        <option value="">All priorities</option>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
    </div>
  );
}
