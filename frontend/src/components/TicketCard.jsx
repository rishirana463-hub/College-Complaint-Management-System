import { useAuth } from "../context/AuthContext";
import StatusBadge from "./StatusBadge";

const FACULTY_PRIVATE_BADGE = "bg-rose-50 text-rose-700 border border-rose-200";
const PUBLIC_BADGE = "bg-sky-50 text-sky-700 border border-sky-200";

const TicketCard = ({ ticket, isAdmin, onStatusChange, onPriorityChange, onAddComment }) => {
  const { auth } = useAuth();
  const role = auth.user?.role;
  const isFaculty = role === "faculty";
  const isFacultyTicket = ticket.category === "Faculty";

  // Faculty and admin can change status/priority for faculty tickets
  // Admin can change all tickets
  const canManage = isAdmin || (isFaculty && isFacultyTicket);

  return (
    <article className="card space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={ticket.status} />
            <StatusBadge value={ticket.priority} type="priority" />
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {ticket.category}
            </span>
            {/* Visibility badge */}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFacultyTicket ? FACULTY_PRIVATE_BADGE : PUBLIC_BADGE}`}>
              {isFacultyTicket ? "🔒 Private" : "🌐 General"}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">{ticket.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{ticket.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Raised by <strong className="text-slate-700">{ticket.userId?.name}</strong> • {new Date(ticket.createdAt).toLocaleString()}</span>
            {isFacultyTicket && ticket.assignedFaculty && (
              <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                <span>👤 Assigned to: {ticket.assignedFaculty.name}</span>
              </span>
            )}
          </div>
        </div>

        {canManage && (
          <div className="grid min-w-[220px] gap-3">
            <select className="input" value={ticket.status} onChange={(e) => onStatusChange(ticket._id, e.target.value)}>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <select className="input" value={ticket.priority} onChange={(e) => onPriorityChange(ticket._id, e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        )}
      </div>

      <section className="rounded-3xl bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-800">Conversation</h4>
        <div className="mt-4 space-y-3">
          {ticket.comments?.length ? (
            ticket.comments.map((comment, index) => (
              <div key={`${ticket._id}-${index}`} className={`rounded-2xl p-3 ${comment.authorRole === "faculty" ? "bg-rose-50 border border-rose-100" : "bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {comment.authorName}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium capitalize
                      ${comment.authorRole === "admin" ? "bg-brand-100 text-brand-800" :
                        comment.authorRole === "faculty" ? "bg-rose-100 text-rose-800" :
                        "bg-slate-100 text-slate-600"}`}>
                      {comment.authorRole}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{comment.message}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>
        <CommentBox onSubmit={(message) => onAddComment(ticket._id, message)} />
      </section>
    </article>
  );
};

const CommentBox = ({ onSubmit }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message");
    if (!message?.trim()) {
      return;
    }
    onSubmit(message);
    event.currentTarget.reset();
  };

  return (
    <form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
      <input className="input flex-1" name="message" placeholder="Write a comment or reply..." />
      <button className="btn-primary md:w-auto" type="submit">
        Add Comment
      </button>
    </form>
  );
};

export default TicketCard;
