/*
 * Copyright: Yama Ghulam Farooq. 2013.
 * All rights reserved.
*/
console.log("Database.js Loaded"); 
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
  //Latitude = position.coords.latitude;
  //Longitude = position.coords.longitude;
  //TODO: need to change it to proper location
  Latitude = 51.2345787;
  Longitude = -0.5768667;
	  
alert(Latitude);
  initialize(Latitude,Longitude);
};

var onError = function() {
  console.log("GeoLoc OnError");
  alert('cant access your location');
};

////

var map;
var infowindow;

function initialize() {
	  Latitude = 51.249826;
	  Longitude = -0.608758;
  var pyrmont = new google.maps.LatLng(Latitude,Longitude);

  map = new google.maps.Map(document.getElementById('map-canvas'), {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: pyrmont,
    zoom: 15
  });

  var request = {
    location: pyrmont,
    radius: 1500,
    types: ['university']
  };
  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
}

function callback(results, status) {
  console.log("--------------------------------------------------------------------------------------");
  console.log("Reslt is : "+JSON.stringify(results));
 // addContant(results);

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