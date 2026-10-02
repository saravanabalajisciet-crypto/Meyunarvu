"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface CommentUser {
  id: string;
  name: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  replies: Reply[];
}

interface Props {
  postId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserRole?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

const MAX_LENGTH = 2000;

function CommentForm({
  onSubmit,
  placeholder = "Write a comment…",
  submitLabel = "Post comment",
  onCancel,
}: {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) { setError("Comment cannot be empty."); return; }
    if (content.length > MAX_LENGTH) { setError(`Max ${MAX_LENGTH} characters.`); return; }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(content);
      setValue("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        placeholder={placeholder}
        rows={3}
        maxLength={MAX_LENGTH}
        className={[
          "block w-full rounded-md border bg-white px-3 py-2.5 text-sm font-sans text-stone-900",
          "placeholder-stone-300 shadow-sm resize-y min-h-[80px]",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
          error ? "border-red-400" : "border-stone-200",
        ].join(" ")}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          {error && <p className="text-xs font-sans text-red-600">{error}</p>}
          <p className="text-xs font-sans text-stone-300">{value.length}/{MAX_LENGTH}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-sans font-medium text-stone-500 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors duration-150"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || value.trim().length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-brand text-white text-xs font-sans font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {submitting && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserRole,
  isLoggedIn,
  onDeleted,
  onReplyPosted,
}: {
  comment: Comment | Reply;
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
  isLoggedIn: boolean;
  onDeleted: (id: string) => void;
  onReplyPosted?: (reply: Reply) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUserId && comment.user.id === currentUserId;
  const isAdmin = currentUserRole === "admin";

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(comment.id);
    } finally {
      setDeleting(false);
    }
  }

  async function submitReply(content: string) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, parentId: comment.id, content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to post reply");
    }
    const data = await res.json();
    onReplyPosted?.(data.comment as Reply);
    setReplyOpen(false);
  }

  return (
    <div>
      <div className="flex gap-3">
        {/* Avatar placeholder */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
          <span className="font-sans text-xs font-bold text-brand">
            {comment.user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="font-sans text-sm font-semibold text-stone-800">{comment.user.name}</span>
            <span className="font-sans text-xs text-stone-400">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="font-sans text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            {isLoggedIn && onReplyPosted && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="font-sans text-xs text-stone-400 hover:text-brand transition-colors duration-150"
              >
                {replyOpen ? "Cancel" : "Reply"}
              </button>
            )}
            {!isLoggedIn && onReplyPosted && (
              <Link href="/login" className="font-sans text-xs text-stone-400 hover:text-brand transition-colors duration-150">
                Sign in to reply
              </Link>
            )}
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-sans text-xs text-stone-300 hover:text-red-500 transition-colors duration-150 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          {/* Reply form */}
          {replyOpen && (
            <div className="mt-3">
              <CommentForm
                onSubmit={submitReply}
                placeholder={`Replying to ${comment.user.name}…`}
                submitLabel="Post reply"
                onCancel={() => setReplyOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, isLoggedIn, currentUserId, currentUserRole }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      setError("Could not load comments.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function submitComment(content: string) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to post comment");
    }
    const data = await res.json();
    setComments((prev) => [...prev, { ...data.comment, replies: [] }]);
  }

  function handleDeleted(id: string) {
    setComments((prev) => {
      // Remove top-level or from replies
      return prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) }));
    });
  }

  function handleReplyPosted(parentId: string, reply: Reply) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <section aria-label="Comments" className="mt-12 pt-10 border-t border-stone-100">
      <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-400 mb-8">
        {totalCount > 0 ? `${totalCount} Comment${totalCount !== 1 ? "s" : ""}` : "Comments"}
      </h2>

      {/* Comment form */}
      {isLoggedIn ? (
        <div className="mb-10">
          <CommentForm onSubmit={submitComment} />
        </div>
      ) : (
        <div className="mb-10 rounded-lg border border-stone-150 bg-stone-50 px-5 py-4 text-center">
          <p className="font-sans text-sm text-stone-500">
            <Link href="/login" className="text-brand hover:text-brand-dark font-medium transition-colors duration-150">
              Sign in
            </Link>{" "}
            to join the conversation.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading comments" />
        </div>
      ) : error ? (
        <p className="font-sans text-sm text-stone-400 text-center py-4">{error}</p>
      ) : comments.length === 0 ? (
        <p className="font-sans text-sm text-stone-400 text-center py-4">
          No comments yet.{isLoggedIn ? " Be the first!" : ""}
        </p>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isLoggedIn={isLoggedIn}
                onDeleted={handleDeleted}
                onReplyPosted={(reply) => handleReplyPosted(comment.id, reply)}
              />
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-11 mt-4 space-y-4 pl-4 border-l-2 border-stone-100">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      isLoggedIn={isLoggedIn}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
