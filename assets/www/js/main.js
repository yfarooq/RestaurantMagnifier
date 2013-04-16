/*
 * Copyright: Yama Ghulam Farooq. 2013.
 * All rights reserved.
*/
console.log("Main.js Loaded"); 
// Global variables 
var Latitude;
var Longitude;

 
 // Accessing Device location 
 function GeoLoc() {
   console.log("GeoLoc called");
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

var onSuccess = function(position) {
  console.log("GeoLoc OnSuccess called");
  Latitude = position.coords.latitude;
  Longitude = position.coords.longitude;
//  alert(Latitude);
  initialize(Latitude,Longitude);
};

var onError = function() {
  console.log("GeoLoc OnError");
  alert('cant access your location');
};

////

var map;
var infowindow;

function initialize(Latitude,Longitude) {
  var pyrmont = new google.maps.LatLng(Latitude,Longitude);

  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: pyrmont,
    zoom: 15
  });

  var request = {
    location: pyrmont,
    radius: 1500,
    types: ['hospital']
  };
  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
}

function callback(results, status) {
  console.log("--------------------------------------------------------------------------------------");
  console.log("Reslt is : "+JSON.stringify(results));
  addContant(results);

  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

function addContant(results) {
  var restData = results;
  alert(JSON.stringify(restData));
  var NL = "\n";
  var content = NL
      + '<a href="#" id="' + viewId + '" broadcastId="' + id + '"> ' + NL
      + '  <div class="news-feed-image-div"> ' + NL
      + '    <img class="news-feed-img" src="' + iconUri + '" /> ' + NL
      + '  </div> ' + NL
      + '  <div class="news-feed-title-div"> ' + NL
      + '    <h1 class="title" >' + mintitle + '</h1> ' + NL
      + '    <div class="description" id="' + summaryId + '">' + summary + '</div> ' + NL
      + '    <div class="publicationDate">' + publicationDate + '</div> ' + NL
      + '  </div> ' + NL
      + '  <div class="news-feed-icon-box"> ' + NL
      + '    <img class="news-feed-icon-box-img" src="' + broadcastIcon + '"/> ' + NL
      + '    <img class="news-feed-icon-box-img" id="' + removeId + '" src="image/ico-recycle-' + textColor + '.png" /> ' + NL
      + '    <img class="news-feed-icon-box-img" id="' + favouriteId + '" src="' + favouriteIcon + '" /> ' + NL
      + '  </div> ' + NL
      + '</a>' + NL;

  // log("DEBUG: DisplayLoop: Composited content");
  // log("DEBUG: Composited Content: " + content);

  listItem.html(content);
  $("#manifest").append(listItem);
}

