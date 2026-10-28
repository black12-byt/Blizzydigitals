
(function () {
  const client = window.supabase.createClient(
    window.BLIZZY_SUPABASE_URL,
    window.BLIZZY_SUPABASE_PUBLISHABLE_KEY
  );

  const message = document.getElementById("updates-message");
  const list = document.getElementById("updates-list");

  function showMessage(text) {
    message.textContent = text;
  }

  async function loadUpdates() {
    showMessage("Loading updates...");

    const { data, error } = await client
      .from("blizzy_updates")
      .select("id, title, description, image_path, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("Updates could not be loaded. Please try again later.");
      return;
    }

    list.replaceChildren();

    if (!data || data.length === 0) {
      showMessage("There are no updates published yet. Please check back soon.");
      return;
    }

    showMessage("");

    data.forEach(function (update) {
      const card = document.createElement("article");
      card.className = "update-card";

      const image = document.createElement("img");
      const imageResult = client.storage
        .from("blizzy-updates")
        .getPublicUrl(update.image_path);

      image.src = imageResult.data.publicUrl;
      image.alt = update.title;
      image.loading = "lazy";

      const content = document.createElement("div");
      content.className = "update-card-content";

      const title = document.createElement("h2");
      title.textContent = update.title;

      const description = document.createElement("p");
      description.textContent = update.description;

      const date = document.createElement("p");
      date.className = "update-date";
      date.textContent = new Date(update.created_at).toLocaleDateString();

      content.append(title, description, date);
      card.append(image, content);
      list.appendChild(card);
    });
  }

  loadUpdates();
})();

