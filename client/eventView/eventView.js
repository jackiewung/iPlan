(function(){
  angular.module('iplanApp')
  .controller('EventViewController', ['HttpService', 'DataService', '$location', '$route', '$routeParams', '$window', EventViewController])
  .directive('eventViewDir', eventViewDir);

  function EventViewController(HttpService, DataService, $location, $route, $routeParams, $window){ // inject http service, EventService factory
    var self = this;
    self.toggle = {};
    self.placeName;   // tied to input box in eventView.html
    self.choices = []; //
    self.currentEvent = DataService.currentEvent;
    self.events = DataService.events;
    self.currentUser = DataService.currentUser;
    self.eventCode = $location.path().replace('/events/', '');
    self.hidePlace = false;
    self.getTimer = false;
    self.timerInfo = false;
    self.isThereTime = false;

    console.log('evtCtrl user: ', self.currentUser);

    self.showPlace = function(place) {
      if(self.lastChosen === place) {
        if(!self.hidePlace) {
          self.hidePlace = true;
        } else {
          self.hidePlace = false;
        }
      } else {
        self.hidePlace = true;
      }

      self.selectedAddress = place.address;
      self.selectedRating = place.rating_img
      self.lastChosen = place;
      console.log(place, ' is the place you selected')
    }

    self.setEvent = function(){
      HttpService.getEvent(self.eventCode)
      .then(function(response){
        DataService.setCurrentEvent(response.data);
        angular.forEach(response.data.places, function(val, key){
          self.toggle[val.id] = self.toggle[val.id] || false;
        });
        return response.data;
      })
      .catch(function(err){
        console.log('err in evtCtrl setEvent: ', err);
      });
      self.timeCheck();
    };

    self.setUserEvents = function(){
      
    }

    self.refresh = function(eventCode){
      self.eventCode = eventCode;
      self.setEvent();
    };

    self.searchYelp = function(){
      if(self.placeName.length > 2) {
        var term = self.placeName.split(' ').join('+');
        var location = self.currentEvent.location.split(' ').join('+');
        var limit = 5;
        HttpService.callYelp({
          term: term,
          location: location,
          limit: limit
        })
        .then(function(response){
          response.data.forEach(function(choice){
            self.choices.push(choice);
          });
        })
        .catch(function(err){console.log(err)});
      } else {
        self.choices = [];
      }
        self.placeName = '';
    };

    self.postPlace = function(choice){
      HttpService.postPlace({
        name: choice.name,
        address: choice.location.display_address[0] + ", " + choice.location.display_address[1],
        rating_img: choice.rating_img_url,
        url: choice.url,
        category: choice.categories[0][0],
        snippet: choice.snippet_text,
        location: choice.location.coordinate.latitude +','+ choice.location.coordinate.longitude,
        event_id: self.currentEvent.id
      })
      .then(function(response){
        self.refresh(response.data.code);
      })
      .catch(function(err){
        console.log('error in posting place: ', err);
      });
      self.placeName = '';
      self.choices = [];
    };

    self.upVote = function(place) {
      if(!self.toggle[place.id]) {
        self.toggle[place.id] = true;
        place.votes++;
        HttpService.postPlace(place);
        return;
      } else if (self.toggle[place.id]){
        self.toggle[place.id] = false;
        place.votes--;
        HttpService.postPlace(place);
        return;
      }
      self.setEvent();
    };

    self.sendMail = function(){
      var newMail = {
        to: self.to,
        subject: 'You got an invite from iPlan',
        message: self.message
      };

      var temp = self.to.replace(/ /g, '').split(',');

      temp.forEach(function(val, index){
        var found = false;
        var newUser = {
          email: val
        };
        HttpService.sendMail(newMail);
        HttpService.postUser(newUser)
        .then(function(response){
          return response.data;
        })
        .then(function(user){
          HttpService.postEventUser({
            event_id: self.currentEvent.id,
            user_id: user.id,
            user_role: 'guest'
          });
        })
        .catch(function(err){
          console.log('err in postUser as guest: ', err);
        });
        self.refresh(self.eventCode);
      });
    self.message = '';
    self.to = '';
    };

    self.createTimer = function(eventTimeCut) {
      HttpService.putEvent({
        cutoff: self.timerInfo,
        eventId: self.currentEvent.id
      })
      .then(function(response){
        self.refresh(response.data.id)
        self.isThereTime = true;
        self.timerInfo = ''
      })
    }

    self.checkDateTime = function() {
      var date = new Date();
      console.log(date, ' this is the JS date')
      var eventCutoff = self.currentEvent.cutoff
      console.log(eventCutoff, ' this is cutoff time')
      if(date === self.currentEvent.cutoff) {
        console.log('CUTOFF!!!!!!')
      }
    }

    self.timeCheck = function() {
      var check = setInterval(self.checkDateTime(),3000)
    }

    self.setEvent();
  };

  function eventViewDir(){
    return {
      restrict: 'E',
      // scope: {},
      templateUrl: '/eventView/eventView.html',
      replace: true,
      controller: 'EventViewController',
      controllerAs: 'evtCtrl',
      bindToController: true
    }
  }
})();
