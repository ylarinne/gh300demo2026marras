import { useEffect, useState } from "react";
import { createGiftIdea, deleteGiftIdea, fetchGiftIdeas } from "./giftIdeasApi.js";

const loadingState = { giftIdeas: [], loading: true, error: null };

export function useGiftIdeas() {
  const [state, setState] = useState(loadingState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchGiftIdeas({ signal: controller.signal })
      .then((giftIdeas) => {
        if (!controller.signal.aborted) {
          setState({ giftIdeas, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ giftIdeas: [], loading: false, error });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState(loadingState);
    setAttempt((previous) => previous + 1);
  }

  async function addGiftIdea(input) {
    const created = await createGiftIdea(input);
    setState((previous) => ({ ...previous, giftIdeas: [...previous.giftIdeas, created] }));
    return created;
  }

  async function removeGiftIdea(id) {
    await deleteGiftIdea(id);
    setState((previous) => ({
      ...previous,
      giftIdeas: previous.giftIdeas.filter((giftIdea) => giftIdea.id !== id)
    }));
  }

  return { ...state, retry, addGiftIdea, removeGiftIdea };
}