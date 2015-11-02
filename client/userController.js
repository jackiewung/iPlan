(function(){
  angular.module('iplanApp')
  .controller('UserController', ['auth', 'DataService', UserController])
  .directive('userViewDir', userViewDir);

  function UserController(auth, DataService) {
    var self = this;
    self.auth = auth;
    self.currentUser = DataService.currentUser;
  }

  function userViewDir(){
    return {
      restrict: 'E',
      // scope: {},
      templateUrl: '/userView.html',
      replace: true,
      controller: 'UserController',
      controllerAs: 'userCtrl',
      bindToController: true
    }
  }
})();
