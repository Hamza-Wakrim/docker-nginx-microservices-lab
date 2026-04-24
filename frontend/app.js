function show(data) {
    document.getElementById('output').textContent =
      JSON.stringify(data, null, 2);
  }
  
  function loadHealth() {
    fetch('/api/health')
      .then(res => res.json())
      .then(show)
      .catch(err => show({ error: err.message }));
  }
  
  function loadData() {
    fetch('/api/data')
      .then(res => res.json())
      .then(show)
      .catch(err => show({ error: err.message }));
  }