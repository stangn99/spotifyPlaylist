  const app = {};

  // General messages
  const emptyErr = `<h2>Your Spotify playlist is empty</h2><button id='js-createPlaylist'>Create New Playlist</button>`;

  app.playTrack = (previewURL) => {
    console.log(previewURL)
    let audio = new Audio(previewURL);
    
    audio.play();



  }


  app.displaySearchResults = (results) => {
    console.log(results)
    let trackID = results.id;
    let previewURL = results.preview_url;
    let artist = results.album.artists[0].name;
    let trackName = results.name;
  
    resultHTML = `<div class='searchResults'>
                        <a href="#" id="playPreview" data-preview="${previewURL}"><img src="../images/playbtn.png" ></a>
                        <a href="#" id="addToPlaylist" data-id="${trackID}"> <img src="../images/addtoplaylist.png"> </a>
                        <div class='artistName'><strong>${artist}</strong></div> 
                        <div class='trackName'><a href="#" data-id="${trackID}">${trackName}</a></div>
                      </div>`;
                      
    app.searchResultContainer.hide().show('fast').append(resultHTML);
  }

  app.searchSongs = (str) => {
      let q = encodeURIComponent(str);
      fetch(`https://api.spotify.com/v1/search?q="${q}"&type=track`, app.options)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          $('.searchResults').empty();
          let items = data.tracks.items.map((item) => {
            app.displaySearchResults(item);
          })
        })
        .catch((err) => {
          console.log(err)
        })


  };


  app.displayTracks = (tracks, img) => {
  	const trackList = tracks.items;
    app.displayModal('showTracks');
    let html = `<div class='img'><img src='${img}'></div>`;

    html += `<div class='tracks'><ul>`;

    trackList.forEach((track) => {
    	// console.log(track)
    	// console.log(track.track.preview_url);
    	html += `<li>${track.track.preview_url}</li>`;
    });

    html += '</ul></div>';
    $('.showTracks').html(html);
  }


  app.getTracks = (id, img) => {
    fetch(`https://api.spotify.com/v1/users/${app.userName}/playlists/${id}/tracks`, app.options)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        app.displayTracks(data, img);
      })
  }



  app.displayPlaylist = (playlist) => {

    app.playlistContainer.html('');

    const playlistArray = playlist;
    let html = '';
    playlistArray.forEach(function(item) {
      html = `<div class='playlistItem'>`;
      if (item.images.length != 0) {
        html += `<a href='#' class='playlistTracks' data-id=${item.id}><img src='${item.images[0]['url']}'></a>`;
      }
      html += `</div>`;
      app.playlistContainer.hide().append(html).fadeIn('fast');
    });
  }

  app.displayErr = (errData) => {
    alert(errData.message);
  }


  // Create playlist if non exists
  app.createPlaylist = () => {
    app.playlistDetails = {
      'name': $('#playlistName').val(),
      'description': $('#playlistDescription').val(),
      'public': $('#privateCheckbox').prop('checked')
    }
    app.playlistOptions = {
      // Need to strinigy b/c body doesn't expect JSON formatted data
      body: JSON.stringify(app.playlistDetails),
      method: 'POST'
    }

    fetch('https://api.spotify.com/v1/users/stangn99/playlists', Object.assign({}, app.options, app.playlistOptions))
      .then(res => {
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          // alert the error msg from spotify
          app.displayErr(data.error);
        } else {
          // show success modal
          app.postSuccess('Playlist Created');
          app.getPlaylists();
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }



  app.displayModal = (caller) => {
    app.modal.fadeIn('fast');

    if (caller === 'btnCreatePlaylist') {
      $('.newPlaylist').css('display', 'block');
    } else if (caller === 'showTracks') {
      $('.showTracks').css('display', 'flex');
    } else if (caller === 'btnSearch') {
      $('.searchTracks').css('display', 'block');
    }
    $(document).on('click keyup', function(e) {
      if (e.target.id === 'modal' || e.key === 'Escape') {
        app.modal.fadeOut('fast');
        $('.newPlaylist, .showTracks, .searchTracks').css('display', 'none')
      }
    });

  }
  // Get user playlists 
  app.getPlaylists = () => {
    fetch('https://api.spotify.com/v1/me/playlists', app.options)
      .then((res) => {
        res.json().then((playlists) => {
          const playlist = playlists.items;
          if (playlist.length === 0) {
            app.playlistContainer.html(emptyErr);
            $('#js-createPlaylist').on('click', () => {
              app.createPlaylist();
            })
          } else {
            app.displayPlaylist(playlist);
          }
        });
      });
  }


  // Get new token and set header welcome
  app.generateNewToken = () => {
    const refreshToken = 'AQB7XC0rrnL13AGVLIjbvuv30rO2jmRBI_vo1UiwMRhY9YRVzqx0mD74R_rNX1VbNYoIrJVyRgOvrnEQozHqsyNKDwXH92ehdsRDsHgA8q_dLJEcwME35IILr3URHasqIEc';
    fetch('/refresh_token?refresh_token=' + refreshToken)
      .then((resp) => {
        // promise returned to .then below
        return resp.json();
      })
      .then((data) => {
        console.log(data)
        app.token = data.access_token;
        app.options = {
          headers: {
            'Authorization': 'Bearer ' + app.token
          }
        }
        return fetch('https://api.spotify.com/v1/me', app.options)
      })
      .then((resp) => {
        return resp.json();
      })
      .then((data) => {
        app.userName = data.id;
        $('#js-username').html(data.id + "'s");
        app.getPlaylists();
      })
      .catch((err) => {
        console.log(err)
      })
  }



  // INIT
  app.init = () => {
    app.generateNewToken();
    app.modal = $('.modal');
    app.playlistContainer = $('.playlist');
    app.searchResultContainer = $('.results');

    $('.close').on('click', function() {
      app.modal.fadeOut('fast');
    })
    $('.searchTracks').on('click', '#playPreview', function() {
      app.playTrack($(this).data('preview'));
    });

    $('.playlist').on('click', 'a.playlistTracks', function() {
      let img = $(this).find('img').attr('src');
      app.getTracks($(this).data('id'), img);
    });
    $('#createBtn').on('click', function() {
      app.createPlaylist();
    });
    $('#btnCreatePlaylist').on('click', function() {
      app.displayModal($(this)[0].id);
    });

    $('#btnSearch').on('click', function() {
      app.displayModal($(this)[0].id);
    });

    $('#searchBtn').on('click', function() {
      app.searchSongs($('#searchSongInput').val());
    });

    app.postSuccess = (txt) => {
      $('.successModalContent').text(txt)
      $('.successModal').fadeIn('fast')
      setTimeout(() => {
        $('.successModal').fadeOut('fast')
      }, 1250)
    }
  }



  $(function() {
    app.init();
  });