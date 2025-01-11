document.getElementById('search-btn').onclick = async () => {
    const query = document.getElementById('search-input').value;
    if (!query.trim()) {
        alert('Veuillez entrer un mot-clé.');
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="searching">Recherche en cours...</p>';

    try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}+in:readme`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) {
            throw new Error(`Erreur de l'API GitHub: ${response.status}`);
        }

        const data = await response.json();
        resultsDiv.innerHTML = '';

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';

                const repoInfo = document.createElement('div');
                repoInfo.className = 'repo-info';
                repoInfo.innerHTML = `
                    <h3>${item.full_name}</h3>
                    <p>${item.description || 'Aucune description'}</p>
                    <ul>
                        <li><i class="fas fa-star"></i> ${item.stargazers_count} stars</li>
                        <li><i class="fas fa-code-branch"></i> ${item.forks_count} forks</li>
                        <li><i class="fas fa-eye"></i> ${item.watchers_count} watchers</li>
                        <li><i class="fas fa-code"></i> ${item.language || 'Non spécifié'}</li>
                        <li><i class="fas fa-calendar"></i> Créé le: ${new Date(item.created_at).toLocaleDateString()}</li>
                        <li><i class="fas fa-sync"></i> Dernière mise à jour: ${new Date(item.updated_at).toLocaleDateString()}</li>
                    </ul>
                    <a href="${item.html_url}" target="_blank" class="repo-link">
                        <i class="fab fa-github"></i> Voir sur GitHub
                    </a>
                `;

                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-btn';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> Télécharger';

                // URL de téléchargement direct
                const downloadUrl = `https://github.com/${item.full_name}/archive/refs/heads/main.zip`;

                downloadButton.onclick = () => {
                    // Ouvre l'URL de téléchargement dans un nouvel onglet
                    window.open(downloadUrl, '_blank');
                };

                resultItem.appendChild(repoInfo);
                resultItem.appendChild(downloadButton);
                resultsDiv.appendChild(resultItem);
            });
        } else {
            resultsDiv.innerHTML = '<p class="erreur">Aucun résultat trouvé.</p>';
        }
    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = '<p class="erreur">Une erreur s\'est produite lors de la recherche.</p>';
    }
};