
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
  
