document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'https://api.countapi.xyz/hit/calmly-dev.xyz/visits';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            document.getElementById('visitor-count').innerText = data.value;
        })
        .catch(error => {
            console.error('Error fetching visitor count:', error);
            document.getElementById('visitor-count').innerText = 'N/A';
        });
});
