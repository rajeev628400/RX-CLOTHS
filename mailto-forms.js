document.querySelectorAll("form[data-mailto-subject]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const body = Array.from(new FormData(form), ([name, value]) => `${name}: ${value}`).join("\n");
    const subject = encodeURIComponent(form.dataset.mailtoSubject);
    window.location.href = `mailto:hello@rxcloths.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  });
});
