
(async function () {
  const container = document.getElementById("home-updates");
  if (!container) return;

  try {
    const client = window.supabase.createClient(
      window.BLIZZY_SUPABASE_URL,
      window.BLIZZY_SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await client
      .from("blizzy_updates")
      .select("id, title, description, image_path, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    const bucket = "blizzy-updates";
    container.replaceChildren();

    data.forEach(function (item) {
      const imageUrl = client.storage
        .from(bucket)
        .getPublicUrl(item.image_path).data.publicUrl;

      const card = document.createElement("article");
      const image = document.createElement("img");
      const title = document.createElement("h3");
      const description = document.createElement("p");

      image.src = imageUrl;
      image.alt = item.title;
      image.loading = "lazy";
      title.textContent = item.title;
      description.textContent = item.description;

      card.append(image, title, description);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Could not load homepage updates:", error);
  }
})();

