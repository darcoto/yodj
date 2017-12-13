  document.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;

  var player;
  var onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
      height: $(window).height(),
      width: $(window).width()
    });
    console.log('Player ready');
  }

  $(function () {
    
    $('#fullscreen').on('click', () => {
    	if (document.fullscreenEnabled) {
        $('#player').show();
      	requestFullscreen(document.getElementById('player'));
      }else{
        alert('Full screen not supported')
      }
    });

    var status = $('#status');

    status.html('waiting...');

    var es = new EventSource("connect");

    es.onopen = function (event) {
        status.html('Connected');
    }

    es.addEventListener("play", function(event) {
      var data = get_data(event)
      set_command('Play')
      $('#player').show();
      player.loadVideoById(data.videoId);
    }, false);

    es.addEventListener("pause", function(event) {
      set_command('Pause')
      player.pauseVideo();
    }, false);

    es.addEventListener("continue", function(event) {
      set_command('Play')
      player.playVideo();
    }, false);

    es.addEventListener("stop", function(event) {
      set_command('Stop')
      player.stopVideo();
    }, false);

    es.onerror = function (e) {
      e = e || event, msg = '';

      switch( e.target.readyState ){
        // if reconnecting
        case EventSource.CONNECTING:
          msg = 'Reconnecting';
          break;
        // if error was fatal
        case EventSource.CLOSED:
          msg = 'Connection failed. Will retry.';
          
          break;
      }
      status.html('<span style="color:red;">' + msg + "</span><br>");
    };

    var set_command = function(command){
      status.html(command);
      document.title = 'YDJ ' + command;
    }
    
    var get_data = function(event){
      if(!event.data) return false;
      try {
          var data = JSON.parse(event.data);
      } catch (e) {
          console.log('Error JSON parse')
          console.log(event.data)
          return false;
      }
      console.log('receive:'+event.type);
      console.log(data);
      return data;
    }

    function requestFullscreen(element) {
    	if (element.requestFullscreen) {
    		element.requestFullscreen();
    	} else if (element.mozRequestFullScreen) {
    		element.mozRequestFullScreen();
    	} else if (element.webkitRequestFullScreen) {
    		element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    	}
    }
  });