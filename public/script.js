const btn = document.getElementById('shortenBtn');
const input = document.getElementById('longUrl');
const resultDiv = document.getElementById('result');
const shortUrlLink = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');

btn.addEventListener('click', async () => {
  const longUrl = input.value.trim();
  if (!longUrl) return alert('Please enter a URL');

  shortUrlLink.textContent = 'Generating...';
  resultDiv.style.display = 'flex';

  try {
    const res = await fetch('/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl })
    });

    const data = await res.json();
    if (res.ok) {
      shortUrlLink.href = data.shortUrl;
      shortUrlLink.textContent = data.shortUrl;
    } else {
      shortUrlLink.textContent = data.error;
    }
  } catch (err) {
    shortUrlLink.textContent = 'Error connecting to server';
    console.error(err);
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shortUrlLink.href).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
  });
});
