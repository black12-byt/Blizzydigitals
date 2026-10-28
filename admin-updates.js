
(function () {
  const client = window.supabase.createClient(
    window.BLIZZY_SUPABASE_URL,
    window.BLIZZY_SUPABASE_PUBLISHABLE_KEY
  );

  const loginForm = document.getElementById("login-form");
  const loginSection = document.getElementById("login-section");
  const adminSection = document.getElementById("admin-section");
  const loginMessage = document.getElementById("login-message");
  const updateForm = document.getElementById("update-form");
  const uploadMessage = document.getElementById("upload-message");
  const signOutButton = document.getElementById("sign-out");

  function showMessage(element, message) {
    element.textContent = message;
  }

  async function refreshSession() {
    const { data } = await client.auth.getSession();
    const signedIn = Boolean(data.session);

    loginSection.hidden = signedIn;
    adminSection.hidden = !signedIn;
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    showMessage(loginMessage, "Signing in...");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      showMessage(loginMessage, "Sign-in failed. Check your email and password.");
      return;
    }

    showMessage(loginMessage, "Signed in successfully.");
    await refreshSession();
  });

  signOutButton.addEventListener("click", async function () {
    await client.auth.signOut();
    await refreshSession();
    showMessage(loginMessage, "You have signed out.");
  });

  updateForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    showMessage(uploadMessage, "Publishing...");

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      showMessage(uploadMessage, "Please sign in again.");
      await refreshSession();
      return;
    }

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const imageFile = document.getElementById("image").files[0];

    if (!imageFile) {
      showMessage(uploadMessage, "Please choose an image.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      showMessage(uploadMessage, "Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      showMessage(uploadMessage, "Your image must be 5 MB or smaller.");
      return;
    }

    const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const imagePath = Date.now() + "-" + safeName;

    const { error: uploadError } = await client.storage
      .from("blizzy-updates")
      .upload(imagePath, imageFile, { upsert: false });

    if (uploadError) {
      showMessage(uploadMessage, "Image upload failed. Check your bucket settings.");
      return;
    }

    const { error: insertError } = await client
      .from("blizzy_updates")
      .insert({
        title: title,
        description: description,
        image_path: imagePath,
        published: true
      });

    if (insertError) {
      showMessage(uploadMessage, "The image uploaded, but the update could not be saved. Please contact support before trying again.");
      return;
    }

    updateForm.reset();
    showMessage(uploadMessage, "Published! Your update has been saved.");
  });

  refreshSession();
})();
  // Blizzy Digitals password recovery
const recoveryClient = window.supabase.createClient(
  window.BLIZZY_SUPABASE_URL,
  window.BLIZZY_SUPABASE_PUBLISHABLE_KEY
);

const recoveryButton = document.createElement("button");
recoveryButton.type = "button";
recoveryButton.textContent = "Forgot password?";
recoveryButton.style.display = "block";
recoveryButton.style.margin = "15px auto";
document.body.appendChild(recoveryButton);

recoveryButton.addEventListener("click", async function () {
  const email = prompt("Enter your admin email address:");

  if (!email) return;

  const { error } = await recoveryClient.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo:
        "https://blizzydigitals.name.ng/reset-password.html"
    }
  );

  if (error) {
    alert("Recovery request failed: " + error.message);
  } else {
    alert("Recovery email requested. Check your inbox.");
  }
});

/* Blizzy Digitals: manage existing updates */
(async function () {
  const list = document.getElementById("admin-updates-list");
  const message = document.getElementById("manage-updates-message");

  if (!list) return;

  const manageClient = window.supabase.createClient(
    window.BLIZZY_SUPABASE_URL,
    window.BLIZZY_SUPABASE_PUBLISHABLE_KEY
  );

  async function loadUpdates() {
    list.textContent = "Loading updates...";

    const { data, error } = await manageClient
      .from("blizzy_updates")
      .select("id, title, description, image_path, published")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "Could not load updates. Please sign in as admin.";
      return;
    }

    list.replaceChildren();

    if (!data || data.length === 0) {
      list.textContent = "No updates found.";
      return;
    }

    data.forEach(function (item) {
      const card = document.createElement("article");
      const heading = document.createElement("h3");
      const description = document.createElement("p");
      const editButton = document.createElement("button");
      const deleteButton = document.createElement("button");

      heading.textContent = item.title;
      description.textContent = item.description;
      editButton.textContent = "Edit";
      deleteButton.textContent = "Delete";
      editButton.type = "button";
      deleteButton.type = "button";

      editButton.addEventListener("click", async function () {
        const newTitle = prompt("Edit update title:", item.title);
        if (newTitle === null) return;

        const newDescription = prompt(
          "Edit update description:",
          item.description
        );
        if (newDescription === null) return;

        if (!newTitle.trim() || !newDescription.trim()) {
          alert("Title and description cannot be empty.");
          return;
        }

        editButton.disabled = true;

        const { error } = await manageClient
          .from("blizzy_updates")
          .update({
            title: newTitle.trim(),
            description: newDescription.trim()
          })
          .eq("id", item.id);

        editButton.disabled = false;

        if (error) {
          alert("Could not edit update: " + error.message);
          return;
        }

        message.textContent = "Update edited successfully.";
        await loadUpdates();
      });

      deleteButton.addEventListener("click", async function () {
        if (!confirm("Delete this update permanently?")) return;

        deleteButton.disabled = true;

        const { error } = await manageClient
          .from("blizzy_updates")
          .delete()
          .eq("id", item.id);

        deleteButton.disabled = false;

        if (error) {
          alert("Could not delete update: " + error.message);
          return;
        }

        message.textContent = "Update deleted successfully.";
        await loadUpdates();
      });

      card.append(heading, description, editButton, deleteButton);
      list.appendChild(card);
    });
  }

  const { data: sessionData } = await manageClient.auth.getSession();

  if (!sessionData.session) {
    list.textContent = "Please sign in to manage updates.";
    return;
  }

  await loadUpdates();
})();
