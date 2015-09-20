var  myTrack = {};

myTrack.map = undefined;
myTrack.trackElement = undefined;
myTrack.tracksData = undefined;
myTrack.currentTrackId = undefined;
myTrack.currentTrackData = undefined;
myTrack.gpx = undefined;

myTrack.init = function(){
  var myTrack = this;
  this.initMap();
  this.loadTracks();

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


myTrack.renderTrack = function(){
  this.removeCurrentTrack();
  this.addTrack(this.currentTrackData['file']);
  $('#title span').html(this.currentTrackData['name']);;
  $('#people').html(this.currentTrackData['people'].sort().join(', '));
  $('body').addClass(this.currentTrackData['mode']['type']);
};


myTrack.hideTrackMenu = function(){
  $('#map-wrapper, #track-data, #back-button, #info-button').show();
  $('#tracks-list').hide();
};

myTrack.showTrackMenu = function(){
  var myTrack = this;
  $('#map-wrapper, #track-data, #back-button, #info-button').hide();
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
    myTrack.updateCurrentTrack($(this).attr('data-trackId'));
    myTrack.initTrack();
    myTrack.hideTrackMenu();
  });
};

myTrack.initMap = function(){
  this.map = L.map('map').setView([51.505, -0.09], 13);
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
  this.map.setView([38.82259, -2.8125], 5);
  this.gpx = new L.GPX(gpx, {
    async: true,
    marker_options: {
      startIconUrl: 'assets/leaflet-gpx-master/pin-icon-start.png',
      endIconUrl: 'assets/leaflet-gpx-master/pin-icon-end.png',
      shadowUrl: 'assets/leaflet-gpx-master/pin-shadow.png'
    }
  }).on('loaded', function(e) {
    myTrack.map.fitBounds(e.target.getBounds());
    myTrack.trackElement = e.target;
    myTrack.setTrackData();
  }).addTo(myTrack.map);
};

myTrack.setTrackData = function(){
  var tr = this.trackElement;
  $('#distance').html(Math.round(tr.get_distance())/1000+' km');
  $('#start-date').html(tr.get_start_time());
  $('#end-date').html(tr.get_end_time());
  $('#moving-time').html(tr.get_duration_string(tr.get_moving_time()));
  $('#total-time').html(tr.get_duration_string(tr.get_total_time()));
  $('#moving-speed').html(Math.round(tr.get_moving_speed())+' hm/h');
  $('#elevation-gain').html(Math.round(tr.get_elevation_gain())+' m');
  $('#elevation-loss').html(Math.round(tr.get_elevation_loss())+' m');
};


myTrack.init();
