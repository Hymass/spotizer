const app = new Vue({
    el: '#app',
    data: {
        albums: [],
        artists: [],
        songs: [],
        playlisttab: [],
        linkSongsInPlaylist: [],
        songsInPlaylist: [],
        isLoading: false,
        searchTerm: '',
        searchCriteria: 'title',
        selectedAlbum: null,
        selectedArtist: null,
        selectedSong: null,
        selectedPlaylist: null,
        searchCategory: "album",
        createPlaylist: false,
    },
    methods: {
        searchAlbums() {
            this.artists = [];
            this.playlisttab = [];
            this.songs = [];
            this.createPlaylist = false;
            this.isLoading = true;
            let url = 'https://mmi.unilim.fr/~morap01/L250/public/index.php/api/albums';
            switch (this.searchCriteria) {
                case 'title':
                    url += '?title=' + this.searchTerm;
                    break;
                case 'artist':
                    url += '?artist.name=' + this.searchTerm;
                    break;
                case 'albumType':
                    url += '?albumtype.name=' + this.searchTerm;
                    break;
            }
            fetch(url)
                .then((response) => response.json())
                .then((albums) => {
                    this.albums = albums;
                    this.isLoading = false;
                })
                .catch((error) => console.error(error));
        },
        showAlbum(album) {
            this.selectedAlbum = album;
            console.log(this.selectedAlbum.artist.id)
            let url = `https://mmi.unilim.fr/~morap01/L250/public/index.php/api/albums/${album.id}`;
            fetch(url)
                .then((response) => response.json())
                .then((albumDetails) => {
                    fetch('https://mmi.unilim.fr/~morap01/L250/public/index.php/api/artists/' + this.selectedAlbum.artist.id)
                        .then((response) => response.json())
                        .then((artist) => {
                            this.selectedAlbum.artist = artist;

                        })
                        .catch((error) => console.error(error));
                    this.selectedAlbum.details = albumDetails;
                })
                .catch((error) => console.error(error));
        },
        hideAlbum() {
            this.selectedAlbum = null;
        },
        searchArtists() {
            this.playlisttab = [];
            this.albums = [];
            this.songs = [];
            this.createPlaylist = false;
            this.isLoading = true;
            let url = 'https://mmi.unilim.fr/~morap01/L250/public/index.php/api/artists?name=' + this.searchTerm;
            fetch(url)
                .then((response) => response.json())
                .then((artists) => {
                    this.artists = artists;
                    this.isLoading = false;
                })
                .catch((error) => console.error(error));
        },
        getPlaylistsName() {
            this.playlisttab = [];
            this.albums = [];
            this.songs = [];
            this.artists = [];
            const storedPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
            this.playlisttab = storedPlaylists;
        },
        showArtist(artist) {
            this.selectedArtist = artist;
            let url = `https://mmi.unilim.fr/~morap01/L250/public/index.php/api/artists/${artist.id}`;
            fetch(url)
                .then((response) => response.json())
                .then((artistDetails) => {
                    this.selectedArtist.details = artistDetails;
                    this.getArtistAlbums(this.selectedArtist.details)
                        .then((albums) => {
                            this.albums = albums;
                        })
                        .catch((error) => console.error(error));
                })
                .catch((error) => console.error(error));
        },
        async getArtistAlbums(artist) {
            let albumPromises = artist.albums.map((albumUrl) => {
                let url = `https://mmi.unilim.fr${albumUrl}`;
                return fetch(url)
                    .then((response) => response.json());
            });

            return Promise.all(albumPromises);
        },
        hideArtist() {
            this.selectedArtist = null;
            this.albums = [];
        },
        searchSongs() {
            this.albums = [];
            this.playlisttab = [];
            this.artists = [];
            this.isLoading = true;
            let url = 'https://mmi.unilim.fr/~morap01/L250/public/index.php/api/songs?title=' + this.searchTerm;
            fetch(url)
                .then((response) => response.json())
                .then((songs) => {
                    for (let i = 0; i < songs.length; i++) {
                        const song = songs[i];
                        fetch('https://mmi.unilim.fr' + song.artist)
                            .then((response) => response.json())
                            .then((artist) => {
                                song.artist = artist;
                                fetch('https://mmi.unilim.fr' + song.album)
                                    .then((response) => response.json())
                                    .then((album) => {
                                        song.album = album;
                                        if (i === songs.length - 1) {
                                            this.songs = songs;
                                            this.isLoading = false;
                                        }
                                    })
                                    .catch((error) => console.error(error));
                            })
                            .catch((error) => console.error(error));
                    }
                })
                .catch((error) => console.error(error));
        },
        getSong(song) {
            if (this.createPlaylist) {
                this.addSongToPlaylist(song)
            } else {
                this.showSong(song)
            }
        },
        showSong(song) {
            this.selectedSong = song;
            let url = `https://mmi.unilim.fr/~morap01/L250/public/index.php/api/songs/${song.id}`;
            fetch(url)
                .then((response) => response.json())
                .then((songDetails) => {
                    this.selectedSong.details = songDetails;
                })
                .catch((error) => console.error(error));
        },
        hideSong() {
            this.selectedSong = null;
        },
        async makePlaylist() {
            const playlistTitle = document.getElementById('create-playlist').value;

            const newPlaylist = {
                name: playlistTitle,
                songs: this.linkSongsInPlaylist,
            };

            const response = await fetch('https://mmi.unilim.fr/~morap01/L250/public/index.php/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPlaylist)
            });

            if (response.ok) {
                const playlist = await response.json();
                playlist.songs = this.linkSongsInPlaylist;
                this.updatePlaylist(playlist)
                this.createPlaylist = false;
            } else {
                console.error('Erreur lors de la création de la playlist:', response.statusText);
            }
        },
        async updatePlaylist(playlist) {

            const response = await fetch('https://mmi.unilim.fr/~morap01/L250/public/index.php/api/playlists/' + playlist.id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playlist)
            });

            if (response.ok) {
                const playlist = await response.json();
                playlist.songs = this.linkSongsInPlaylist;

                const storedPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
                storedPlaylists.push(playlist);
                localStorage.setItem('playlists', JSON.stringify(storedPlaylists));

                this.playlisttab = storedPlaylists;
                this.songsInPlaylist = [];
                this.linkSongsInPlaylist = [];

            } else {
                console.error('Erreur lors de la mise à jour de la playlist:', response.statusText);
            }
        },
        addSongToPlaylist(song) {
            this.linkSongsInPlaylist.push("/~morap01/L250/public/index.php/api/songs/" + song.id)
            this.songsInPlaylist.push(song)
        },
        deleteSongFromPlaylist(song) {
            const index = this.songsInPlaylist.indexOf(song);
            if (index > -1) {
                this.songsInPlaylist.splice(index, 1);
                this.linkSongsInPlaylist.splice(index, 1);
            }
        },
        async showPlaylist(playlist) {
            this.selectedPlaylist = playlist;
            for (let i = 0; i < playlist.songs.length; i++) {
                const response = await fetch('https://mmi.unilim.fr' + playlist.songs[i], {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });

                if (response.ok) {
                    const song = await response.json();
                    fetch('https://mmi.unilim.fr' + song.artist)
                        .then((response) => response.json())
                        .then((artist) => {
                            song.artist = artist;
                            fetch('https://mmi.unilim.fr' + song.album)
                                .then((response) => response.json())
                                .then((album) => {
                                    song.album = album;
                                    if (i === songs.length - 1) {
                                        song = songs;
                                    }
                                })
                                .catch((error) => console.error(error));
                        })
                        .catch((error) => console.error(error));
                    this.songsInPlaylist.push(song)
                    this.linkSongsInPlaylist.push("/~morap01/L250/public/index.php/api/songs/" + song.id)

                } else {
                    console.error('Erreur lors de la mise à jour de la playlist:', response.statusText);

                }
            }
        },
        hidePlaylist() {
            this.selectedPlaylist = null;
            this.songsInPlaylist = [];
        },

    },
});