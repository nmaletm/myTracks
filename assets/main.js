var  myTrack = {};

myTrack.map = undefined;
myTrack.trackElement = undefined;
myTrack.tracksData = undefined;
myTrack.currentTracksIds = undefined;
myTrack.currentTracksData = undefined;
myTrack.allGpx = [];
myTrack.elevation = undefined;
myTrack.mesure = undefined;
myTrack.lastTrackLine = undefined;
myTrack.altitudeButton = undefined;

myTrack.init = function(){
  var myTrack = this;
  this.initMap();
  this.loadTracks();
  this.initKeyBoard();

  $('#buttons-list .list-button').click(function(){
    $('body').addClass('select-mode');
  });
  $('#buttons-list-mode .back-button').click(function(){
    myTrack.closeSelectTracks();
  });
  $('#buttons-list-mode .apply-button').click(function(){
    $('body').removeClass('select-mode');
    myTrack.openMenuSelectedTracks();
  });
  $('#buttons-map .back-button').click(function(){
    myTrack.updateCurrentTrack([]);
    myTrack.showTrackMenu();
  });
  $('#track-data, #buttons-map .info-button').click(function(){
    $('#track-data').toggleClass('hidden');
    $('#buttons-map .info-button').toggleClass('selected');
  });
  /*
  $(window).on('hashchange',function(){
    myTrack.removeCurrentTrack();
    myTrack.initTrack();
  });
  */
};
myTrack.closeSelectTracks = function(){
  $('body').removeClass('select-mode');
  $('#tracks-list li.selected').removeClass('selected');
};


myTrack.openMenuSelectedTracks = function(){
  var listItems = [];
  $('#tracks-list li.selected').each(function(){
    listItems.push($(this).attr('data-trackid'));
  });
  if (listItems.length > 0) {
    this.openTrack(listItems);
  } else {
    this.closeSelectTracks();
  }
};

myTrack.initTrack = function(){
  this.setCurrentTrack();

  if (typeof this.currentTracksIds !== 'undefined') {
    var tracks = this.getTracks(this.currentTracksIds);
    if (tracks.length > 0) {
      this.currentTracksData = tracks;
      this.renderTracks();
    }
  }
  if (typeof this.currentTracksData === 'undefined') {
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

myTrack.renderTracks = function(){

  if(this.currentTracksData.length > 1) {
    $('#title span').html('Tracks');
    $('#people').html('');
  } else {
    this.preCenterTrack(this.currentTracksData['center']);
    $('#title span').html(this.currentTracksData[0]['name']);
    $('#people').html(this.currentTracksData[0]['people'].sort().join(', '));
    $('body').addClass('mode-'+this.currentTracksData[0]['mode']['type']);
  }

  var arrayLength = this.currentTracksData.length;
  for (var i = 0; i < arrayLength; i++) {
    var track = this.currentTracksData[i];
    this.addTrack(track['file']);
  }

  this.showLoading();
};

myTrack.showLoading = function(){
  $('#loading').fadeIn(200);
};

myTrack.hideLoading = function(){
  $('#loading').fadeOut(600);
};

myTrack.showTrackMap = function(){
  $('#map-wrapper, #track-data, #buttons-map').show();
  $('#buttons-list, #buttons-list-mode').hide();
};

myTrack.hideTrackMap = function(){
  this.hideLoading();
  this.hideAltitudeTrack();
  $('#map-wrapper, #track-data, #buttons-map').hide();
  $('#buttons-list').show();
};

myTrack.showTrackMenu = function(){
  var myTrack = this;
  this.hideTrackMap();
  $('#tracks-list').show();

  $('#title span').html('myTracks');

  //$('body').removeClass('boat').removeClass('car').removeClass('trekking').removeClass('plane').removeClass('moto');
  $('body').removeClass(function (index, css) {
    return (css.match (/(^|\s)mode-\S+/g) || []).join(' ');
  });

  $('#tracks-list ul').empty();
  var arrayLength = this.tracksData.length;
  for (var i = 0; i < arrayLength; i++) {
    var track = this.tracksData[i];
    var html = '<li data-trackId="'+track['id']+'"><i class="icon-list '+track['mode']['type']+'"></i> ';
    html += track['name']+' <i>('+track['date']+')</i></li>';
    $('#tracks-list ul').append(html);
  }
  $('#tracks-list ul li').click(function(){
    myTrack.clickTrackMenuItem($(this).attr('data-trackId'));
  });
};
myTrack.clickTrackMenuItem = function(trackId){
    if ($('.select-mode').length > 0) {
      $('li[data-trackid='+trackId+']').toggleClass('selected');
    } else {
      this.openTrack(trackId);
    }
};

myTrack.openTrack = function(trackId){
  this.removeCurrentTrack();
  if (!$.isArray(trackId)) {
    trackId = [trackId];
  }
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

  var token = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpbG10dnA3NzY3OTZ0dmtwejN2ZnUycjYifQ.1W5oTOnWXQ9R1w8u3Oo1yA';
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token='+token, {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(this.map);

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

  this.basemaps = document.getElementById('basemaps');

  this.basemaps.addEventListener('change', function(){
    myTrack.setBasemap(myTrack.basemaps.value);
  });
/*
  // To generate points
  this.map.on('click', function(e) {
    console.log('<trkpt lat="' + e.latlng.lat + '" lon="' + e.latlng.lng + '">');
  });
*/

};

myTrack.loadTracks = function(){
  var myTrack = this;
  $.getJSON( "tracks.json", function( data ) {
    myTrack.tracksData = data.reverse();
    myTrack.initTrack();
  });
};

myTrack.getTracks = function(ids){
  var arrayLength = this.tracksData.length;
  var tracks = [];
  for (var i = 0; i < arrayLength; i++) {
    if (ids.indexOf(this.tracksData[i]['id']) > -1) {
      tracks.push(this.tracksData[i]);
    }
  }
  return tracks;
};

myTrack.setCurrentTrack = function(){
  tracksIds = window.location.hash.replace('#', '').split('-');
  for(var i=0; i<tracksIds.length; i++) { tracksIds[i] = parseInt(tracksIds[i], 10); } 
  this.currentTracksIds = tracksIds;
};

myTrack.updateCurrentTrack = function(tracksId){
  this.currentTracksIds = tracksId;
  window.location.hash = '#'+this.currentTracksIds.join('-');
};

myTrack.removeCurrentTrack = function(){
  if (this.allGpx.length > 0) {
    var arrayLength = this.allGpx.length;
    for (var i = 0; i < arrayLength; i++) {
      this.allGpx[i].clearLayers();
      delete this.allGpx[i];
    }
  }
  this.allGpx = [];
};

myTrack.addTrack = function(gpx){
  var myTrack = this;
  var gpx = new L.GPX(gpx, {
    async: true,
    marker_options: {
      startIconUrl: undefined,//'assets/Leaflet.Gpx/pin-icon-start.png',
      endIconUrl: undefined,//'assets/Leaflet.Gpx/pin-icon-end.png',
      shadowUrl: undefined,//'assets/Leaflet.Gpx/pin-shadow.png'
    }
  });
  gpx.on('loaded', function(e) {
    myTrack.map.fitBounds(e.target.getBounds());
    myTrack.trackElement = e.target;
    myTrack.setTrackData();
    myTrack.hideLoading();
  }).addTo(myTrack.map);

  gpx.on('addline', function(e){
    myTrack.lastTrackLine = e.line;
  });
  this.allGpx.push(gpx);
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


myTrack.setBasemap = function(basemap){
  if (this.layer) {
    this.map.removeLayer(this.layer);
  }
  this.layer = L.esri.basemapLayer(basemap);
  this.map.addLayer(this.layer);
  if (this.layerLabels) {
    this.map.removeLayer(this.layerLabels);
  }

  if (basemap === 'ShadedRelief' || basemap === 'Oceans' || basemap === 'Gray' || basemap === 'DarkGray' || basemap === 'Imagery' || basemap === 'Terrain') {

    this.layerLabels = L.esri.basemapLayer(basemap + 'Labels');
    this.map.addLayer(this.layerLabels);
  }
};

myTrack.init();
