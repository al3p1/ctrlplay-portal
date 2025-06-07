document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const code = document.getElementById("accessCodeInput")?.value;
  if (!code) return alert("Enter a code.");
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("login_code", code);
    location.reload();
  } else {
    alert(data.message || "Login failed");
  }
});
