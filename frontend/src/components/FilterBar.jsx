const FilterBar = ({ filters, onChange, showPriority }) => {
  return (
    <div className="card grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <input
        className="input"
        placeholder="Search title or description"
        value={filters.search}
        onChange={(e) => onChange("search", e.target.value)}
      />
      <select className="input" value={filters.category} onChange={(e) => onChange("category", e.target.value)}>
        <option value="">All Categories</option>
        <option value="Hostel">Hostel</option>
        <option value="IT">IT</option>
        <option value="Faculty">Faculty</option>
        <option value="Infrastructure">Infrastructure</option>
        <option value="Library">Library</option>
        <option value="Canteen">Canteen</option>
        <option value="Campus">Campus</option>
        <option value="Other">Other</option>
      </select>
      <select className="input" value={filters.status} onChange={(e) => onChange("status", e.target.value)}>
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>
      {showPriority ? (
        <select className="input" value={filters.priority} onChange={(e) => onChange("priority", e.target.value)}>
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      ) : (
        <div className="hidden xl:block" />
      )}
    </div>
  );
};

export default FilterBar;
