import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../../App.jsx";

const giftIdeas = [
  { id: 1, idea: "Ravintolaillallinen", price: 80, type: "el\u00e4mys" },
  { id: 2, idea: "Saunavuoro", price: 30, type: "el\u00e4mys" },
  { id: 3, idea: "Konserttiliput", price: 65, type: "el\u00e4mys" },
  { id: 4, idea: "Kahvimuki", price: 15, type: "tuote" },
  { id: 5, idea: "Kirja", price: 25, type: "tuote" },
  { id: 6, idea: "Villapaita", price: 60, type: "tuote" }
];
const jsonResponse = (data) => ({ ok: true, json: async () => data });

describe("gift ideas screen", () => {
  it("loads all gift names, EUR prices and types from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(giftIdeas));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent("Ladataan");
    expect(await screen.findByText("Ravintolaillallinen")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    for (const giftIdea of giftIdeas) {
      expect(screen.getByText(giftIdea.idea)).toBeVisible();
      expect(screen.getByText(`${giftIdea.price} \u20ac`)).toBeVisible();
    }
    const list = screen.getByRole("list", { name: "Lahjaideat" });
    expect(within(list).getAllByText("El\u00e4mys")).toHaveLength(3);
    expect(within(list).getAllByText("Tuote")).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith("/api/gift-ideas", { signal: expect.any(AbortSignal) });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])));
    render(<App />);
    expect(await screen.findByText("Ei lahjaideoita saatavilla.")).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it.each(["http", "network"])("recovers from a %s error on retry", async (failure) => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    if (failure === "http") fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    else fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(jsonResponse(giftIdeas));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Lahjaideoita ei voitu ladata.");
    await user.click(screen.getByRole("button", { name: "Yrit\u00e4 uudelleen" }));
    expect(await screen.findByText("Kirja")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aborts the request on unmount", () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<App />);
    const signal = fetchMock.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("ignores stale results from the StrictMode cleanup request", async () => {
    let resolveStale;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveStale = resolve; }))
      .mockResolvedValueOnce(jsonResponse(giftIdeas));
    vi.stubGlobal("fetch", fetchMock);
    render(<StrictMode><App /></StrictMode>);
    expect(await screen.findByText("Kirja")).toBeVisible();
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => resolveStale(jsonResponse([])));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(6));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("creates a new gift idea through the form", async () => {
    const user = userEvent.setup();
    const created = { id: 7, idea: "Elokuvaliput", price: 24, type: "el\u00e4mys" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(giftIdeas))
      .mockResolvedValueOnce(jsonResponse(created));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("Kirja");
    await user.type(screen.getByLabelText("Idea"), "Elokuvaliput");
    await user.type(screen.getByLabelText("Hinta (\u20ac)"), "24");
    await user.selectOptions(screen.getByLabelText("Tyyppi"), "el\u00e4mys");
    await user.click(screen.getByRole("button", { name: "Lis\u00e4\u00e4 idea" }));
    expect(await screen.findByText("Elokuvaliput")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(fetchMock).toHaveBeenCalledWith("/api/gift-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: "Elokuvaliput", price: 24, type: "el\u00e4mys" })
    });
    expect(screen.getByLabelText("Idea")).toHaveValue("");
  });

  it("shows an error when creating a gift idea fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(giftIdeas))
      .mockResolvedValueOnce({ ok: false, status: 400 });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("Kirja");
    await user.type(screen.getByLabelText("Idea"), "Elokuvaliput");
    await user.type(screen.getByLabelText("Hinta (\u20ac)"), "24");
    await user.click(screen.getByRole("button", { name: "Lis\u00e4\u00e4 idea" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Lahjaidean lis\u00e4\u00e4minen ep\u00e4onnistui.");
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("deletes a gift idea", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(giftIdeas))
      .mockResolvedValueOnce({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("Kirja");
    await user.click(screen.getByRole("button", { name: "Poista Kirja" }));
    await waitFor(() => expect(screen.queryByText("Kirja")).not.toBeInTheDocument());
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledWith("/api/gift-ideas/5", { method: "DELETE" });
  });

  it("shows an error when deleting a gift idea fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(giftIdeas))
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("Kirja");
    await user.click(screen.getByRole("button", { name: "Poista Kirja" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Lahjaidean poistaminen ep\u00e4onnistui.");
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });
});