  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setA(null);

    try {
      const res = await fetch("/api/brobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setA(String(data?.answer ?? "No response."));
    } catch {
      setA("broBOT failed to respond. Try again.");
    } finally {
      setLoading(false);
    }
  }
