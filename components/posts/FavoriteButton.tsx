"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  postId: string;
  isLoggedIn: boolean;
  initialFavorited?: boolean; // server can pre-fetch and pass this
}

export default function FavoriteButton({ postId, isLoggedIn, initialFavorited = false }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(!!initialFavorited);
  const router = useRouter();

  // If not pre-fetched, check on mount for logged-in users
  useEffect(() => {
    if (!isLoggedIn || checked) return;
    fetch(`/api/favorites/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        setFavorited(!!data.isFavorited);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [postId, isLoggedIn, checked]);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (favorited) {
        await fetch(`/api/favorites/${postId}`, { method: "DELETE" });
        setFavorited(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        setFavorited(true);
      }
    } catch {
      // silent — state will be inconsistent but won't crash
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className={[
        "share-btn gap-1.5 select-none",
        favorited
          ? "border-brand text-brand bg-brand-light"
          : "text-stone-500 hover:border-brand hover:text-brand hover:bg-brand-light",
        loading ? "opacity-60 cursor-wait" : "",
      ].join(" ")}
    >
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill={favorited ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}
