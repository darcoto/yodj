// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  $('#search-button').attr('disabled', false);
  $('#login-link').hide();
}

$(function () {

  var results = [];
  var status = $('#status');

  var control_button = {
    restart:'restart |<',
    play:   'play &#9658;',
    pause:  'pause &#9646;&#9646;',
    stop:   'stop []'
  }

  //-----------------------------------------------
  $('#query').keypress(function (e) {
    if (e.which == 13) {
      $('#search-button').click();
      return false;
    }
  });

  $('#search-button').click(function(){

    var q = $('#query').val();

    var request = gapi.client.youtube.search.list({
      q: q,
      part: 'snippet',
      maxResults:50
    });

    request.execute(function(response) {
      var str = JSON.stringify(response.result);
      var html = '';
      results = [];
      for(i in response.result.items){
        let clip = response.result.items[i];
        html +=
          '<div class="row result videoId_'+clip.id.videoId+'" clip_index="'+i+'">' +
            '<div class="col-md-3"><img src="'+clip.snippet.thumbnails.default.url+'"/></div>' +
            '<div class="col-md-7">'+
              '<h5 class="play-preview">' + clip.snippet.title + '</h5>' +
              //'<p>' + clip.snippet.description + '</p>' +
            '</div>' +
            '<div class="col-md-2">'+
              '<div class="play-display control-button">play &#9658;</div>' +
            '</div>' +
          '</div>';
          results[i] = clip;
      }
      if(!html){
        html = '<div class="row result"><div class="col-sm-12">Not found</div></div>'
      }
      $('#search-container').html(html);
      console.debug(response)
    });
  });

  $("#search-container").on('click','.play-preview', function() {
    var clip_index = $(this).parent().parent().attr('clip_index');
    var data = results[clip_index];
    $('#ytplayer').attr('src','https://www.youtube.com/embed/' + data.id.videoId + '?autoplay=1');
  });

  $("#search-container").on('click','.play-display', function() {
      var clip_index = $(this).parent().parent().attr('clip_index');
      var data = results[clip_index];
      var clip = {
        videoId: data.id.videoId,
        title: data.snippet.title,
        thumb: data.snippet.thumbnails.default.url
      };
      console.log(clip);
      $('#info-display-content').data('clip',clip);
      command_run('play')
  });

  //------------------------------------------
  var es = new EventSource("connect");

  es.onopen = function (event) {
    status.html('Connected');
  }

  es.addEventListener("play", function(event) {
    var data = get_data(event)
    info_display_content(data);
    info_display_control('play');
  }, false);

  es.addEventListener("pause", function(event) {
    var data = get_data(event)
    info_display_content(data);
    info_display_control('pause');
  }, false);

  es.addEventListener("continue", function(event) {
    var data = get_data(event)
    info_display_content(data);
    info_display_control('continue');
  }, false);

  es.addEventListener("stop", function(event) {
    var data = get_data(event)
    info_display_content(data);
    info_display_control('stop');
  }, false);

  es.addEventListener("ping", function(event) {
    var data = get_data(event)
    
    $('#server_clients').html(data.clients.display);
  }, false);

  es.onerror = function (e) {
    e = e || event, msg = '';
    switch( e.target.readyState ){
      case EventSource.CONNECTING: msg = 'Reconnecting';break;
      case EventSource.CLOSED: msg = 'Connection failed. Will not retry.';break;
    }
    status.html('<span style="color:red;">' + msg + "</span><br>");
  };

  var info_display_control = function(command){
    if(command == 'play' || command == 'continue'){
      $('.pause-display').html(control_button.pause).attr('status','pause');
    }else{
      $('.pause-display').html(control_button.play).attr('status','continue');
    }
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
    console.log(data);
    return data;
  }

  var info_display_content = function(clip){
    console.log('run');
    var html =
        '<div class="row">' +
          '<div class="col-sm-4"><img src="'+clip.thumb+'"/></div>' +
          '<div class="col-sm-8">'+
            '<h5 class="play-preview">' + clip.title + '</h5>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-sm-4"></div>' +
          '<div class="col-sm-8">'  +
            '<div class="restart-display control-button">' + control_button.restart + '</div>' +
            '<div class="pause-display control-button">' + control_button.pause + '</div>' +
            '<div class="stop-display control-button">' + control_button.stop + '</div>' +
          '</div>' +
        '</div>';
    $('#info-display-content').html(html).data('clip',clip);
    $('.row.result.active').removeClass('active');
    $('.videoId_'+clip.videoId).addClass('active');
  }

  $("#info-display").on('click','.restart-display', function() {
    command_run('play')
  });

  $("#info-display").on('click','.pause-display', function() {
    var command = $(this).attr('status');
    command_run(command)
  });

  $("#info-display").on('click','.stop-display', function() {
   command_run('stop')
  });

  var command_run = function(command){
    var clip = $('#info-display-content').data('clip');
    var data = {command:command,params:clip};
    console.log('send');
    console.log(data);
    $.post('/api',data);
  }

  $("#query").autocomplete({
    source: function(request, response){

        var apiKey = 'AI39si7ZLU83bKtKd4MrdzqcjTVI3DK9FvwJR6a4kB_SW_Dbuskit-mEYqskkSsFLxN5DiG1OBzdHzYfW0zXWjxirQKyxJfdkg';
        var query = request.term;

        $.ajax({
            url: "https://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+query+"&key="+apiKey+"&format=5&alt=json&callback=?",
            dataType: 'jsonp',
            success: function(data, textStatus, request) {
               response( $.map( data[1], function(item) {
                    return {
                        label: item[0],
                        value: item[0]
                    }
                }));
            }
        });
    },

    select: function( event, ui ) {
        //$.youtubeAPI(ui.item.label);
        $('#search-button').click();
    }
  });

})