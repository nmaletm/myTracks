var  myTrack = {};

myTrack.map = undefined;
myTrack.trackElement = undefined;
myTrack.tracksData = undefined;
myTrack.currentTrackId = undefined;
myTrack.currentTrackData = undefined;
myTrack.gpx = undefined;
myTrack.elevation = undefined;
myTrack.mesure = undefined;
myTrack.lastTrackLine = undefined;
myTrack.altitudeButton = undefined;

myTrack.init = function(){
  var myTrack = this;
  this.initMap();
  this.loadTracks();
  this.initKeyBoard();

  $('#back-button').click(function(){
    myTrack.updateCurrentTrack('');
    myTrack.showTrackMenu();
  });
  $('#track-data, #info-button').click(function(){
    $('#track-data').toggleClass('hidden');
    $('#info-button').toggleClass('selected');
  });
};


myTrack.initTrack = function(){
  this.setCurrentTrack();

  if (typeof this.currentTrackId !== 'undefined') {
    var track = this.getTrack(this.currentTrackId);
    if (track !== null) {
      this.currentTrackData = track;
      this.renderTrack();
    }
  }
  if (typeof this.currentTrackData === 'undefined') {
    this.showTrackMenu();
  }
};

myTrack.preCenterTrack = function(center){
    if (typeof center !== 'undefined') {
      this.map.setView([center['lat'], center['lng']], center['zoom'], {animation: true});
    } else {
      this.map.setView([40.094882122321145, -1.7907714843749998], 6, {animation: true});
    }
};

myTrack.renderTrack = function(){
  this.removeCurrentTrack();
  this.preCenterTrack(this.currentTrackData['center']);
  this.addTrack(this.currentTrackData['file']);
  $('#title span').html(this.currentTrackData['name']);;
  $('#people').html(this.currentTrackData['people'].sort().join(', '));
  $('body').addClass(this.currentTrackData['mode']['type']);
  this.showLoading();
};

myTrack.showLoading = function(){
  $('#loading').fadeIn(200);
};

myTrack.hideLoading = function(){
  $('#loading').fadeOut(600);
};

myTrack.showTrackMap = function(){
  $('#map-wrapper, #track-data, #back-button, #info-button').show();
};

myTrack.hideTrackMap = function(){
  this.hideLoading();
  this.hideAltitudeTrack();
  $('#map-wrapper, #track-data, #back-button, #info-button').hide();
};

myTrack.showTrackMenu = function(){
  var myTrack = this;
  this.hideTrackMap();
  $('#tracks-list').show();

  $('#title span').html('myTracks');
  $('body').removeClass('boat').removeClass('car').removeClass('trekking');

  $('#tracks-list ul').empty();
  var arrayLength = this.tracksData.length;
  for (var i = 0; i < arrayLength; i++) {
    var track = this.tracksData[i];
    var html = '<li data-trackId="'+track['id']+'"><i class="fa icon-list '+track['mode']['type']+'"></i> ';
    html += track['name']+' <i>('+track['date']+')</i></li>';
    $('#tracks-list ul').append(html);
  }
  $('#tracks-list ul li').click(function(){
    myTrack.openTrack($(this).attr('data-trackId'));
  });
};

myTrack.openTrack = function(trackId){
    this.updateCurrentTrack(trackId);
    this.initTrack();
    this.hideTrackMenu();
    this.showTrackMap();
};

myTrack.hideTrackMenu = function(){
  $('#tracks-list').hide();
};

myTrack.initMap = function(){
  var myTrack = this;
  this.map = L.map('map').setView([40.094882122321145, -1.7907714843749998], 6);
  //*
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(this.map);
/*  * /
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?', {
    attribution: 'OpenStreetMap',
    maxZoom: 18,
  }).addTo(this.map);*/
  this.mesure = L.Control.measureControl().addTo(this.map);
  this.altitudeButton = L.easyButton({
    states: [{
      stateName: 'altitude-show',
      icon: 'fa-bar-chart',
      title: 'Show altitude chart',
      onClick: function(btn, map) {
        myTrack.showAltitudeTrack();
      }
    }, {
      stateName: 'altitude-hide',
      icon: 'fa-bar-chart',
      title: 'Hide altitude chart',
      onClick: function(btn, map) {
        myTrack.hideAltitudeTrack();
      }
    }]
  }).addTo(this.map);

};

myTrack.loadTracks = function(){
  var myTrack = this;
  $.getJSON( "tracks.json", function( data ) {
    myTrack.tracksData = data.reverse();
    myTrack.initTrack();
  });
};

myTrack.getTrack = function(id){
  var arrayLength = this.tracksData.length;
  for (var i = 0; i < arrayLength; i++) {
    if (this.tracksData[i]['id'] == id) {
      return this.tracksData[i];
    }
  }
  return null;
};

myTrack.setCurrentTrack = function(){
  this.currentTrackId = window.location.hash.replace('#', '');
};

myTrack.updateCurrentTrack = function(trackId){
  this.currentTrackId = trackId;
  window.location.hash = '#'+this.currentTrackId;
};

myTrack.removeCurrentTrack = function(){
  if (typeof this.gpx !== 'undefined') {
    this.gpx.clearLayers();
    this.gpx = undefined;
  }
};

myTrack.addTrack = function(gpx){
  var myTrack = this;
  this.gpx = new L.GPX(gpx, {
    async: true,
    marker_options: {
      startIconUrl: 'assets/Leaflet.Gpx/pin-icon-start.png',
      endIconUrl: 'assets/Leaflet.Gpx/pin-icon-end.png',
      shadowUrl: 'assets/Leaflet.Gpx/pin-shadow.png'
    }
  });
  this.gpx.on('loaded', function(e) {
    myTrack.map.fitBounds(e.target.getBounds());
    myTrack.trackElement = e.target;
    myTrack.setTrackData();
    myTrack.hideLoading();
  }).addTo(myTrack.map);

  this.gpx.on('addline', function(e){
    myTrack.lastTrackLine = e.line;
  });
};

myTrack.hideAltitudeTrack = function(){
  this.altitudeButton.state('altitude-show');
  if (typeof this.elevation !== 'undefined') {
    this.elevation.clear();
    this.elevation.removeFrom(this.map);
    this.elevation = undefined;
  }
};

myTrack.showAltitudeTrack = function(){
  this.altitudeButton.state('altitude-hide');
  if (typeof this.lastTrackLine !== 'undefined') {
    this.elevation = L.control.elevation({
      position: "bottomright",
      theme: "steelblue-theme",
      collapsed: false
    });
    this.elevation.addTo(this.map);
    this.elevation.addData(this.lastTrackLine);
  }
};

myTrack.setTrackData = function(){
  var tr = this.trackElement;
  $('#distance').html(Math.round(tr.get_distance())/1000+' km');
  $('#start-date').html(tr.get_start_time());
  $('#end-date').html(tr.get_end_time());
  $('#moving-time').html(tr.get_duration_string(tr.get_moving_time()));
  $('#total-time').html(tr.get_duration_string(tr.get_total_time()));
  $('#moving-speed').html(Math.round(tr.get_moving_speed())+' km/h');
  $('#elevation-gain').html(Math.round(tr.get_elevation_gain())+' m');
  $('#elevation-loss').html(Math.round(tr.get_elevation_loss())+' m');
};

myTrack.initKeyBoard = function(){
  var myTrack = this;
  $(document).on('keydown', function ( e ) {
    if ( e.ctrlKey && ( String.fromCharCode(e.which) === 'g' || String.fromCharCode(e.which) === 'G' ) ) {
      var text = '\n\t\t"center": {\n'; 
      text += '\t\t\t"zoom": ' + myTrack.map.getZoom() + ',\n';
      text += '\t\t\t"lat": ' + myTrack.map.getCenter().lat + ',\n';
      text += '\t\t\t"lng": ' + myTrack.map.getCenter().lng + '\n';
      text += '\t\t},\n';
      alert(text);
    }
  });
};

myTrack.init();
