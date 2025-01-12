document.getElementById('search-input').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

document.getElementById('search-btn').onclick = async () => {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
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
            data.items.forEach(async (item) => {
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
                        <li><i class="fas fa-code"></i> ${item.language || 'Langage non spécifié'}</li>
                        <li><i class="fas fa-calendar"></i> Créé le: ${new Date(item.created_at).toLocaleDateString()}</li>
                        <li><i class="fas fa-sync"></i> Dernière mise à jour: ${new Date(item.updated_at).toLocaleDateString()}</li>
                    </ul>
                    <a href="${item.html_url}" target="_blank" class="repo-link">
                        <i class="fab fa-github"></i> Voir sur GitHub
                    </a>
                `;

                const viewContentsButton = document.createElement('button');
                viewContentsButton.className = 'view-contents-btn';
                viewContentsButton.innerHTML = '<i class="fas fa-eye"></i> Voir le contenu';

                viewContentsButton.onclick = async () => {
                    const modal = document.getElementById('content-modal');
                    const modalBody = document.getElementById('modal-body');
                    const modaltitle = document.getElementById('modal-title');
                    modaltitle.innerHTML = `Contenu du Repo <u><a href="https://github.com/${item.full_name}" target="_blank">${item.full_name}</a></u>`;
                    modal.style.display = 'block';

                    modalBody.innerHTML = '<p class="searching">Chargement en cours...</p>';

                    const fetchContents = async (path = '', parentDiv) => {
                        const contentsUrl = `https://api.github.com/repos/${item.full_name}/contents/${path}`;
                        try {
                            const response = await fetch(contentsUrl);
                            if (!response.ok) {
                                throw new Error(`Erreur: ${response.status}`);
                            }

                            const contents = await response.json();

                            contents.forEach(file => {
                                const fileItem = document.createElement('div');
                                fileItem.className = file.type === 'dir' ? 'folder-item' : 'file-item';

                                if (file.type === 'dir') {
                                    fileItem.innerHTML = `
                                        <i class="fas fa-folder"></i>
                                        <i class="fas fa-folder-open" style="display: none;"></i>
                                        ${file.name}
                                    `;
                                    const subFolderContent = document.createElement('div');
                                    subFolderContent.className = 'folder-content';
                                    subFolderContent.style.display = 'none';
                                
                                    fileItem.onclick = async () => {
                                        const isExpanded = subFolderContent.style.display === 'block';
                                        subFolderContent.style.display = isExpanded ? 'none' : 'block';
                                
                                        
                                        fileItem.querySelector('.fas.fa-folder').style.display = isExpanded ? 'inline' : 'none';
                                        fileItem.querySelector('.fas.fa-folder-open').style.display = isExpanded ? 'none' : 'inline';
                                
                                        if (!isExpanded && subFolderContent.childElementCount === 0) {
                                            await fetchContents(file.path, subFolderContent);
                                        }
                                    };
                                
                                    parentDiv.appendChild(fileItem);
                                    parentDiv.appendChild(subFolderContent);
                                } else {
                                    fileItem.innerHTML = `<i class="fas fa-file"></i>
                                    <a href="${file.download_url}" target="_blank">${file.name}</a>`;
                                    parentDiv.appendChild(fileItem);
                                }
                            });
                        } catch (error) {
                            console.error(error);
                            alert(`Erreur: ${error.message}`);
                        }
                    };

                    modalBody.innerHTML = '';
                    await fetchContents('', modalBody);
                };

                const downloadButton = document.createElement('a');
                downloadButton.className = 'repo-link';
                downloadButton.href = `https://github.com/${item.full_name}/archive/refs/heads/main.zip`;
                downloadButton.target = '_blank';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> Télécharger ZIP';

               
                const checkGitHubPages = async () => {
                    try {
                        
                        const pagesResponse = await fetch(`https://api.github.com/repos/${item.full_name}/pages`, {
                            headers: { 'Accept': 'application/vnd.github.v3+json' }
                        });

                        if (pagesResponse.ok) {
                            const pagesData = await pagesResponse.json();
                            if (pagesData && pagesData.html_url) {
                                const siteLink = document.createElement('a');
                                siteLink.className = 'repo-link';
                                siteLink.href = pagesData.html_url;
                                siteLink.target = '_blank';
                                siteLink.innerHTML = '<i class="fas fa-globe"></i> Visiter le site';
                                repoInfo.appendChild(siteLink);
                                return;
                            }
                        }

                      
                        const contentsResponse = await fetch(`https://api.github.com/repos/${item.full_name}/contents`, {
                            headers: { 'Accept': 'application/vnd.github.v3+json' }
                        });

                        if (contentsResponse.ok) {
                            const contents = await contentsResponse.json();
                            if (contents.some(file => file.name.toLowerCase() === 'index.html')) {
                                const githubPagesLink = `https://${item.owner.login}.github.io/${item.name}`;
                                const siteLink = document.createElement('a');
                                siteLink.className = 'repo-link';
                                siteLink.href = githubPagesLink;
                                siteLink.target = '_blank';
                                siteLink.innerHTML = '<i class="fas fa-globe"></i> Visiter le site';
                                repoInfo.appendChild(siteLink);
                            }
                        }
                    } catch (error) {
                        console.warn('Erreur lors de la vérification des GitHub Pages:', error);
                    }
                };

                await checkGitHubPages();

                resultItem.appendChild(repoInfo);
                resultItem.appendChild(viewContentsButton);
                resultItem.appendChild(downloadButton);
                resultsDiv.appendChild(resultItem);
            });
        } else {
            resultsDiv.innerHTML = '<p class="erreur">Aucun résultat trouvé.</p>';
        }
    } catch (error) {
        console.error(error);
        if (navigator.onLine === false) {
            resultsDiv.innerHTML = '<p class="erreur">Vous êtes hors ligne. Veuillez vérifier votre connexion.</p>';
            return;
            
        }
        resultsDiv.innerHTML = '<p class="erreur">Une erreur s\'est produite lors de la recherche.</p>';
    }
};

document.getElementById('close-modal').onclick = () => {
    document.getElementById('content-modal').style.display = 'none';
};

window.onclick = (event) => {
    const modal = document.getElementById('content-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};