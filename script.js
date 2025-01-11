


function updateProgress(percent) {
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('progress-container');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
}

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


       // Afficher les informations du quota
      console.log(response.headers.get('X-RateLimit-Remaining')); // Nombre de requêtes restantes
      console.log(response.headers.get('X-RateLimit-Reset')); // Heure de réinitialisation du quota  

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

                const zipUrl = `https://api.github.com/repos/${item.full_name}/zipball/main`;

                downloadButton.onclick = async () => {
                    try {
                        const zipResponse = await fetch(zipUrl, {
                            method: 'GET',
                            headers: { 'Accept': 'application/vnd.github+json' }
                        });

                        if (!zipResponse.ok) {
                            throw new Error(`Erreur lors du téléchargement du fichier ZIP (${zipResponse.status})`);
                        }

                        const blob = await zipResponse.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const contentLength = arrayBuffer.byteLength;

                        updateProgress(50);

                        const zip = await JSZip.loadAsync(arrayBuffer);

                        if (!zip.files || Object.keys(zip.files).length === 0) {
                            throw new Error('Le fichier téléchargé n\'est pas un fichier ZIP valide.');
                        }

                        const dirPicker = document.getElementById('file-input');
                        dirPicker.onchange = async () => {
                            const totalFiles = Object.keys(zip.files).length;
                            let processedFiles = 0;

                            for (const [fileName, fileData] of Object.entries(zip.files)) {
                                if (!fileData.dir) {
                                    const content = await fileData.async('blob');
                                    const a = document.createElement('a');
                                    a.href = URL.createObjectURL(content);
                                    a.download = fileName;
                                    a.click();
                                    URL.revokeObjectURL(a.href);

                                    processedFiles++;
                                    updateProgress((processedFiles / totalFiles) * 100);
                                }
                            }

                            setTimeout(() => {
                                document.getElementById('progress-container').style.display = 'none';
                                updateProgress(0);
                                alert('Téléchargement complet !');
                            }, 1000);
                        };

                        dirPicker.click();
                    } catch (error) {
                        console.error('Erreur lors du téléchargement:', error);
                        alert(`Erreur lors du téléchargement: ${error.message}`);
                    }
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